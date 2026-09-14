const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const outputFile = path.join(rootDir, 'full_project_dump.md');

// Directories / files to ignore
const IGNORED_PATHS = [
  'node_modules',
  '.next',
  'out',
  'build',
  '.git',
  'coverage',
  '.DS_Store',
  'full_project_dump.md',
  'graphify-out',
  '.agent-state.md'
];

function isIgnored(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return IGNORED_PATHS.some(ignored => 
    normalized === ignored || normalized.startsWith(ignored + '/')
  );
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (isIgnored(relPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(relPath);
    }
  }

  return fileList;
}

function getLevel(relPath) {
  if (!relPath.includes('/')) {
    return 1; // Root files
  }
  if (relPath.startsWith('app/layout') || relPath.startsWith('app/page') || relPath.startsWith('app/globals') || relPath === 'middleware.ts') {
    return 2; // Main entry / initialization
  }
  if (relPath.startsWith('lib/') || relPath.startsWith('supabase/') || relPath.startsWith('app/actions/') || relPath.startsWith('app/api/')) {
    return 3; // Backend / logic
  }
  if (relPath.startsWith('components/') || relPath.startsWith('app/')) {
    return 4; // UI components & pages
  }
  return 5; // Infra / docs / prompts / other
}

function generateDump() {
  const allFiles = getAllFiles(rootDir);

  allFiles.sort((a, b) => {
    const lvlA = getLevel(a);
    const lvlB = getLevel(b);
    if (lvlA !== lvlB) return lvlA - lvlB;
    return a.localeCompare(b);
  });

  let output = `# Full Project Dump — CRM Project Management SaaS\n\n`;

  for (const relPath of allFiles) {
    const fullPath = path.join(rootDir, relPath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      output += `--- FILE: ${relPath} ---\n`;
      output += `${content}\n\n`;
    } catch (err) {
      console.warn(`Skipping binary or unreadable file: ${relPath}`);
    }
  }

  fs.writeFileSync(outputFile, output, 'utf8');
  console.log(`Successfully generated full_project_dump.md (${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB)`);
}

generateDump();
