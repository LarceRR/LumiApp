import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifests = ['dev', 'staging', 'production'].map((name) => JSON.parse(readFileSync(resolve('deploy/environments', `${name}.json`), 'utf8')));
const appConfig = readFileSync(resolve('app.config.js'), 'utf8');
const errors = [];

if (!appConfig.includes('EXPO_PUBLIC_API_BASE_URL') || !appConfig.includes('EXPO_PUBLIC_WEBSOCKET_URL')) errors.push('app.config.js не использует environment-specific public endpoint variables');
if (/JWT_|DATABASE_URL|REDIS_URL|SECRET|PASSWORD|TOKEN/.test(appConfig)) errors.push('app.config.js содержит имя секретной конфигурации');

for (const manifest of manifests) {
  const env = manifest.name === 'development' ? 'development' : manifest.name;
  const output = execFileSync('node', ['-e', `process.stdout.write(JSON.stringify({apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? null, websocketUrl: process.env.EXPO_PUBLIC_WEBSOCKET_URL ?? null}))`], {
    env: { ...process.env, EXPO_PUBLIC_API_BASE_URL: manifest.apiBaseUrl, EXPO_PUBLIC_WEBSOCKET_URL: manifest.websocketUrl, NODE_ENV: env },
    encoding: 'utf8',
  });
  const parsed = JSON.parse(output);
  if (parsed.apiBaseUrl !== manifest.apiBaseUrl || parsed.websocketUrl !== manifest.websocketUrl) errors.push(`${manifest.name}: public endpoints не совпали с manifest`);
  if (manifest.clientSecretRefs.length !== 0) errors.push(`${manifest.name}: clientSecretRefs не пуст`);
}

if (errors.length > 0) {
  console.error(`Client environment smoke нарушен: ${errors.length} проблем`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('Client environment smoke подтверждён: endpoints only, secrets absent');
