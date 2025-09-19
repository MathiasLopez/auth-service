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
2. Install dependencies:
```
npm install
```
3. Create a `.env` file in the project root with the following variables:
```
NODE_ENV=development
AUTH_PORT=3000
JWT_SECRET=123a4567-b12c-12d3-e456-426614174000
JWT_EXPIRES_IN=10m
COOKIE_SHARING_KEY=.localtest.me
ALLOWED_ORIGIN_PATTERN=^https?:\/\/([a-z0-9-]+\.)*localtest\.me(:[0-9]+)?$
```
4. Start the server:
```
npm run dev
```
