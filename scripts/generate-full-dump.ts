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
  '.agents',
  '.gemini',
]);

const ignoreFiles = new Set([
  'full_project_dump.md',
  'package-lock.json',
  'tsconfig.tsbuildinfo',
  '.env.local',
  '.env',
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

  // Level 1: Root configuration and dependency manifests
  if (norm.startsWith('config/')) {
    return 1;
  }

  // Level 2: Main entry point / initialization files
  const level2Files = new Set([
    'middleware.ts',
    'app/layout.tsx',
    'app/page.tsx',
    'app/globals.css',
    'lib/db/index.ts',
    'lib/db/auto-migrate.ts',
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

  // Level 1: Root configuration and dependency manifests
  if (!norm.includes('/')) {
    if (
      norm.endsWith('.json') ||
      norm.endsWith('.mjs') ||
      norm.endsWith('.mts') ||
      norm.endsWith('.cts') ||
      norm.endsWith('.js') ||
      norm.endsWith('.ts') ||
      norm.endsWith('.yml') ||
      norm.endsWith('.yaml') ||
      norm.startsWith('.env') ||
      norm.startsWith('.docker') ||
      norm.startsWith('.prettier') ||
      norm.startsWith('.eslint') ||
      norm.startsWith('.git') ||
      norm === 'Dockerfile' ||
      norm.startsWith('docker-compose')
    ) {
      if (!norm.endsWith('.md')) {
        return 1;
      }
    }
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

  // Level 5: Platform-specific configurations, deployment scripts, tests, workflows, docs
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
      if (!ignoreDirs.has(item.name)) {
        scanDir(fullPath, fileList);
      }
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (!ignoreFiles.has(item.name) && !binaryExts.has(ext)) {
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

console.log('Scanning repository from:', rootDir);
const files = scanDir(rootDir);

// Sort by level ascending (1 to 5), then by relative path alphabetically
files.sort((a, b) => {
  if (a.level !== b.level) {
    return a.level - b.level;
  }
  return a.relPath.localeCompare(b.relPath);
});

console.log(`Discovered ${files.length} total files.`);

const levelCounts = [0, 0, 0, 0, 0, 0];
files.forEach((f) => levelCounts[f.level]++);

console.log(`Level 1 (Config & Manifests): ${levelCounts[1]} files`);
console.log(`Level 2 (Entry Points & Init): ${levelCounts[2]} files`);
console.log(`Level 3 (Backend & Services):  ${levelCounts[3]} files`);
console.log(`Level 4 (UI & Components):     ${levelCounts[4]} files`);
console.log(`Level 5 (Scripts, Tests, Docs): ${levelCounts[5]} files`);

const outStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

let writtenCount = 0;
let totalBytes = 0;

for (const file of files) {
  try {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    outStream.write(`--- FILE: ${file.relPath} ---\n`);
    outStream.write(content);
    if (!content.endsWith('\n')) {
      outStream.write('\n');
    }
    outStream.write('\n');
    writtenCount++;
    totalBytes += content.length;
  } catch (err: any) {
    console.error(`Error writing ${file.relPath}:`, err.message);
  }
}

outStream.end(() => {
  const stat = fs.statSync(outputFile);
  console.log(`Successfully generated ${outputFile}`);
  console.log(`Files written: ${writtenCount} / ${files.length}`);
  console.log(`Total output size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`);
});
