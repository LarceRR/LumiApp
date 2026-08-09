import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(process.cwd(), 'deploy/environments');
const files = readdirSync(directory).filter((file) => file.endsWith('.json')).sort();
const manifests = files.map((file) => ({ file, value: JSON.parse(readFileSync(resolve(directory, file), 'utf8')) }));
const expected = new Set(['development', 'staging', 'production']);
const errors = [];

if (manifests.length !== expected.size) errors.push(`ожидалось ${expected.size} manifest-файла, найдено ${manifests.length}`);

const names = manifests.map(({ value }) => value.name);
if (new Set(names).size !== names.length) errors.push('имена окружений должны быть уникальны');
for (const name of names) if (!expected.has(name)) errors.push(`неизвестное окружение ${String(name)}`);

for (const { file, value } of manifests) {
  for (const field of ['name', 'resourceNamespace', 'databaseResource', 'redisResource', 'storageBucket', 'apiBaseUrl', 'websocketUrl']) {
    if (typeof value[field] !== 'string' || value[field].length === 0) errors.push(`${file}: отсутствует ${field}`);
  }
  if (!Array.isArray(value.secretRefs) || value.secretRefs.length === 0) errors.push(`${file}: нет secretRefs`);
  if (!Array.isArray(value.clientSecretRefs) || value.clientSecretRefs.length !== 0) errors.push(`${file}: clientSecretRefs должен быть пустым`);
}

for (const field of ['resourceNamespace', 'databaseResource', 'redisResource', 'storageBucket', 'apiBaseUrl', 'websocketUrl']) {
  const values = manifests.map(({ value }) => value[field]);
  if (new Set(values).size !== values.length) errors.push(`${field}: значения окружений должны быть уникальны`);
}

const staging = manifests.find(({ value }) => value.name === 'staging')?.value;
const production = manifests.find(({ value }) => value.name === 'production')?.value;
if (staging && production) {
  if (staging.secretRefs.some((ref) => String(ref).includes('/production/'))) errors.push('staging ссылается на production secret');
  if (production.secretRefs.some((ref) => String(ref).includes('/staging/'))) errors.push('production ссылается на staging secret');
}

if (errors.length > 0) {
  console.error(`Environment isolation нарушена: ${errors.length} проблем`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Environment isolation подтверждена: ${names.join(', ')}`);
