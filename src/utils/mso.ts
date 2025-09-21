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

import { MultiStageOutput, MultiStageOutputOptions } from '@oclif/multi-stage-output';
import { StandardColors } from '@salesforce/sf-plugins-core';
import { SfError } from '@salesforce/core';

type SeedGenerateMsoData = {
  jobId: string;
  startTime?: string;
  endTime?: string;
  sourceOrg?: string;
  targetOrg?: string;
  status?: string;
};

type SeedMsoOverrides = Partial<MultiStageOutputOptions<SeedGenerateMsoData>>;

type MsoGet = string | undefined;

/* Data Seed Generation */

// The keys in this Map are steps returned by the server
//  - They have been converted to lowercase for later comparison
// The values in this Map are used as the stage names in mso
const seedGenerateStagesMap = new Map<string, string>([
  ['init','Initializing'],
  ['querying source org', 'Querying Source Org'],
  ['data generation', 'Data Generation'],
  ['populating target org', 'Populating Target Org'],
  ['pipeline finished', 'Finalizing'],
]);

export const getSeedGenerateStage = (step: string): string => {
  const stage = seedGenerateStagesMap.get(step.toLowerCase());
  if (!stage) throw new SfError(`Unable to map step (${step}) from server to multi-stage-output stage`);
  return stage;
};

export const getSeedGenerateMso = (overrides: SeedMsoOverrides = {}): MultiStageOutput<SeedGenerateMsoData> => {
  const defaults: SeedMsoOverrides = {
    title: 'Data Seed Generation',
    stages: Array.from(seedGenerateStagesMap.values()),
    ...overrides,
  };

  return getSeedMso(defaults);
};

/* Data Seed Migration */

const seedMigrateStagesMap = new Map<string, string>([
  ['querying source org', 'Querying Source Org'],
  ['populating target org', 'Populating Target Org'],
  ['pipeline finished', 'Finalizing'],
]);

export const getSeedMigrateStage = (step: string): string => {
  const stage = seedMigrateStagesMap.get(step.toLowerCase());
  if (!stage) throw new SfError(`Unable to map step (${step}) from server to multi-stage-output stage`);
  return stage;
};

export const getSeedMigrateMso = (overrides: SeedMsoOverrides = {}): MultiStageOutput<SeedGenerateMsoData> => {
  const defaults: SeedMsoOverrides = {
    title: 'Data Seed Migration',
    stages: Array.from(seedMigrateStagesMap.values()),
    ...overrides,
  };

  return getSeedMso(defaults);
};

/* Shared MSO config */

const getSeedMso = (overrides: SeedMsoOverrides = {}): MultiStageOutput<SeedGenerateMsoData> =>
  new MultiStageOutput({
    preStagesBlock: [
      {
        get: (data): MsoGet => data?.jobId,
        type: 'static-key-value',
        label: 'Job ID',
        neverCollapse: true,
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
            case 'Client Timeout':
            case 'Partially Completed':
              return StandardColors.warning(status);
            case 'Failed':
              return StandardColors.error(status);
            default:
              return status;
          }
        },
        type: 'static-key-value',
        label: 'Status',
        neverCollapse: true,
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
    stages: [],
    title: '',
    ...overrides,
  });
