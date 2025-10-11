# Auth Service

This project is designed as a learning exercise and a public example of how to integrate multiple applications using SSO (Single Sign-On).  
Its main goal is to demonstrate user authentication, JWT management, and session handling across web and API clients.

## Features

- Login via HTML form or API (for mobile/other backends)  
- JWT generation and verification and refresh token support  
- Cookies shared across subdomains
- Simple CORS setup to allow specific origins  
- Handles redirection after login  

## Setup

1. Clone the repository.

2. Create a .env file
```
NODE_ENV=development
AUTH_PORT=3000
JWT_SECRET=123a4567-b12c-12d3-e456-426614174000
JWT_EXPIRES_IN=10m
JWT_ALGORITHM=HS256
COOKIE_SHARING_KEY=.shareddomain.test
ALLOWED_ORIGIN_PATTERN=^https?:\/\/([a-z0-9-]+\.)*shareddomain\.test(:[0-9]+)?$
SALT_ROUNDS=5
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin1
POSTGRES_DB=authdb
POSTGRES_PORT=5432
DATABASE_URL="postgresql://admin:admin1@auth-db:5432/authdb?schema=public"
```

3. Build the containers
```
docker compose build
```

4. Lift the database container
```
docker compose up -d auth-db
```

5. Run migrations
```
docker compose -f docker-compose.yml run --rm auth-service npx prisma migrate dev
```

6. Run Seeder (Roles & Permissions)
```
docker compose -f docker-compose.yml run --rm auth-service npx prisma db seed
```

7.  start auth container
```
docker compose up -d auth-service
```