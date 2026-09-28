import { POST as signupHandler } from '../app/api/auth/signup/route';
import { POST as loginHandler } from '../app/api/auth/login/route';
import { GET as sessionHandler } from '../app/api/auth/session/route';
import { POST as magicLinkHandler } from '../app/api/auth/magic-link/route';
import { POST as verifyMagicLinkHandler } from '../app/api/auth/verify-magic-link/route';
import { POST as forgotPasswordHandler } from '../app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '../app/api/auth/reset-password/route';
import { POST as changePasswordHandler } from '../app/api/auth/change-password/route';
import { POST as refreshHandler } from '../app/api/auth/refresh/route';
import { POST as logoutHandler } from '../app/api/auth/logout/route';
import { NextRequest } from 'next/server';
import { query } from '../lib/db';

function createJsonRequest(url: string, method: string, body?: any, headers?: Record<string, string>): NextRequest {
  const reqHeaders = new Headers({
    'content-type': 'application/json',
    ...headers,
  });

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runApiTests() {
  console.log('🚀 Starting Phase 3 Auth API Endpoints Verification...\n');
  const timestamp = Date.now();
  const testEmail = `api_test_${timestamp}@example.com`;
  const initialPassword = 'Password123!';
  const updatedPassword = 'NewPassword456!';

  // Clean up
  await query('DELETE FROM users WHERE email = $1', [testEmail]);

  // 1. Test POST /api/auth/signup
  console.log('1. Testing POST /api/auth/signup...');
  const signupReq = createJsonRequest('http://localhost:3000/api/auth/signup', 'POST', {
    email: testEmail,
    password: initialPassword,
    fullName: 'API Test User',
  });
  const signupRes = await signupHandler(signupReq);
  const signupData = await signupRes.json();
  if (signupRes.status !== 201 || !signupData.accessToken) {
    throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
  }
  console.log('   ✅ Signup succeeded. User ID:', signupData.user.id);
  const accessToken = signupData.accessToken;

  // 2. Test POST /api/auth/login
  console.log('2. Testing POST /api/auth/login...');
  const loginReq = createJsonRequest('http://localhost:3000/api/auth/login', 'POST', {
    email: testEmail,
    password: initialPassword,
  });
  const loginRes = await loginHandler(loginReq);
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.accessToken) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  console.log('   ✅ Login succeeded.');

  // 3. Test GET /api/auth/session (with Bearer header)
  console.log('3. Testing GET /api/auth/session...');
  const sessionReq = createJsonRequest('http://localhost:3000/api/auth/session', 'GET', undefined, {
    authorization: `Bearer ${accessToken}`,
  });
  const sessionRes = await sessionHandler(sessionReq);
  const sessionData = await sessionRes.json();
  if (sessionRes.status !== 200 || sessionData.user.email !== testEmail) {
    throw new Error(`Session failed: ${JSON.stringify(sessionData)}`);
  }
  console.log('   ✅ Session retrieved successfully for:', sessionData.user.email);

  // 4. Test POST /api/auth/change-password
  console.log('4. Testing POST /api/auth/change-password...');
  const changeReq = createJsonRequest(
    'http://localhost:3000/api/auth/change-password',
    'POST',
    {
      currentPassword: initialPassword,
      newPassword: updatedPassword,
    },
    { authorization: `Bearer ${accessToken}` }
  );
  const changeRes = await changePasswordHandler(changeReq);
  const changeData = await changeRes.json();
  if (changeRes.status !== 200) {
    throw new Error(`Change password failed: ${JSON.stringify(changeData)}`);
  }
  console.log('   ✅ Password changed successfully.');

  // 5. Test POST /api/auth/magic-link
  console.log('5. Testing POST /api/auth/magic-link...');
  const magicReq = createJsonRequest('http://localhost:3000/api/auth/magic-link', 'POST', {
    email: testEmail,
  });
  const magicRes = await magicLinkHandler(magicReq);
  const magicData = await magicRes.json();
  if (magicRes.status !== 200 || !magicData.token) {
    throw new Error(`Magic link failed: ${JSON.stringify(magicData)}`);
  }
  console.log('   ✅ Magic link generated token.');

  // 6. Test POST /api/auth/verify-magic-link
  console.log('6. Testing POST /api/auth/verify-magic-link...');
  const verifyMagicReq = createJsonRequest('http://localhost:3000/api/auth/verify-magic-link', 'POST', {
    email: testEmail,
    token: magicData.token,
  });
  const verifyMagicRes = await verifyMagicLinkHandler(verifyMagicReq);
  const verifyMagicData = await verifyMagicRes.json();
  if (verifyMagicRes.status !== 200 || !verifyMagicData.accessToken) {
    throw new Error(`Verify magic link failed: ${JSON.stringify(verifyMagicData)}`);
  }
  console.log('   ✅ Magic link verified successfully.');

  // 7. Test POST /api/auth/forgot-password
  console.log('7. Testing POST /api/auth/forgot-password...');
  const forgotReq = createJsonRequest('http://localhost:3000/api/auth/forgot-password', 'POST', {
    email: testEmail,
  });
  const forgotRes = await forgotPasswordHandler(forgotReq);
  const forgotData = await forgotRes.json();
  if (forgotRes.status !== 200 || !forgotData.token) {
    throw new Error(`Forgot password failed: ${JSON.stringify(forgotData)}`);
  }
  console.log('   ✅ Forgot password token generated.');

  // 8. Test POST /api/auth/reset-password
  console.log('8. Testing POST /api/auth/reset-password...');
  const resetPassFinal = 'FinalPassword789!';
  const resetReq = createJsonRequest('http://localhost:3000/api/auth/reset-password', 'POST', {
    email: testEmail,
    token: forgotData.token,
    newPassword: resetPassFinal,
  });
  const resetRes = await resetPasswordHandler(resetReq);
  const resetData = await resetRes.json();
  if (resetRes.status !== 200) {
    throw new Error(`Reset password failed: ${JSON.stringify(resetData)}`);
  }
  console.log('   ✅ Password reset successfully.');

  // Cleanup
  await query('DELETE FROM users WHERE email = $1', [testEmail]);
  console.log('\n🎉 ALL 8 Phase 3 Auth API Endpoints Verified Successfully!');
  process.exit(0);
}

runApiTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
