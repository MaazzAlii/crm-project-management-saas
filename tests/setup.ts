import nextEnv from '@next/env';

const projectDir = process.cwd();
nextEnv.loadEnvConfig(projectDir, true);

// In automated test suite, default to console email provider so tests do not make real network SMTP requests
process.env.EMAIL_PROVIDER = 'console';


