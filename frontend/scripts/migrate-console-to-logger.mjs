#!/usr/bin/env node
/**
 * Codemod: Migrate console.* → logger.*
 * 
 * Transforms:
 *   console.log('msg')       → logger.info('msg')
 *   console.log('msg', data) → logger.info('msg', data)
 *   console.error('msg', e)  → logger.error('msg', e)
 *   console.warn('msg')      → logger.warn('msg')
 *   console.info('msg')      → logger.info('msg')
 *
 * Also adds `import { logger } from '@/lib/logger';` if not already present.
 * 
 * Skips:
 *   - lib/logger.ts (the logger itself)
 *   - *.backup* files
 *   - node_modules
 *   - Files that already import logger AND have no console.* calls
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const SCAN_DIRS = ['app/api', 'app/actions', 'lib'];
const SKIP_FILES = ['lib/logger.ts', 'lib/email.ts']; // email.ts already migrated
const SKIP_PATTERNS = [/node_modules/, /\.backup/, /\.d\.ts$/];

const CONSOLE_REGEX = /\bconsole\.(log|error|warn|info)\b/g;

function getAllTsFiles(dir) {
  const results = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...getAllTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

function shouldSkip(filePath) {
  const rel = relative(ROOT, filePath);
  if (SKIP_FILES.includes(rel)) return true;
  return SKIP_PATTERNS.some(p => p.test(rel));
}

function migrateFile(filePath) {
  const rel = relative(ROOT, filePath);
  let content = readFileSync(filePath, 'utf-8');

  // Check if file has console.* calls
  if (!CONSOLE_REGEX.test(content)) return null;
  CONSOLE_REGEX.lastIndex = 0;

  // Count matches before
  const matches = content.match(CONSOLE_REGEX);
  const count = matches ? matches.length : 0;

  // Already has logger import?
  const hasLoggerImport = /import\s+\{[^}]*logger[^}]*\}\s+from\s+['"]@\/lib\/logger['"]/.test(content);

  // Replace console.log → logger.info, console.error → logger.error, etc.
  let newContent = content
    .replace(/\bconsole\.log\b/g, 'logger.info')
    .replace(/\bconsole\.error\b/g, 'logger.error')
    .replace(/\bconsole\.warn\b/g, 'logger.warn')
    .replace(/\bconsole\.info\b/g, 'logger.info');

  // Add import if missing
  if (!hasLoggerImport) {
    // Find the best place to add the import
    // After last import statement
    const importRegex = /^import\s+.*$/gm;
    let lastImportEnd = 0;
    let m;
    while ((m = importRegex.exec(newContent)) !== null) {
      // Handle multi-line imports
      let endPos = m.index + m[0].length;
      // Check if import continues on next lines (multi-line)
      if (m[0].includes('{') && !m[0].includes('}')) {
        const closeBrace = newContent.indexOf('}', endPos);
        if (closeBrace !== -1) {
          // Find end of line after closing brace
          const lineEnd = newContent.indexOf('\n', closeBrace);
          endPos = lineEnd !== -1 ? lineEnd : closeBrace + 1;
        }
      }
      lastImportEnd = endPos;
    }

    if (lastImportEnd > 0) {
      // Insert after last import
      const insertPos = newContent.indexOf('\n', lastImportEnd);
      if (insertPos !== -1) {
        newContent = 
          newContent.slice(0, insertPos + 1) +
          "import { logger } from '@/lib/logger';\n" +
          newContent.slice(insertPos + 1);
      }
    } else {
      // No imports found, add at top (after 'use server' or 'use client' if present)
      const directiveMatch = newContent.match(/^['"]use (server|client)['"];?\s*\n/);
      if (directiveMatch) {
        const afterDirective = directiveMatch.index + directiveMatch[0].length;
        newContent = 
          newContent.slice(0, afterDirective) +
          "\nimport { logger } from '@/lib/logger';\n" +
          newContent.slice(afterDirective);
      } else {
        newContent = "import { logger } from '@/lib/logger';\n\n" + newContent;
      }
    }
  }

  if (newContent !== content) {
    writeFileSync(filePath, newContent, 'utf-8');
    return { file: rel, replacements: count, importAdded: !hasLoggerImport };
  }

  return null;
}

// Main
console.log('🔄 Migrating console.* → logger.* ...\n');

let totalFiles = 0;
let totalReplacements = 0;
const results = [];

for (const dir of SCAN_DIRS) {
  const fullDir = join(ROOT, dir);
  try {
    const files = getAllTsFiles(fullDir);
    for (const file of files) {
      if (shouldSkip(file)) continue;
      const result = migrateFile(file);
      if (result) {
        results.push(result);
        totalFiles++;
        totalReplacements += result.replacements;
      }
    }
  } catch (err) {
    console.error(`⚠️ Error scanning ${dir}:`, err.message);
  }
}

console.log('📊 Results:');
console.log(`   Files modified: ${totalFiles}`);
console.log(`   console.* replaced: ${totalReplacements}`);
console.log('');

for (const r of results) {
  const importTag = r.importAdded ? ' (+import)' : '';
  console.log(`   ✅ ${r.file}: ${r.replacements} replacements${importTag}`);
}

console.log('\n✅ Migration complete!');
