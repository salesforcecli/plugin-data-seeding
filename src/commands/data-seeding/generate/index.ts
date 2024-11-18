/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, PollingClient, SfError, StatusResult } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { initiateDataSeed, pollSeedStatus, PollSeedResponse, initiateJWTMint } from '../../../utils/api.js';
import { getSeedGenerateMso, getSeedGenerateStage as getStage } from '../../../utils/mso.js';
import { DataSeedingGenerateResult } from '../../../utils/types.js';
import { GenerateRequestCache } from '../../../utils/cache.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-data-seeding', 'data-seeding.generate');

export default class DataSeedingGenerate extends SfCommand<DataSeedingGenerateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    // TODO: The org flags will need to use Flags.requiredOrg() once auth is finalized
    'target-org': Flags.requiredOrg({
      summary: messages.getMessage('flags.target-org.summary'),
      char: 'o',
      required: true,
    }),
    'source-org': Flags.requiredOrg({
      summary: messages.getMessage('flags.source-org.summary'),
      char: 's',
      required: true,
    }),
    'config-file': Flags.file({
      summary: messages.getMessage('flags.config-file.summary'),
      char: 'f',
      required: true,
      exists: true,
    }),
    wait: Flags.duration({
      summary: messages.getMessage('flags.wait.summary'),
      char: 'w',
      unit: 'minutes',
      defaultValue: 33,
      min: 1,
      exclusive: ['async'],
    }),
    async: Flags.boolean({
      summary: messages.getMessage('flags.async.summary'),
      exclusive: ['wait'],
    }),
  };

  public async run(): Promise<DataSeedingGenerateResult> {
    const { flags } = await this.parse(DataSeedingGenerate);
    const { async, 'config-file': configFile, 'source-org': srcOrgObj, 'target-org': tgtOrgObj, wait } = flags;

    const sourceOrg = srcOrgObj.getOrgId();
    const srcAccessToken = srcOrgObj.getConnection().accessToken as string;
    const srcOrgInstUrl = srcOrgObj.getConnection().instanceUrl;

    const targetOrg = tgtOrgObj.getOrgId();
    const tgtAccessToken = tgtOrgObj.getConnection().accessToken as string;
    const tgtOrgInstUrl = tgtOrgObj.getConnection().instanceUrl;

    // Fetch Valid JWT with Data Seed Org Perm
    const { jwt: jwtValue } = await initiateJWTMint(srcOrgInstUrl, srcAccessToken, tgtOrgInstUrl, tgtAccessToken);
    const { request_id: jobId } = await initiateDataSeed(
      configFile,
      'data-generation',
      jwtValue,
      srcOrgInstUrl,
      srcAccessToken,
      tgtOrgInstUrl,
      tgtAccessToken,
      sourceOrg
    );
    const reportMessage = messages.getMessage('report.suggestion', [jobId]);

    if (!jobId) throw new Error('Failed to receive job id');

    const baseData = { jobId, sourceOrg, targetOrg };

    await (await GenerateRequestCache.create()).createCacheEntry(jobId);

    const buildResponse = (response: PollSeedResponse): DataSeedingGenerateResult => ({
      dataSeedingJob: 'generate',
      startTime: response?.execution_start_time,
      endTime: response?.execution_end_time,
      status: response.status,
      ...baseData,
    });

    if (wait && !async) {
      const mso = getSeedGenerateMso({ jsonEnabled: this.jsonEnabled() });
      mso.updateData(baseData);

      const completedStatus = ['Completed', 'Partially Completed', 'Failed'];

      const options: PollingClient.Options = {
        poll: async (): Promise<StatusResult> => {
          const { jwt: jwtValueNew } = await initiateJWTMint(
            srcOrgInstUrl,
            srcAccessToken,
            tgtOrgInstUrl,
            tgtAccessToken
          );
          const response = await pollSeedStatus(jobId, jwtValueNew);

          mso.goto(getStage(response.step), {
            startTime: response.execution_start_time,
            endTime: response.execution_end_time,
            status: response.status,
          });

          return {
            completed: completedStatus.includes(response.status),
            payload: response,
          };
        },
        frequency: Duration.seconds(1),
        timeout: wait,
      };

      try {
        const client = await PollingClient.create(options);
        const pollResult: PollSeedResponse = await client.subscribe();

        switch (pollResult.status) {
          case 'Completed':
            mso.stop();
            break;
          case 'Failed':
            mso.error();
            throw new SfError(`Data seeding job failed on step: ${pollResult.step}\nLog Text: ${pollResult.log_text}`);
          case 'Partially Completed':
            mso.stop('warning');
            this.log(`Process partially completed: ${pollResult.log_text}`);
            break;
          default:
            mso.stop('current');
        }

        return buildResponse(pollResult);
      } catch (e) {
        const err = SfError.wrap(e as Error);

        if (err.message.includes('The client has timed out')) {
          mso.updateData({ status: 'Client Timeout' });
          err.actions = [reportMessage];
          mso.stop('current');
        } else {
          mso.error();
        }

        throw err;
      }
    } else {
      const { jwt: jwtValueNew } = await initiateJWTMint(srcOrgInstUrl, srcAccessToken, tgtOrgInstUrl, tgtAccessToken);
      const response = await pollSeedStatus(jobId, jwtValueNew);

      const mso = getSeedGenerateMso({
        jsonEnabled: this.jsonEnabled(),
        showElapsedTime: false,
        showStageTime: false,
      });

      mso.goto(getStage(response.step), {
        ...baseData,
        startTime: response.execution_start_time,
        status: 'Initiated',
      });

      mso.stop('async');
      this.log(reportMessage);

      return buildResponse(response);
    }
  }
}
