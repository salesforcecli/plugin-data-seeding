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
export type ServletResponse = {
  jwt: string;
};

export type PollSeedResponse = {
  execution_end_time: string;
  execution_start_time: string;
  log_text: string;
  request_id: string;
  status: string;
  step: string;
};

export type DataSeedingOperation = 'data-generation' | 'data-copy';

// TODO Change to SFAP Endpoint
const baseUrl = process.env.SF_DATA_SEEDING_URL ?? 'https://data-seed-gid.sfdc-yfeipo.svc.sfdcfc.net';
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

export const initiateDataSeed = async (
  config: string,
  operation: DataSeedingOperation,
  jwt: string
): Promise<SeedResponse> => {
  // const cookieJar = await getCookieJar();
  // const csrf = getCsrfToken(cookieJar);
  const form = new FormData();
  form.append('config_file', fs.createReadStream(config));
  // TODO : Remove credential file once SFAP is active and dataseed endpoint accepts orgurl and token
  form.append('credentials_file', fs.createReadStream('ignore/credentials.txt'));
  form.append('operation', operation);
  // TODO: Update to use .json() instead of JSON.parse once the Error response is changed to be JSON
  //       Update the return type as well
  const response = await got.post(seedUrl, {
    throwHttpErrors: false,
    // cookieJar,
    headers: {
      ...form.getHeaders(),
      // 'X-CSRFToken': csrf,
      Authorization: 'Bearer ' + jwt,
    },
    body: form,
  });

  if (response.statusCode !== 200) {
    throw new SfError(`Failed to initiate data-seeding operation (${operation}). Response:\n${response.body}`);
  }

  return JSON.parse(response.body) as SeedResponse;
};

export const initiateJWTMint = async (
  srcOrgUrl: string,
  srcAccessToken: string,
  tgtOrgUrl: string,
  tgtAccessToken: string
): Promise<ServletResponse> => {
  const srcServletUrl = srcOrgUrl + '/dataseed/auth';
  const responseSrc = await got.post(srcServletUrl, {
    throwHttpErrors: false,
    headers: {
      Authorization: 'Bearer ' + srcAccessToken,
    },
  });

  if (responseSrc.statusCode !== 200) {
    const tgtServletUrl = tgtOrgUrl + '/dataseed/auth';
    const responseTgt = await got.post(tgtServletUrl, {
      throwHttpErrors: false,
      headers: {
        Authorization: 'Bearer ' + tgtAccessToken,
      },
    });
    if (responseTgt.statusCode !== 200) {
      throw new SfError(
        `Org permission for data seed not found in source & target org.\nSource Response: Error Code : ${responseSrc.statusCode} - ${responseSrc.body}.  \nTarget Response: Error Code : ${responseTgt.statusCode} - ${responseTgt.body}`
      );
    }
    return JSON.parse(responseTgt.body) as ServletResponse;
  }

  return JSON.parse(responseSrc.body) as ServletResponse;
};

export const pollSeedStatus = async (jobId: string): Promise<PollSeedResponse> => {
  const logger = await Logger.child('PollSeedStatus');

  // TODO: Update to use .json() instead of JSON.parse once the Error response is changed to be JSON
  //       Update the return type as well
  const response = await got.get(`${pollUrl}/${jobId}`, { throwHttpErrors: false });

  if (response.statusCode !== 200) {
    // TODO: Print error body once the Error response is changed to be JSON
    throw new SfError(`Failed to poll data seeding status for ${jobId}`);
  }

  const json = JSON.parse(response.body) as PollSeedResponse;
  logger.debug(json);

  return json;
};
