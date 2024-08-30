/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, PollingClient, SfError, StatusResult } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { initiateDataSeed, pollSeedStatus, PollSeedResponse } from '../../utils/api.js';
import { getSeedGenerateMso, getSeedGenerateStage as getStage } from '../../utils/mso.js';
import { DataSeedingGenerateResult } from '../../utils/types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-data-seeding', 'data-seeding.generate');
export default class DataSeedingGenerate extends SfCommand<DataSeedingGenerateResult> {
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

  public async run(): Promise<DataSeedingGenerateResult> {
    const { flags } = await this.parse(DataSeedingGenerate);
    const { async, 'config-file': configFile, 'source-org': sourceOrg, 'target-org': targetOrg, wait } = flags;

    const { request_id: jobId } = await initiateDataSeed(configFile);

    if (!jobId) throw new Error('Failed to receive job id');

    const buildResponse = (response: PollSeedResponse): DataSeedingGenerateResult => ({
      dataSeedingJob: 'generate',
      jobId,
      startTime: response?.execution_start_time,
      endTime: response?.execution_end_time,
      sourceOrg,
      targetOrg,
      status: response.status,
    });

    // TODO: Cache the jobId so that it can be used by the `--use-most-recent` flag

    if (wait && !async) {
      const mso = getSeedGenerateMso({ jsonEnabled: this.jsonEnabled() });
      mso.updateData({ jobId, sourceOrg, targetOrg });

      const options: PollingClient.Options = {
        poll: async (): Promise<StatusResult> => {
          const response = await pollSeedStatus(jobId);

          mso.goto(getStage(response.step), {
            startTime: response.execution_start_time,
            endTime: response.execution_end_time,
            status: response.status,
          });

          return {
            completed: response.status === 'Completed' || response.status === 'Failed',
            payload: response,
          };
        },
        frequency: Duration.seconds(1),
        timeout: wait,
      };

      try {
        const client = await PollingClient.create(options);
        const pollResult: PollSeedResponse = await client.subscribe();

        if (pollResult.status === 'Failed') {
          mso.error();
          throw new SfError(`Data seeding job failed on step: ${pollResult.step}\nLog Text: ${pollResult.log_text}`);
        } else {
          mso.stop();
        }

        return buildResponse(pollResult);
      } catch (e) {
        const err = SfError.wrap(e as Error);

        if (err.message.includes('The client has timed out')) {
          mso.updateData({ status: 'Client Timeout' });
          err.actions = [
            '- Increase the value of the "--wait" flag',
            `- Check the status with: sf data-seeding report -i ${jobId}`,
          ];
        }

        mso.stop();
        throw err;
      }
    } else {
      const response = await pollSeedStatus(jobId);

      const mso = getSeedGenerateMso({
        jsonEnabled: this.jsonEnabled(),
        showElapsedTime: false,
        showStageTime: false,
      });

      mso.goto(getStage(response.step), {
        jobId,
        sourceOrg,
        targetOrg,
        startTime: response.execution_start_time,
        status: 'Initiated',
      });

      mso.stop();
      this.log(`- Check the status with: sf data-seeding report -i ${jobId}`);

      return buildResponse(response);
    }
  }
}
