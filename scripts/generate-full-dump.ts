import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const outputFile = path.join(rootDir, 'full_project_dump.md');

const ignoreDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  'graphify-out',
  'test-results',
  'playwright-report',
  'coverage',
  '.gemini',
]);

const ignoreFiles = new Set([
  'full_project_dump.md',
  'package-lock.json',
  'tsconfig.tsbuildinfo',
]);

const binaryExts = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.webp',
  '.webm',
  '.mp4',
  '.pdf',
  '.zip',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]);

function getCategoryLevel(relPath: string): number {
  const norm = relPath.replace(/\\/g, '/');

  // Level 1: Root configuration and dependency manifests & env templates
  if (
    norm.startsWith('config/') ||
    norm === 'package.json' ||
    norm === 'tsconfig.json' ||
    norm === 'next.config.mjs' ||
    norm === 'next.config.js' ||
    norm === 'tailwind.config.ts' ||
    norm === 'postcss.config.js' ||
    norm === 'playwright.config.ts' ||
    norm === 'vitest.config.ts' ||
    norm === 'Dockerfile' ||
    norm.startsWith('docker-compose') ||
    norm === '.dockerignore' ||
    norm === '.gitignore' ||
    norm === '.eslintrc.json' ||
    norm === '.prettierrc' ||
    norm.endsWith('.example') ||
    norm.includes('ENV-TEMPLATE')
  ) {
    return 1;
  }

  // Root level json / ts / js config files
  if (!norm.includes('/')) {
    if (
      norm.endsWith('.json') ||
      norm.endsWith('.mjs') ||
      norm.endsWith('.mts') ||
      norm.endsWith('.cts') ||
      norm.endsWith('.js') ||
      norm.endsWith('.ts') ||
      norm.endsWith('.yml') ||
      norm.endsWith('.yaml')
    ) {
      if (!norm.endsWith('.md')) {
        return 1;
      }
    }
  }

  // Level 2: Main entry point / initialization files
  const level2Files = new Set([
    'middleware.ts',
    'app/layout.tsx',
    'app/page.tsx',
    'app/globals.css',
    'app/not-found.tsx',
    'app/error.tsx',
    'app/loading.tsx',
    'lib/db/index.ts',
    'lib/db/auto-migrate.ts',
    'lib/db/embedded-migrations.ts',
    'lib/auth/session.ts',
    'lib/auth/jwt.ts',
    'lib/auth/edge-jwt.ts',
    'lib/auth/middleware.ts',
    'lib/auth/password.ts',
    'lib/auth/auth-service.ts',
    'lib/auth/super-admin.ts',
    'lib/portal/auth.ts',
  ]);
  if (level2Files.has(norm)) {
    return 2;
  }

  // Level 3: Core services, API handlers, backend logic, migrations, actions
  if (
    norm.startsWith('lib/') ||
    norm.startsWith('app/api/') ||
    norm.startsWith('app/actions/') ||
    norm.startsWith('supabase/') ||
    norm.endsWith('actions.ts')
  ) {
    return 3;
  }

  // Level 4: UI components, screens, styling
  if (
    norm.startsWith('components/') ||
    norm.startsWith('styles/') ||
    norm.startsWith('app/')
  ) {
    return 4;
  }

  // Level 5: Platform-specific configurations, deployment scripts, tests, workflows, documentation
  return 5;
}

interface FileEntry {
  fullPath: string;
  relPath: string;
  level: number;
  size: number;
}

function scanDir(dir: string, fileList: FileEntry[] = []): FileEntry[] {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (item.isDirectory()) {
      if (
        !ignoreDirs.has(item.name) &&
        !ignoreDirs.has(relPath) &&
        !item.name.startsWith('.next')
      ) {
        scanDir(fullPath, fileList);
      }
    } else {
      const ext = path.extname(item.name).toLowerCase();
      // Environment template check: allow .env.example, .env.*.example, forbid actual secrets like .env or .env.local
      const isEnvExample = item.name.includes('.example') || item.name.includes('TEMPLATE');
      const isSecretEnv =
        (item.name === '.env' ||
          item.name === '.env.local' ||
          item.name.startsWith('.env.') ||
          item.name.endsWith('.env')) &&
        !isEnvExample;

      if (!ignoreFiles.has(item.name) && !binaryExts.has(ext) && !isSecretEnv) {
        const stat = fs.statSync(fullPath);
        fileList.push({
          fullPath,
          relPath,
          level: getCategoryLevel(relPath),
          size: stat.size,
        });
      }
    }
  }

  return fileList;
}

const files = scanDir(rootDir);

// Include curated graph report if present
const graphReportPath = path.join(rootDir, 'graphify-out', 'GRAPH_REPORT.md');
if (fs.existsSync(graphReportPath) && !files.some((f) => f.relPath === 'graphify-out/GRAPH_REPORT.md')) {
  const stat = fs.statSync(graphReportPath);
  files.push({
    fullPath: graphReportPath,
    relPath: 'graphify-out/GRAPH_REPORT.md',
    level: 5,
    size: stat.size,
  });
}

// Sort by level ascending (Level 1 to 5), then alphabetically by path
files.sort((a, b) => {
  if (a.level !== b.level) {
    return a.level - b.level;
  }
  return a.relPath.localeCompare(b.relPath);
});

console.log(`Discovered ${files.length} total files across the repository.`);

const levelCounts = [0, 0, 0, 0, 0, 0];
const levelBytes = [0, 0, 0, 0, 0, 0];
files.forEach((f) => {
  levelCounts[f.level]++;
  levelBytes[f.level] += f.size;
});

console.log(`Level 1 (Config & Manifests): ${levelCounts[1]} files (${(levelBytes[1] / 1024).toFixed(1)} KB)`);
console.log(`Level 2 (Entry Points & Init): ${levelCounts[2]} files (${(levelBytes[2] / 1024).toFixed(1)} KB)`);
console.log(`Level 3 (Backend & Services):  ${levelCounts[3]} files (${(levelBytes[3] / 1024).toFixed(1)} KB)`);
console.log(`Level 4 (UI & Components):     ${levelCounts[4]} files (${(levelBytes[4] / 1024).toFixed(1)} KB)`);
console.log(`Level 5 (Platform & Scripts):  ${levelCounts[5]} files (${(levelBytes[5] / 1024).toFixed(1)} KB)`);

const outStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

let writtenCount = 0;
let totalBytes = 0;

for (const file of files) {
  try {
    const rawContent = fs.readFileSync(file.fullPath, 'utf8');
    outStream.write(`--- FILE: ${file.relPath} ---\n`);
    outStream.write(rawContent);
    if (!rawContent.endsWith('\n')) {
      outStream.write('\n');
    }
    outStream.write('\n');
    writtenCount++;
    totalBytes += rawContent.length;
  } catch (err: any) {
    console.error(`Error reading/writing ${file.relPath}:`, err.message);
  }
}

outStream.end(() => {
  const stat = fs.statSync(outputFile);
  console.log(`\n======================================================`);
  console.log(`Successfully generated: ${outputFile}`);
  console.log(`Total Files Written:    ${writtenCount} / ${files.length}`);
  console.log(`Total Output File Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`);
  console.log(`======================================================\n`);
});
