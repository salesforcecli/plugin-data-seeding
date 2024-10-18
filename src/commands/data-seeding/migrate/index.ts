/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Duration } from '@salesforce/kit';
import { Messages, PollingClient, StatusResult, SfError } from '@salesforce/core';
import { initiateDataSeed, PollSeedResponse, pollSeedStatus } from '../../../utils/api.js';
import { DataSeedingMigrateResult } from '../../../utils/types.js';
import { getSeedMigrateMso, getSeedMigrateStage as getStage } from '../../../utils/mso.js';
import { MigrateRequestCache } from '../../../utils/cache.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-data-seeding', 'data-seeding.migrate');

export default class DataSeedingMigrate extends SfCommand<DataSeedingMigrateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    // TODO: The org flags will need to use Flags.requiredOrg() once auth is finalized
    'target-org': Flags.string({
      summary: messages.getMessage('flags.target-org.summary'),
      char: 'o',
      required: true,
    }),
    'source-org': Flags.string({
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

  public async run(): Promise<DataSeedingMigrateResult> {
    const { flags } = await this.parse(DataSeedingMigrate);
    const { async, 'config-file': configFile, 'source-org': sourceOrg, 'target-org': targetOrg, wait } = flags;

    const { request_id: jobId } = await initiateDataSeed(configFile, 'data-copy');

    if (!jobId) throw new Error('Failed to receive job id');

    const reportMessage = messages.getMessage('report.suggestion', [jobId]);

    await (await MigrateRequestCache.create()).createCacheEntry(jobId);

    const baseData = { jobId, sourceOrg, targetOrg };

    const buildResponse = (response: PollSeedResponse): DataSeedingMigrateResult => ({
      dataSeedingJob: 'migrate',
      startTime: response?.execution_start_time,
      endTime: response?.execution_end_time,
      status: response.status,
      ...baseData,
    });

    if (wait && !async) {
      const mso = getSeedMigrateMso({ jsonEnabled: this.jsonEnabled() });
      mso.updateData(baseData);

      const completedStatus = ['Completed', 'Partially Completed', 'Failed'];

      const options: PollingClient.Options = {
        poll: async (): Promise<StatusResult> => {
          const response = await pollSeedStatus(jobId);

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
            throw new SfError(
              `Data migration job failed on step: ${pollResult.step}\nLog Text: ${pollResult.log_text}`
            );
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
      const response = await pollSeedStatus(jobId);

      const mso = getSeedMigrateMso({
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
