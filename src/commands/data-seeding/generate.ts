/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, PollingClient, SfError, StatusResult } from '@salesforce/core';
import { Duration } from '@salesforce/kit';
import { initiateDataSeed, pollSeedStatus, PollSeedResponse } from '../../utils/api.js'
import { getSeedGenerateMso } from '../../utils/mso.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-data-seeding', 'data-seeding.generate');

export type DataSeedingGenerateResult = {
  dataSeedingJob: string;
  jobId: string;
  startTime?: string;
  endTime?: string;
  sourceOrg: string;
  targetOrg: string;
  status?: string;
};
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
    const {
      async,
      'config-file': configFile,
      'source-org': sourceOrg,
      'target-org': targetOrg,
      wait
    } = flags;

    const { request_id: jobId } = await initiateDataSeed(configFile);

    if (!jobId) throw new Error('Failed to receive job id');

    // TODO: Cache the jobId so that it can be used by the `--use-most-recent` flag

    const mso = getSeedGenerateMso(this.jsonEnabled());
    mso.updateData({ jobId, sourceOrg, targetOrg });

    if (wait && !async) {
      const options: PollingClient.Options = {
        poll: async (): Promise<StatusResult> => {
          const response = await pollSeedStatus(jobId);
          mso.goto(response.step);

          mso.updateData({
            startTime: response.execution_start_time,
            endTime: response.execution_end_time,
            status: response.status
          })

          const completed = response.status === 'Completed'
          const failed = response.status === 'Failed';

          if (completed) mso.stop();
          if (failed) {
            const err = new SfError(`Data seeding job failed on step: ${response.step}\nLog Text: ${response.log_text}`);
            mso.stop(err);
            throw err;
          }

          return {
            completed: completed || failed,
            payload: response,
          };
        },
        frequency: Duration.seconds(1),
        timeout: wait
      };

      try {
        const client = await PollingClient.create(options);
        const pollResult: PollSeedResponse = await client.subscribe();

        return {
          dataSeedingJob: 'generate',
          jobId,
          startTime: pollResult?.execution_start_time,
          endTime: pollResult?.execution_end_time,
          sourceOrg,
          targetOrg,
          status: pollResult.status
        }
      } catch (e) {
        const err = SfError.wrap(e as Error);

        if (err.message.includes('The client has timed out')) {
          mso.updateData({ status: 'Client Timeout' });

          err.actions = [
            '- Increase the value of the "--wait" flag',
            `- Check the status with: sf data-seeding report -i ${jobId}`
          ];
        }
        mso.stop();
        throw err;
      }
    } else {
      const response = await pollSeedStatus(jobId);

      mso.goto(response.step);

      mso.updateData({
        startTime: response.execution_start_time,
        status: 'Initiated'
      })

      mso.stop();

      this.log('Data seeding process has been initiated\n');
      this.log(`- Check the status with: sf data-seeding report -i ${jobId}`);

      return {
        dataSeedingJob: 'generate',
        jobId,
        startTime: response?.execution_start_time,
        endTime: response?.execution_end_time,
        sourceOrg,
        targetOrg,
        status: response.status
      };
    }
  }
}
