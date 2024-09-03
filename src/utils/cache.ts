/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { TTLConfig, Global, SfError } from '@salesforce/core';
import { Duration } from '@salesforce/kit';

export type SeedingOptions = {
  jobId: string;
};

export type SeedingCacheConfig = {
  jobId: string;
};

export abstract class DataSeedingRequestCache extends TTLConfig<TTLConfig.Options, SeedingCacheConfig> {
  public static getDefaultOptions(): TTLConfig.Options {
    return {
      isGlobal: true,
      isState: true,
      filename: DataSeedingRequestCache.getFileName(),
      stateFolder: Global.SF_STATE_FOLDER,
      ttl: Duration.days(14),
    };
  }

  public async createCacheEntry(jobId: string): Promise<void> {
    if (!jobId) throw new SfError('Job ID is required to create a cache entry');

    this.set(jobId, { jobId });
    await this.write();
  }

  public resolveFromCache(): SeedingOptions {
    const key = this.getLatestKey();
    if (!key) throw new SfError('Could not find a job ID to resume');

    const { jobId } = this.get(key);
    return { jobId };
  }
}

export class GenerateRequestCache extends DataSeedingRequestCache {
  public static getDefaultOptions(): TTLConfig.Options {
    return {
      isGlobal: true,
      isState: true,
      filename: 'data-seeding-generate-request-cache.json',
      stateFolder: Global.SF_STATE_FOLDER,
      ttl: Duration.days(14),
    };
  }

  public static async unset(key: string): Promise<void> {
    const cache = await GenerateRequestCache.create();
    cache.unset(key);
    await cache.write();
  }
}


