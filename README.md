# BookVault

BookVault is a standalone library-management REST API built with Node.js 22,
Express, and SQLite. The project is organized into routes, controllers,
services, and repositories; business operations are intentionally left as TODO
stubs. It also includes a small browser UI shell and a best-effort HTTP client
for an external Event Manager.

## Setup

```sh
cp .env.example .env
npm install
npm run dev
```

The API listens on port `3001` by default. Configuration is available in
`.env`; `EVENT_MANAGER_URL` defaults to `http://localhost:3000`, and `DB_PATH`
defaults to `./db/bookvault.sqlite`. Visit <http://localhost:3001> for the
starter UI and <http://localhost:3001/api/health> to verify the API.

## Architecture

- `src/routes` defines the HTTP surface and mounts the API under `/api`.
- `src/controllers` adapts HTTP requests and responses.
- `src/services` is the intended home for business rules (currently TODOs).
- `src/repositories` is the intended home for persistence (currently TODOs;
  no SQL queries are implemented).
- `src/db` initializes SQLite and defines the relational schema.
- `src/clients/eventClient.js` sends non-blocking best-effort events to the
  Event Manager.
- `public` contains a semantic HTML shell and a minimal API fetch helper.

## API endpoints

All collection endpoints below are scaffold placeholders and return
`501 Not Implemented` until their corresponding service and repository logic
is implemented. Resource identifiers are represented by `:id`.

| Method           | Endpoint              | Purpose                            |
| ---------------- | --------------------- | ---------------------------------- |
| GET              | `/api/health`         | Check API availability             |
| GET, POST        | `/api/categories`     | List or create categories          |
| GET, PUT, DELETE | `/api/categories/:id` | Read, update, or delete a category |
| GET, POST        | `/api/authors`        | List or create authors             |
| GET, PUT, DELETE | `/api/authors/:id`    | Read, update, or delete an author  |
| GET, POST        | `/api/books`          | List or create books               |
| GET, PUT, DELETE | `/api/books/:id`      | Read, update, or delete a book     |
| GET, POST        | `/api/clients`        | List or create clients             |
| GET, PUT, DELETE | `/api/clients/:id`    | Read, update, or delete a client   |
| GET, POST        | `/api/loans`          | List or create loans               |
| GET, PUT, DELETE | `/api/loans/:id`      | Read, update, or delete a loan     |

## Runtime scripts

- `npm start` starts the API with Node.js.
- `npm run dev` starts the API with nodemon for local development.
