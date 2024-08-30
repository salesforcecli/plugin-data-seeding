/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { MultiStageOutput, MultiStageOutputOptions } from '@oclif/multi-stage-output';
import { StandardColors } from '@salesforce/sf-plugins-core';

type SeedGenerateMsoData = {
  jobId: string;
  startTime?: string;
  endTime?: string;
  sourceOrg?: string;
  targetOrg?: string;
  status?: string;
};

// The keys in this Map are steps returned by the server
// They have been converted to lowercase for later comparison
// ---
// The values in this Map are used as the stage names in mso
export const seedGenerateStagesMap = new Map<string, string>([
  ['querying source org', 'Querying Source Org'],
  ['data generation', 'Data Generation'],
  ['populating target org', 'Populating Target Org'],
  ['pipeline finished', 'Finalizing'],
]);

// Maps a step returned by the server to a stage name in the multi-stage output
// Throws an error if the step is not recognized
export const getSeedGenerateStage = (step: string): string => {
  const stage = seedGenerateStagesMap.get(step.toLowerCase());
  if (!stage) throw new Error(`Unable to map step (${step}) from server to multi-stage-output stage`);
  return stage;
}

type MsoGet = string | undefined;

export const getSeedGenerateMso = (overrides: Partial<MultiStageOutputOptions<SeedGenerateMsoData>> = {}): MultiStageOutput<SeedGenerateMsoData> =>
  new MultiStageOutput({
    preStagesBlock: [
      {
        get: (data): MsoGet => data?.jobId,
        type: 'static-key-value',
        label: 'Job ID',
      },
      {
        get: (data): MsoGet => data?.sourceOrg,
        type: 'static-key-value',
        label: 'Source Org',
      },
      {
        get: (data): MsoGet => data?.targetOrg,
        type: 'static-key-value',
        label: 'Target Org',
      },
    ],
    postStagesBlock: [
      {
        get: (data): MsoGet => {
          const status = data?.status;
          switch (status) {
            case 'Completed':
            case 'Initiated':
              return StandardColors.success(status);
            case 'Failed':
              return StandardColors.error(status);
            case 'Client Timeout':
              return StandardColors.warning(status);
            default:
              return status;
          }
        },
        type: 'static-key-value',
        label: 'Status',
      },
      {
        get: (data): MsoGet => data?.startTime,
        type: 'static-key-value',
        label: 'Start Time',
      },
      {
        get: (data): MsoGet => data?.endTime,
        type: 'static-key-value',
        label: 'End Time',
      },
    ],
    jsonEnabled: false,
    stages: Array.from(seedGenerateStagesMap.values()),
    title: 'Data Seed Generation',
    ...overrides,
  });
