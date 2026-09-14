const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outputFile = path.join(rootDir, 'full_project_dump.md');

const ignoreDirs = new Set(['node_modules', '.next', '.git', 'graphify-out', 'scratch']);
const ignoreFiles = new Set(['full_project_dump.md', 'package-lock.json', 'tsconfig.tsbuildinfo']);

function getCategoryLevel(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  
  // Level 1: Root configuration, manifests, root md files
  if (!normalized.includes('/')) {
    if (normalized.endsWith('.json') || normalized.endsWith('.config.ts') || normalized.endsWith('.config.js') || normalized.startsWith('.env') || normalized.endsWith('.yml') || normalized.endsWith('.md')) {
      return 1;
    }
  }

  // Level 2: Main entry point/initialization files
  if (normalized === 'middleware.ts' || normalized === 'app/layout.tsx' || normalized === 'app/page.tsx' || normalized === 'app/globals.css' || normalized === 'lib/supabase/client.ts' || normalized === 'lib/supabase/server.ts') {
    return 2;
  }

  // Level 3: Core services, API handlers, backend logic, supabase DB migrations/schemas
  if (normalized.startsWith('lib/') || normalized.startsWith('app/actions/') || normalized.startsWith('app/api/') || normalized.startsWith('supabase/')) {
    return 3;
  }

  // Level 4: UI components, screens, app pages
  if (normalized.startsWith('components/') || normalized.startsWith('app/')) {
    return 4;
  }

  // Level 5: Platform/infra scripts, documentation, prompts
  return 5;
}

function scanDir(dir, fileList = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relPath = path.relative(rootDir, fullPath);

    if (item.isDirectory()) {
      if (!ignoreDirs.has(item.name)) {
        scanDir(fullPath, fileList);
      }
    } else {
      if (!ignoreFiles.has(item.name)) {
        fileList.push({
          fullPath,
          relPath: relPath.replace(/\\/g, '/'),
          level: getCategoryLevel(relPath)
        });
      }
    }
  }

  return fileList;
}

console.log('Scanning directory:', rootDir);
const files = scanDir(rootDir);

// Sort by level ascending, then by relPath alphabetically
files.sort((a, b) => {
  if (a.level !== b.level) return a.level - b.level;
  return a.relPath.localeCompare(b.relPath);
});

console.log(`Found ${files.length} files to include in dump.`);

const outStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

let processedCount = 0;
for (const file of files) {
  try {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    outStream.write(`--- FILE: ${file.relPath} ---\n`);
    outStream.write(content);
    if (!content.endsWith('\n')) {
      outStream.write('\n');
    }
    outStream.write('\n');
    processedCount++;
  } catch (err) {
    console.error(`Failed to read file ${file.relPath}:`, err.message);
  }
}

outStream.end(() => {
  console.log(`Successfully generated full_project_dump.md with ${processedCount} files.`);
});
