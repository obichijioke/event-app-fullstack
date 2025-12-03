# Project Overview

This is the backend for a comprehensive event management platform, similar to Eventbrite or Ticketmaster. It's built with a modern tech stack and designed to handle everything from event creation and ticketing to payments and user management.

**Key Technologies:**

*   **Framework:** NestJS (a progressive Node.js framework)
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** JWT (email/password)
*   **Payments:** Stripe and Paystack
*   **Asynchronous Tasks:** Redis and BullMQ
*   **Containerization:** Docker

**Architecture:**

The project follows a modular architecture, with each feature encapsulated in its own NestJS module. This makes the codebase easy to understand, maintain, and extend. The core application logic resides in the `api/src` directory.

# Building and Running

**Prerequisites:**

*   Node.js (LTS version)
*   npm (or a similar package manager)
*   Docker and Docker Compose

**1. Start the Infrastructure:**

To get the backend running, you first need to start the required services (PostgreSQL and Redis) using Docker Compose:

```bash
docker-compose up -d
```

**2. Set Up Environment Variables:**

The application requires various environment variables for things like database connections, payment gateway credentials, and JWT secrets. You'll need to create a `.env` file in the `api` directory by copying the example file:

```bash
cp api/.env.example api/.env
```

After copying, be sure to fill in the necessary values in `api/.env`.

**3. Install Dependencies:**

Navigate to the `api` directory and install the project's dependencies:

```bash
cd api
npm install
```

**4. Run Database Migrations:**

The project uses Prisma for database migrations. To apply the latest schema changes to your database, run the following command:

```bash
npx prisma migrate dev
```

**5. Start the Application:**

You can start the application in development mode (with hot-reloading) using the following command:

```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`.

**Available Scripts:**

The `package.json` file in the `api` directory contains several other useful scripts:

*   `npm run build`: Compiles the TypeScript code to JavaScript.
*   `npm run start:prod`: Starts the application in production mode.
*   `npm run lint`: Lints the codebase to enforce coding standards.
*   `npm run test`: Runs the unit tests.
*   `npm run test:e2e`: Runs the end-to-end tests.
*   `npm run db:seed`: Seeds the database with initial data.

# Development Conventions

**Coding Style:**

The project uses Prettier and ESLint to maintain a consistent code style. It's recommended to set up your code editor to automatically format your code on save.

**Testing:**

The project has a comprehensive test suite that includes both unit tests and end-to-end tests. All new features should be accompanied by corresponding tests.

**API Documentation:**

The project uses Swagger to automatically generate API documentation. When the application is running, you can access the documentation at `http://localhost:3000/api`.
