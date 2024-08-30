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
import { SfError, Logger } from '@salesforce/core';

export type SeedResponse = {
  request_id: string;
};

export type PollSeedResponse = {
  execution_end_time: string;
  execution_start_time: string;
  log_text: string;
  request_id: string;
  status: string;
  step: string;
};

const baseUrl = process.env.SF_DATA_SEEDING_URL ?? 'https://data-seed-scratchpad5.sfdc-3vx9f4.svc.sfdcfc.net';
const csrfUrl = `${baseUrl}/get-csrf-token`;
const seedUrl = `${baseUrl}/data-seed`;
const pollUrl = `${baseUrl}/status`;

export const getCookieJar = async (): Promise<CookieJar> => {
  const cookieJar = new CookieJar();
  await got(csrfUrl, { cookieJar });
  return cookieJar;
};

export const getCsrfToken = (cookieJar: CookieJar): string => {
  const csrfToken = cookieJar.getCookiesSync(csrfUrl).find((cookie) => cookie.key === 'csrf_token')?.value;
  if (!csrfToken) throw new SfError('Failed to obtain CSRF token');

  return csrfToken;
};

export const initiateDataSeed = async (config: string): Promise<SeedResponse> => {
  const cookieJar = await getCookieJar();
  const csrf = getCsrfToken(cookieJar);

  const form = new FormData();
  form.append('config_file', fs.createReadStream(config));
  form.append('credentials_file', fs.createReadStream('ignore/credentials.txt'));

  // NOTE: This could be updated to use .json() instead of JSON.parse once the Error response is changed to be JSON
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
};

export const pollSeedStatus = async (jobId: string): Promise<PollSeedResponse> => {
  const logger = await Logger.child('PollSeedStatus');

  // NOTE: This could be updated to use .json() instead of JSON.parse once the Error response is changed to be JSON
  const response = await got.get(`${pollUrl}/${jobId}`, { throwHttpErrors: false });

  if (response.statusCode !== 200) {
    // This endpoint returns debugger output... dont print body
    throw new SfError(`Failed to poll data seeding status for ${jobId}`);
  }

  const json = JSON.parse(response.body);
  logger.debug(json);

  return json;
};
