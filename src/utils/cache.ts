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

export class MigrateRequestCache extends DataSeedingRequestCache {
  public static getDefaultOptions(): TTLConfig.Options {
    return {
      isGlobal: true,
      isState: true,
      filename: 'data-seeding-migrate-request-cache.json',
      stateFolder: Global.SF_STATE_FOLDER,
      ttl: Duration.days(14),
    };
  }

  public static async unset(key: string): Promise<void> {
    const cache = await MigrateRequestCache.create();
    cache.unset(key);
    await cache.write();
  }
}
