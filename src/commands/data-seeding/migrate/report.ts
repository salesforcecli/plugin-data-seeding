/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import { pollSeedStatus } from '../../../utils/api.js';
import { getSeedMigrateMso, getSeedMigrateStage as getStage } from '../../../utils/mso.js';
import { DataSeedingReportResult } from '../../../utils/types.js';
import { MigrateRequestCache } from '../../../utils/cache.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-data-seeding', 'data-seeding.migrate.report');

export default class DataSeedingMigrateReport extends SfCommand<DataSeedingReportResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    'job-id': Flags.string({
      summary: messages.getMessage('flags.job-id.summary'),
      char: 'i',
      exactlyOne: ['job-id', 'use-most-recent'],
    }),
    'use-most-recent': Flags.boolean({
      summary: messages.getMessage('flags.use-most-recent.summary'),
      char: 'r',
      exactlyOne: ['job-id', 'use-most-recent'],
    }),
  };

  public async run(): Promise<DataSeedingReportResult> {
    const { flags } = await this.parse(DataSeedingMigrateReport);

    const jobId = flags['job-id'] ?? (await MigrateRequestCache.create()).resolveFromCache().jobId;

    if (!jobId) throw new SfError('No job ID provided or found in cache');

    const response = await pollSeedStatus(jobId, '');

    const data = {
      jobId,
      startTime: response.execution_start_time,
      endTime: response.execution_end_time,
      status: response.status,
    };

    const mso = getSeedMigrateMso({
      jsonEnabled: this.jsonEnabled(),
      showElapsedTime: false,
      showStageTime: false,
    });

    mso.goto(getStage(response.step), data);

    switch (response.status) {
      case 'In Progress':
        mso.stop('current');
        break;
      case 'Partially Completed':
        mso.stop('warning');
        this.log(`Process partially completed: ${response.log_text}`);
        break;
      case 'Failed':
        mso.error();
        throw new SfError(`Failed on step: ${response.step}\nLog Text: ${response.log_text}`);
      default:
        mso.stop();
    }

    return {
      dataSeedingJob: 'migrate',
      ...data,
    };
  }
}
