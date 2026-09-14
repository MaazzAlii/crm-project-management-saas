const crypto = require('crypto');

const secret = 'dev_jwt_secret_key_32_characters_long_min';

function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

const anonPayload = {
  iss: 'supabase',
  ref: 'local',
  role: 'anon',
  iat: 1600000000,
  exp: 2000000000
};

const servicePayload = {
  iss: 'supabase',
  ref: 'local',
  role: 'service_role',
  iat: 1600000000,
  exp: 2000000000
};

const anonToken = signJwt(anonPayload);
const serviceToken = signJwt(servicePayload);

console.log('ANON_TOKEN:', anonToken);
console.log('SERVICE_TOKEN:', serviceToken);
