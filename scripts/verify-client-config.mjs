import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifests = ['dev', 'staging', 'production'].map((name) => JSON.parse(readFileSync(resolve('deploy/environments', `${name}.json`), 'utf8')));
const appConfig = readFileSync(resolve('app.config.js'), 'utf8');
const errors = [];

const publicApiVariable = 'EXPO_PUBLIC_API_BASE_URL';
const publicWebsocketVariable = 'EXPO_PUBLIC_WEBSOCKET_URL';

if (!appConfig.includes(`process.env.${publicApiVariable}`) || !appConfig.includes(`process.env.${publicWebsocketVariable}`)) {
  errors.push('app.config.js должен читать только два public endpoint variable');
}

for (const forbidden of ['JWT_', 'DATABASE_URL', 'REDIS_URL', 'SECRET', 'PASSWORD', 'TOKEN']) {
  if (appConfig.includes(forbidden)) errors.push(`app.config.js содержит запрещённый конфигурационный ключ: ${forbidden}`);
}

const seenEndpoints = new Set();
for (const manifest of manifests) {
  if (typeof manifest.apiBaseUrl !== 'string' || typeof manifest.websocketUrl !== 'string') {
    errors.push(`${manifest.name}: public endpoints должны быть строками`);
    continue;
  }

  const endpointPair = `${manifest.apiBaseUrl}${manifest.websocketUrl}`;
  if (seenEndpoints.has(endpointPair)) errors.push(`${manifest.name}: endpoint pair не уникален`);
  seenEndpoints.add(endpointPair);

  if (manifest.clientSecretRefs.length !== 0) errors.push(`${manifest.name}: clientSecretRefs не пуст`);
  if (manifest.apiBaseUrl.startsWith('postgres:') || manifest.apiBaseUrl.startsWith('redis:')) errors.push(`${manifest.name}: database/cache URL попал в клиентский endpoint`);
  if (manifest.websocketUrl.startsWith('postgres:') || manifest.websocketUrl.startsWith('redis:')) errors.push(`${manifest.name}: database/cache URL попал в клиентский endpoint`);
}

if (errors.length > 0) {
  console.error(`Client environment smoke нарушен: ${errors.length} проблем`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('Client environment smoke подтверждён: endpoints only, secrets absent');
