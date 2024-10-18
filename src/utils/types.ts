/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type DataSeedingJob = 'generate' | 'migrate';

export type DataSeedingReportResult = {
  dataSeedingJob: DataSeedingJob;
  jobId: string;
  startTime?: string;
  endTime?: string;
  status?: string;
};

export type DataSeedingGenerateResult = DataSeedingReportResult & {
  sourceOrg: string;
  targetOrg: string;
};

export type DataSeedingMigrateResult = DataSeedingReportResult & {
  sourceOrg: string;
  targetOrg: string;
};
