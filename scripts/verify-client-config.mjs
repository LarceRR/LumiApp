import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifests = ['dev', 'staging', 'production'].map((name) => JSON.parse(readFileSync(resolve('deploy/environments', `${name}.json`), 'utf8')));
const appConfig = readFileSync(resolve('app.config.js'), 'utf8');
const errors = [];

for (const variable of ['EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_WEBSOCKET_URL']) {
  if (!appConfig.includes(`process.env.${variable}`)) errors.push(`app.config.js не читает ${variable}`);
}

for (const manifest of manifests) {
  if (manifest.clientSecretRefs.length !== 0) errors.push(`${manifest.name}: clientSecretRefs не пуст`);
  if (!/^https?:\/\//.test(manifest.apiBaseUrl) && !/^http:\/\//.test(manifest.apiBaseUrl)) errors.push(`${manifest.name}: API endpoint имеет неожиданный протокол`);
  if (!/^wss?:\/\//.test(manifest.websocketUrl)) errors.push(`${manifest.name}: WebSocket endpoint имеет неожиданный протокол`);
  if (/^(postgres|redis):\/\//.test(manifest.apiBaseUrl) || /^(postgres|redis):\/\//.test(manifest.websocketUrl)) errors.push(`${manifest.name}: private resource URL попал в клиентский endpoint`);
}

if (errors.length > 0) {
  console.error(`Client environment smoke нарушен: ${errors.length} проблем`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('Client environment smoke подтверждён: public endpoints only');
