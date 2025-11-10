# Question Service

<<<<<<< HEAD
## Overview
The Question Service is an Express-based microservice that manages queries to the database for Technical Interview questions in PeerPrep. Its booted in `index.js`, and exposes a `/status` health check.

## Configuration
The service reads the MongoDB database name from `backend/.env`, which you can scaffold from the template.

```bash
cd backend
cp .env.example .env
```

## Getting started
1. Install dependencies with pnpm (the repo uses pnpm workspaces).
   ```bash
   cd backend
   pnpm -r install
   ```
2. Start just the Question Service:
   ```bash
   cd services/question_service
   pnpm run dev
   ```

The service listens on the port defined by `QUESTIONSERVICEPORT` (defaults to `4002`).
Swagger documentation is automatically hosted at `/docs`.

## Key capabilities
- **Question Retrieval**: The Question Service communicates with a `MongoClientInstance` to retrieve the question collection. From the collection it can query for specific questions.

## API surface
The API endpoints are not prefixed in development, they are simply `http://localhost:4002/`. In production, they are prefixed with `api/` because of the way NGINX adds an `api/` prefix to the URI of backend code.

| Method & Path | Description |
| --- | --- |
| `GET /?topic={topic}&difficulty={difficulty}` | Gets a list of questions, optionally filtered by topic and/or difficulty. |
| `GET /random` | Gets a random question, optionally filtered by topic and/or difficulty. |
| `GET /:id` | Gets the question by its Question ID. |

## Example requests
The service listens on port `4002` by default. Note: An authorisation header is required for non-interprocess communication.

### Retrieve a list of hard questions with authorisation
```bash
curl -X 'GET' \
  'http://localhost:4002/?difficulty=Hard' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer replace_me_with_a_strong_secret'
```

### Retrieve list of easy questions with the topics String and Hash Table
```bash
curl 'http://localhost:4002/?topic=String&topic=Hash%20Table&difficulty=Easy'
```

### Get a random question without any filters for difficulty or topic
```bash
curl http://localhost:4002/random
```

## Architecture
- **Service layer** – provides functionalities to retrieve questions, returns the question upon success and error codes upon failure.
- **Repository layer** – communicates with the Mongo database for the retrieval of question collections. Uses collection methods like .find() and .findOne() to get the questions in the database.

## Error handling
Request failures return code 400 for Bad Requests and 404 for Question not found, while unexpected errors return a generic 500 payload.
=======
This module contains the code for the `Question` micro-service, which serves to retrieve questions from the `questions_collection`

![](../../../docs/Question_Service.drawio.png)

## 1. Pre-requisites

- `node 22.19.0 (LTS)`

- `pnpm 10.17.1`

## 2. Installation

- **Note:** This micro-service requires the root repository dependencies + MongoDB to be running to function properly

```
pnpm install
```

## 3. Run in Dev Mode

```
pnpm run dev
```

## 4. Run in Production Mode

```
pnpm run start
```

## 5. Testing

```
pnpm run test
```

## 6. API Docs

- Refer to [api_docs.md](api_docs.md)

## 7. Schema + Indexes

![](../../../docs/Schemas.drawio.png)

![](../../../docs/Indexes.png)
>>>>>>> master
