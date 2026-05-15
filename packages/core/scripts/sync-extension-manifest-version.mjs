import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const coreDir = resolve(import.meta.dirname, '..');
const workspaceDir = resolve(coreDir, '..', '..');
const corePackageJsonPath = resolve(coreDir, 'package.json');
const extensionManifestPath = resolve(workspaceDir, 'apps', 'extension', 'manifest.json');

const corePackageJson = JSON.parse(await readFile(corePackageJsonPath, 'utf8'));
const extensionManifest = JSON.parse(await readFile(extensionManifestPath, 'utf8'));

const targetVersion = corePackageJson.version;
const previousManifestVersion = extensionManifest.version;

if (previousManifestVersion !== targetVersion) {
  extensionManifest.version = targetVersion;
  await writeFile(extensionManifestPath, `${JSON.stringify(extensionManifest, null, 2)}\n`);
  console.log(
    `[sync-version] apps/extension/manifest.json: ${previousManifestVersion} -> ${targetVersion}`,
  );
} else {
  console.log(`[sync-version] apps/extension/manifest.json already at ${targetVersion}`);
}

if (process.env.npm_config_git_tag_version !== 'false') {
  execFileSync('git', ['add', 'apps/extension/manifest.json'], {
    cwd: workspaceDir,
    stdio: 'inherit',
  });
}
