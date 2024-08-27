/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { initiateDataSeed } from '../../utils/api.js'

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-data-seeding', 'data-seeding.generate');

export type DataSeedingGenerateResult = {
  path: string;
};

export default class DataSeedingGenerate extends SfCommand<DataSeedingGenerateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    // 'target-org': Flags.requiredOrg({
    //   summary: messages.getMessage('flags.target-org.summary'),
    //   char: 'o',
    //   required: true,
    // }),
    // 'source-org': Flags.requiredOrg({
    //   summary: messages.getMessage('flags.source-org.summary'),
    //   char: 's',
    //   required: true,
    // }),
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
    const { 'config-file': config } = flags;

    const response = await initiateDataSeed(config);

    console.log(response); // eslint-disable-line no-console

    return {
      path: 'src/commands/data-seeding/generate.ts',
    };
  }
}
