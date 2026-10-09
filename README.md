# Messenger — Back End

Node.js/Express API and Socket.IO server for the [Messenger front end](https://github.com/naderianaliakbar/Messenger-Front-End).

## What is implemented

- Phone-based login workflow and JWT-protected routes.
- Users, contacts, conversations, messages, read status and related permission handling.
- Real-time messaging through Socket.IO.
- MongoDB persistence through Mongoose, with Redis used at startup and by the application.
- File/message handling in the message controllers.

## Stack and layout

Node.js (ES modules), Express 4, MongoDB/Mongoose 8, Redis, Socket.IO 4, JWT and bcrypt.

```text
app.js                  Express app and /api routes
bin/www.js              HTTP server, database, Redis and Socket.IO initialization
core/                   Connections, authentication and socket handlers
controllers/            Request and business logic
models/                 MongoDB models
routes/                 HTTP route definitions
```

## Local setup

Prerequisites: Node.js and npm or Yarn, MongoDB and Redis.

```bash
git clone https://github.com/naderianaliakbar/Messenger-Back-End.git
cd Messenger-Back-End
npm install
```

Configure a local `.env` (do not commit credentials). The code reads at least:

```dotenv
PORT=5000
MongoDB_HOST=127.0.0.1
MongoDB_DATABASE=messenger
MongoDB_USER=
MongoDB_PASSWORD=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
STATICS_URL=/static
```

**Important:** Inspect `core/DataBaseConnection.js` and `core/RedisConnection.js` before deploying. The active MongoDB connection currently uses a URL without username/password, although those variables are read. Redis startup currently calls `flushDb()`, which **deletes all keys in the selected Redis database**. Use a dedicated development Redis database and correct that behavior before sharing Redis with other applications. Other authentication configuration is used by `core/Auth/` and `controllers/AuthController.js`; check those files when supplying JWT/OTP settings.

```bash
npm start
```

The default HTTP port is `5000`. Only `start` is defined in `package.json`; there is no bundled `dev` or `test` script.

## HTTP routes

Route prefixes registered in `app.js`:

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Login and logout |
| `/api/users` | User operations |
| `/api/contacts` | Contact management |
| `/api/conversations` | Conversation and message operations |

For example, `POST /api/auth/login`, `GET /api/conversations`, `POST /api/conversations/:conversationId/messages` and `GET /api/conversations/:conversationId/messages`. Many conversation endpoints use JWT authorization and additional access checks. See `routes/` for the complete route definitions and input requirements.

## Client integration and limitations

The [Nuxt 3 client](https://github.com/naderianaliakbar/Messenger-Front-End) needs HTTP API and Socket.IO URLs that point to this server. Socket.IO is initialized in `core/Socket/SocketConnection.js`; inspect its event handlers for the actual event contract.

This repository does not include an automated test script or a sample environment file. Do not treat the service as production-hardened without reviewing authentication, credential handling, Redis isolation and deployment configuration.

## License

No license file is included in this repository. No license grant should be assumed.
