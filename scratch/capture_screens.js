const http = require('http');
const fs = require('fs');
const path = require('path');

function fetchPage(url, cookie = 'dev_super_admin=true') {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log('Testing Super Admin URLs...');
  const dashboardRes = await fetchPage('http://localhost:3000/super-admin/dashboard');
  console.log('Dashboard Status:', dashboardRes.statusCode);
  console.log('Dashboard Has INNOVENTIX SUPER ADMIN:', dashboardRes.body.includes('SUPER ADMIN'));
  console.log('Dashboard Has Platform Overview:', dashboardRes.body.includes('Platform Operator Overview'));

  const orgsRes = await fetchPage('http://localhost:3000/super-admin/organizations');
  console.log('Organizations Status:', orgsRes.statusCode);
  console.log('Organizations Has Registered Tenants:', orgsRes.body.includes('Registered Tenants'));

  const detailRes = await fetchPage('http://localhost:3000/super-admin/organizations/00000000-0000-0000-0000-000000000001');
  console.log('Org Detail Status:', detailRes.statusCode);
  console.log('Org Detail Has Innoventix Hub:', detailRes.body.includes('Innoventix Hub'));
}

run().catch(console.error);
