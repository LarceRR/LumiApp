import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(process.cwd(), 'deploy/environments');
const files = readdirSync(directory).filter((file) => file.endsWith('.json')).sort();
const manifests = files.map((file) => ({ file, value: JSON.parse(readFileSync(resolve(directory, file), 'utf8')) }));
const requiredNames = ['development', 'staging', 'production'];
const errors = [];

if (manifests.length !== requiredNames.length) errors.push(`ожидалось ${requiredNames.length} manifest-файла, найдено ${manifests.length}`);

const seenNames = new Set();
for (const { file, value } of manifests) {
  for (const field of ['name', 'resourceNamespace', 'databaseResource', 'redisResource', 'storageBucket', 'apiBaseUrl', 'websocketUrl']) {
    if (typeof value[field] !== 'string' || value[field].length === 0) errors.push(`${file}: отсутствует ${field}`);
  }

  if (!requiredNames.includes(value.name)) errors.push(`${file}: неизвестное имя окружения ${value.name}`);
  if (seenNames.has(value.name)) errors.push(`дублируется окружение ${value.name}`);
  seenNames.add(value.name);
  if (!Array.isArray(value.secretRefs) || value.secretRefs.length === 0) errors.push(`${file}: нет secretRefs`);
  if (value.clientSecretRefs?.length !== 0) errors.push(`${file}: секреты нельзя передавать клиенту`);
  if (/password|secret|token|postgres://|redis:///i.test(JSON.stringify(value))) errors.push(`${file}: manifest содержит секрет или credential вместо ссылки`);
}

for (const field of ['resourceNamespace', 'databaseResource', 'redisResource', 'storageBucket', 'apiBaseUrl', 'websocketUrl']) {
  const values = manifests.map(({ value }) => value[field]);
  if (new Set(values).size !== values.length) errors.push(`${field}: значения окружений должны быть уникальны`);
}

const staging = manifests.find(({ value }) => value.name === 'staging')?.value;
const production = manifests.find(({ value }) => value.name === 'production')?.value;
if (staging && production) {
  for (const field of ['resourceNamespace', 'databaseResource', 'redisResource', 'storageBucket', 'apiBaseUrl', 'websocketUrl']) {
    if (staging[field] === production[field]) errors.push(`staging и production делят ${field}`);
  }
  if (staging.secretRefs.some((ref) => ref.includes('/production/'))) errors.push('staging ссылается на production secret');
  if (production.secretRefs.some((ref) => ref.includes('/staging/'))) errors.push('production ссылается на staging secret');
}

if (errors.length > 0) {
  console.error(`Environment isolation нарушена: ${errors.length} проблем`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Environment isolation подтверждена: ${manifests.map(({ value }) => value.name).join(', ')}`);
