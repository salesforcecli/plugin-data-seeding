/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'node:fs';
import got from 'got';
import { CookieJar } from 'tough-cookie';
import FormData from 'form-data';
import { SfError } from '@salesforce/core';

export type SeedResponse = {
  'request_id': string;
}

const csrfUrl = process.env.SF_DATA_SEEDING_CSRF_URL ?? 'https://data-seed-scratchpad5.sfdc-3vx9f4.svc.sfdcfc.net/get-csrf-token';
const seedUrl = process.env.SF_DATA_SEEDING_URL ?? 'https://data-seed-scratchpad5.sfdc-3vx9f4.svc.sfdcfc.net/data-seed';

export const getCookieJar = async (): Promise<CookieJar> => {
  const cookieJar = new CookieJar();
  await got(csrfUrl, { cookieJar });
  return cookieJar;
}

export const getCsrfToken = (cookieJar: CookieJar): string => {
  const csrfToken = cookieJar.getCookiesSync(csrfUrl).find((cookie) => cookie.key === 'csrf_token')?.value;
  if (!csrfToken) throw new SfError('Failed to obtain CSRF token')

  return csrfToken;
}

export const initiateDataSeed = async (config: string): Promise<SeedResponse> => {
  const cookieJar = await getCookieJar()
  const csrf = getCsrfToken(cookieJar);

  const form = new FormData();
  form.append('config_file', fs.createReadStream(config));
  form.append('credentials_file', fs.createReadStream('ignore/credentials.txt'));

  const response = await got.post(seedUrl, {
    throwHttpErrors: false,
    cookieJar,
    headers: {
      ...form.getHeaders(),
      'X-CSRFToken': csrf,
    },
    body: form,
  });

  if (response.statusCode !== 200) {
    throw new SfError(`Failed to initiate data seeding:\n${response.body}`);
  }

  return JSON.parse(response.body);
}