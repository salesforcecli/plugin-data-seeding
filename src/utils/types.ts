/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export type DataSeedingReportResult = {
  dataSeedingJob: string;
  jobId: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

export type DataSeedingGenerateResult = DataSeedingReportResult & {
  sourceOrg: string;
  targetOrg: string;
};