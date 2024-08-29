/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { MultiStageOutput } from '@oclif/multi-stage-output';
import { StandardColors } from '@salesforce/sf-plugins-core';

type SeedGenerateMsoData = {
  jobId: string;
  startTime?: string;
  endTime?: string;
  sourceOrg?: string;
  targetOrg?: string;
  status?: string;
};

export const getSeedGenerateMso = (jsonEnabled: boolean = false) => new MultiStageOutput<SeedGenerateMsoData>({
  preStagesBlock: [
    {
      get: (data) => data?.jobId,
      type: 'static-key-value',
      label: 'Job ID',
    },
    {
      get: (data) => data?.sourceOrg,
      type: 'static-key-value',
      label: 'Source Org',
    },
    {
      get: (data) => data?.targetOrg,
      type: 'static-key-value',
      label: 'Target Org',
    }
  ],
  postStagesBlock: [
    {
      get: (data) => {
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
      get: (data) => data?.startTime,
      type: 'static-key-value',
      label: 'Start Time',
    },
    {
      get: (data) => data?.endTime,
      type: 'static-key-value',
      label: 'End Time',
    }
  ],
  jsonEnabled,
  stages: [
    'Querying source org',
    'Data generation',
    'Populating target org',
    'Pipeline Finished',
  ],
  title: 'Data Seed Generation',
});
