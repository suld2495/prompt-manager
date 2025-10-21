// Patch Prisma client output to avoid relying on package imports that break under Node 22 CJS
const fs = require('fs');
const path = require('path');

function patchPrismaDefault() {
  let pkgJsonPath;
  try {
    pkgJsonPath = require.resolve('@prisma/client/package.json');
  } catch (error) {
    console.warn('[patch-prisma-client] @prisma/client is not installed. Skipping.');
    return;
  }

  const defaultClientPath = path.join(
    path.dirname(pkgJsonPath),
    '..',
    '..',
    '.prisma',
    'client',
    'default.js'
  );

  if (!fs.existsSync(defaultClientPath)) {
    console.warn(
      `[patch-prisma-client] Could not locate generated client at ${defaultClientPath}. Skipping.`
    );
    return;
  }

  const original = fs.readFileSync(defaultClientPath, 'utf8');

  if (!original.includes("#main-entry-point")) {
    console.log('[patch-prisma-client] No patch needed.');
    return;
  }

  const patched = original.replace(
    /require\('#main-entry-point'\)/g,
    "require('./index.js')"
  );

  if (patched === original) {
    console.log('[patch-prisma-client] Nothing changed.');
    return;
  }

  fs.writeFileSync(defaultClientPath, patched, 'utf8');
  console.log(`[patch-prisma-client] Patched ${defaultClientPath}.`);
}

patchPrismaDefault();
