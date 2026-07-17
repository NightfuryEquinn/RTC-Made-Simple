# RTC Made Simple — Example Apps

## Prerequisites

1. Build the local libraries:

```bash
cd ../../RTC-Made-Simple-Server && npm install && npm run build
cd ../../RTC-Made-Simple-UI && npm install && npm run build
```

2. Examples depend on `file:../../RTC-Made-Simple-Server` and `file:../../RTC-Made-Simple-UI`.

## Backend

```bash
cd example-backend
npm install
npm run dev
```

- REST + Swagger: `http://localhost:3000/api/docs`
- Chat socket path: `/chat`
- Call socket path: `/call`
- Optional env:
  - `PORT` (default `3000`)
  - `CORS_ORIGIN` (default `*`; use comma-separated origins in stricter setups)

The demo stores chat messages in memory and returns them from `onGetMessages`.

## Mobile

```bash
cd example-mobile
npm install
npm start
```

### Server URL

| Runtime | URL |
|---------|-----|
| iOS simulator | `http://localhost:3000` |
| Android emulator | `http://10.0.2.2:3000` |
| Physical device | `EXPO_PUBLIC_RTC_SERVER_URL=http://YOUR_LAN_IP:3000` |

### Two-client smoke checklist

1. Start backend, then two mobile clients
2. Confirm each screen shows a distinct device name
3. Join the same chat room, send messages, verify both sides see them and IDs reconcile
4. Place a video call to the other device name, accept, confirm media, hang up from each side
5. Decline / cancel / leave unanswered (ring timeout) and confirm overlays clear

## Security

This example trusts socket query names and has no login. Do not expose it publicly without auth.
