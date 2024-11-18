/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'node:fs';
import got from 'got';
import FormData from 'form-data';
import { SfError, Logger } from '@salesforce/core';

export type SeedResponse = {
  request_id: string;
};
export type ServletResponse = {
  jwt: string;
};
export type AuthServletResponse = {
  statusCode: string;
  body: string;
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

const baseUrl = 'https://api.salesforce.com/platform/data-seed/v1';
const seedUrl = `${baseUrl}/data-seed`;
const pollUrl = `${baseUrl}/status`;
const sfRegion = 'us-east-1'
export const initiateDataSeed = async (
  config: string,
  operation: DataSeedingOperation,
  jwt: string,
  srcOrgUrl: string,
  srcAccessToken: string,
  tgtOrgUrl: string,
  tgtAccessToken: string,
  srcOrgId: string
): Promise<SeedResponse> => {
  const form = new FormData();
  form.append('config_file', fs.createReadStream(config));
  form.append('operation', operation);
  form.append('source_access_token', srcAccessToken);
  form.append('source_instance_url', srcOrgUrl);
  form.append('target_access_token', tgtAccessToken);
  form.append('target_instance_url', tgtOrgUrl);
  form.append('source_org_id',srcOrgId);
  // TODO: Update to use .json() instead of JSON.parse once the Error response is changed to be JSON
  //       Update the return type as well
  const response = await got.post(seedUrl, {
    throwHttpErrors: false,
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${jwt}`,
      'x-salesforce-region':sfRegion,
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
  const srcServletUrl = `${srcOrgUrl}/dataseed/auth`;
  const tgtServletUrl = `${tgtOrgUrl}/dataseed/auth`;

  const [responseSrc, responseTgt] = await Promise.all([
    callAuthServlet(srcServletUrl, srcAccessToken),
    callAuthServlet(tgtServletUrl, tgtAccessToken),
  ]);

  if (responseSrc.statusCode === '200') {
    return JSON.parse(responseSrc.body) as ServletResponse;
  }

  if (responseTgt.statusCode === '200') {
    return JSON.parse(responseTgt.body) as ServletResponse;
  }

  throw new SfError(
    `Org permission for data seed not found in either the source or target org.\nSource Response: Error Code : ${responseSrc.statusCode} - ${responseSrc.body}.  \nTarget Response: Error Code : ${responseTgt.statusCode} - ${responseTgt.body}`
  );
};

const callAuthServlet = async (url: string, accessToken: string): Promise<AuthServletResponse> => {
  const response = await got.post(url, {
    throwHttpErrors: false,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return {
    statusCode: response.statusCode.toString(), // Convert to string
    body: response.body,
  };
};

export const pollSeedStatus = async (jobId: string, jwt: string): Promise<PollSeedResponse> => {
  const logger = await Logger.child('PollSeedStatus');

  // TODO: Update to use .json() instead of JSON.parse once the Error response is changed to be JSON
  //       Update the return type as well
  const headers = {
    Authorization: `Bearer ${jwt}`,
    'x-salesforce-region': sfRegion,
  };
  const response = await got.get(`${pollUrl}/${jobId}`, { throwHttpErrors: false, headers });

  if (response.statusCode !== 200) {
    // TODO: Print error body once the Error response is changed to be JSON
    throw new SfError(`Failed to poll data seeding status for ${jobId}`);
  }

  const json = JSON.parse(response.body) as PollSeedResponse;
  logger.debug(json);

  return json;
};
