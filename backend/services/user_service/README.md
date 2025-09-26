# User Service

## How to run
1. Make sure **mongodb** server is available by following the instructions and run docker-compose in root directory.
2. Start user_service backend server by running `node index.js`.
3. Make curl requests to `http://localhost:3000`

## Examples
 - To **add** a user:
 `curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "[username]",
    "email": "[email]",
    "password": "[password]"
  }'
 `

- To get **all users**:
`curl http://localhost:3000/users`

- To query a **specific** user:
`curl http://localhost:3000/user/[id or username]`