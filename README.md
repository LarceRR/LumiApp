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

Expo читает `EXPO_PUBLIC_API_BASE_URL` через `app.config.js`. Если адрес не задан,
по умолчанию используется iOS Simulator URL, а не локальный sandbox. Sandbox
остаётся доступен только когда `apiBaseUrl` явно отсутствует в runtime-конфиге.

Backend HTTP использует глобальный prefix `/v1`, поэтому не убирай его из URL.
Проверка контейнера: `curl http://localhost:3000/health`.

Realtime пока не включается автоматически: backend подключает `WsAdapter`, но в
репозитории нет WebSocket gateway. Не задавай `EXPO_PUBLIC_WEBSOCKET_URL`, пока
gateway не будет добавлен, иначе клиент будет бесконечно переподключаться. HTTP
остаётся источником истины и уже полностью покрывает auth, spaces, surfaces,
objects и timeline.

## Команды

- `npm start` — Metro и Expo Dev Client
- `npm run android` — запуск Android
- `npm run ios` — запуск iOS
- `npm run verify` — типы, линтер, тесты

Без настроенного API приложение работает локально через `src/infrastructure/local`.
