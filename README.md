# Lumi

Приложение о том, чтобы замечать хорошее рядом. У пары есть общее пространство с
трёхмерной поверхностью: приятный момент ставится как огонёк, сложный — как
облако. Объекты живут, тускнеют и остаются в истории.

## Запуск frontend с backend

1. Запусти backend: `cd backend && docker compose up --build`.
2. Скопируй `.env.example` в `.env.local` и выбери endpoint под устройство:
   - iOS Simulator: `http://localhost:3000/v1`
   - Android Emulator: `http://10.0.2.2:3000/v1`
   - физический телефон: `http://<LAN-IP-компьютера>:3000/v1`
3. Запусти Expo с чистым конфигом: `npx expo start -c`.

Expo читает `EXPO_PUBLIC_API_BASE_URL` через `app.config.js` и автоматически
строит WebSocket endpoint `/realtime`. Его можно переопределить через
`EXPO_PUBLIC_WEBSOCKET_URL`. Backend HTTP использует глобальный prefix `/v1`, а
health endpoint остаётся на `http://<host>:3000/health`.

Для Android Emulator используй именно `10.0.2.2`, а для физического телефона
LAN IP компьютера. `localhost` на телефоне указывает на сам телефон, не на API.

## Команды

- `npm start` — Metro и Expo Dev Client
- `npm run android` — запуск Android
- `npm run ios` — запуск iOS
- `npm run verify` — типы, линтер, тесты

Без `EXPO_PUBLIC_API_BASE_URL` приложение использует локальный sandbox. Backend
realtime gateway активен на `/realtime`, HTTP остаётся источником истины, а
WebSocket доставляет изменения между клиентами.
