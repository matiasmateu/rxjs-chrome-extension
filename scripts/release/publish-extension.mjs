import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const requiredEnvVars = [
  'CWS_EXTENSION_ID',
  'CWS_PUBLISHER_ID',
  'CWS_CLIENT_ID',
  'CWS_CLIENT_SECRET',
  'CWS_REFRESH_TOKEN',
  'CWS_ZIP_PATH',
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  console.error(`[cws] Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const extensionId = process.env.CWS_EXTENSION_ID;
const publisherId = process.env.CWS_PUBLISHER_ID;
const clientId = process.env.CWS_CLIENT_ID;
const clientSecret = process.env.CWS_CLIENT_SECRET;
const refreshToken = process.env.CWS_REFRESH_TOKEN;
const zipPath = resolve(process.cwd(), process.env.CWS_ZIP_PATH);
const itemName = `publishers/${publisherId}/items/${extensionId}`;

const token = await refreshAccessToken({
  clientId,
  clientSecret,
  refreshToken,
});

console.log(`[cws] Uploading extension package from ${zipPath}`);
const zipBuffer = await readFile(zipPath);

const uploadResponse = await requestJson(
  `https://chromewebstore.googleapis.com/upload/v2/${itemName}:upload`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/zip',
    },
    body: zipBuffer,
  },
  'Upload extension package',
);

let uploadState = uploadResponse.uploadState;
if (uploadState === 'IN_PROGRESS') {
  uploadState = await waitForUploadCompletion(itemName, token);
}

if (uploadState !== 'SUCCEEDED') {
  throw new Error(`[cws] Upload did not succeed (uploadState=${uploadState})`);
}

console.log('[cws] Upload succeeded, submitting publish request');
const publishResponse = await requestJson(
  `https://chromewebstore.googleapis.com/v2/${itemName}:publish`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  },
  'Publish extension',
);

console.log(
  `[cws] Publish request accepted (itemId=${publishResponse.itemId ?? extensionId}, state=${publishResponse.state ?? 'UNKNOWN'})`,
);

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const tokenResponse = await requestJson(
    'https://oauth2.googleapis.com/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
    'Fetch OAuth access token',
  );

  if (typeof tokenResponse.access_token !== 'string' || tokenResponse.access_token.length === 0) {
    throw new Error('[cws] OAuth token response did not include access_token');
  }

  return tokenResponse.access_token;
}

async function waitForUploadCompletion(itemName, token) {
  const maxAttempts = 12;
  const delayMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await wait(delayMs);

    const statusResponse = await requestJson(
      `https://chromewebstore.googleapis.com/v2/${itemName}:fetchStatus`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      `Fetch upload status (attempt ${attempt}/${maxAttempts})`,
    );

    const state = statusResponse.lastAsyncUploadState;
    console.log(`[cws] Upload status attempt ${attempt}/${maxAttempts}: ${state ?? 'UNKNOWN'}`);

    if (state === 'SUCCEEDED') {
      return state;
    }

    if (state === 'FAILED') {
      throw new Error('[cws] Upload status returned FAILED');
    }

    if (
      state &&
      state !== 'IN_PROGRESS' &&
      state !== 'NOT_FOUND' &&
      state !== 'UPLOAD_STATE_UNSPECIFIED'
    ) {
      throw new Error(`[cws] Unexpected upload state: ${state}`);
    }
  }

  throw new Error('[cws] Upload stayed IN_PROGRESS too long');
}

async function requestJson(url, init, label) {
  const response = await fetch(url, init);
  const payload = await parseJson(response);

  if (!response.ok) {
    const details = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(
      `[cws] ${label} failed (${response.status} ${response.statusText}): ${details}`,
    );
  }

  return payload;
}

async function parseJson(response) {
  const text = await response.text();

  if (text.length === 0) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function wait(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}
