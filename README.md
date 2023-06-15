# MasTour Backend API

This repository contains the source code for MasTour REST API which is created using fastify, typescript, kysely and deployed to Cloud Run to be consumed by MasTour mobile application. This is a project for [Bangkit](https://grow.google/intl/id_id/bangkit/?tab=machine-learning) Capstone Project.

-   [Documentation](#documentation)
-   [Requirements](#requirements)
-   [Libraries](#libraries)
-   [Setup Project](#setup-project)
-   [Database](#database)
-   [Deploying](#deploying)

## Documentation

-   [ERD](https://dbdocs.io/excalios/MasTour) You can also see the dbdocs in `docs/mastour.dbml`

### Infrastructure

![Preview](/docs/mastour_infrastructure.png)

## Requirements

### Packages

You need to have these packages installed first to be able to run this repository

1. [Git](https://git-scm.com/)
2. [Nodejs](https://nodejs.org/en) v18.16.0
3. [Volta](https://volta.sh/) (Optional) this is optional to ensure the same version is used
4. [pnpm](https://pnpm.io/) v8.6.0
5. [Docker Compose](https://docs.docker.com/compose/)

### Services

-   [Personality Model](https://github.com/mas-tour/mastour-machine-learning/tree/main/matchmaking-feature/persona_model) Needs to be deployed
-   [PCA Model](https://github.com/mas-tour/mastour-machine-learning/tree/main/matchmaking-feature/pca_model) Needs to be deployed

## Libraries

This are main libraries that are used to create the backend service

1. [fastify](https://www.fastify.io/)
2. [typescript](https://www.typescriptlang.org/)
3. [kysely](https://www.kysely.dev/)
    - [pg](https://www.npmjs.com/package/pg) used to connect to postgresql database
4. [typebox](https://github.com/sinclairzx81/typebox)

## Setup Project

There are 2 ways to setup the project using [One Line](#one-line) or [Step by step](#step-by-step) but both requires cloning the project first

### One Line

1. clone the project using `git clone ...`
2. run `pnpm check-in-dance`
   `check-in-dance` is a script that is used to setup the project from running docker-compose, setup the database, and running the API.
3. Make sure you've deployed the machine learning models in [Requirements -> Services](#requirements). Then, seed the `.env` file with the corresponding machine learning model url
4. open `localhost:9000/docs` for swagger documentation

### Step by step

1. clone the project using `git clone ...`
2. run `pnpm install`
3. cp `.env.example` to `.env`
4. Make sure you've deployed the machine learning models in [Requirements -> Services](#requirements). Then, seed the `.env` file with the corresponding machine learning model url
5. run `docker-compose up` to run database locally
6. run `pnpm migrate-latest` to update the tables
7. run `pnpm db-seed` to seed the tables with dummy data
8. run `pnpm dev` to run the server
9. open `localhost:9000/docs` for swagger documentation

## Database

This section covers how to manage migrations (create, drop tables and modify columns) and seeder

### Migrations

Migrations files exists to manipulate the database i.e creating a table, drop a table, or modifying columns
Migrations files exists inside `db/migrations` folder

#### Creating

Creating migration file

`touch ./db/migrations/$(date '+%Y%m%d%H%M%S')_user.ts`

#### Running

To run the migratIons file to the latest migration you need to run
`pnpm migrate-latest`
This will run the `up` function that exists in the files

#### Rollback

Rollback will reverse the state to before the migrations file are run
`pnpm migrate-rollback`
This will run the `down` function that exists in the files

### Seeding

Seeding will seed the database so it is filled with "dummy" data. At the moment there are 2 kinds of seeding `dummy` and `survey` seeding. `dummy` seeding fully consist of randomized data. Meanwhile, `surver` data mostly consist of data that we gathered through a gform survey. To run seeding make sure you've already followed the migrationns

Seed `dummy` data:
`pnpm db-seed`

Seed `survey` data:
`pnpm db-seed-survey`

## Deploying

To deploy the service we are using several service from [Google Cloud Provider](https://cloud.google.com/):

-   [Cloud Run](https://cloud.google.com/run/)
-   [Cloud SQL](https://cloud.google.com/sql/)

This step will be based on using Cloud Shell

1. Make sure you've enabled the following API
    - Compute Engine API
    - Cloud SQL Admin API
    - Cloud Run API
    - Container Registry API
    - Cloud Build API
    - Service Networking API
2. Create a Cloud SQL Instance and choosing PostgreSQL
3. Create a database inside Cloud SQL Instance in step 2
4. Make sure you've deployed the maching learning model in [requirements](#requirements)
5. Edit the compute service account to have `Cloud SQL Client` role or create a new service account
6. Use [Cloud SQL Proxy](https://cloud.google.com/sql/docs/mysql/connect-auth-proxy) to run the migrations file to the database
7. Clone the repository inside Cloud Shell
8. Run `pnpm install`
9. Run `npx tsc` to build the typescript file
10. Use `gcloud run deploy` to deploy the service giving the proper arguments for example:
    - `--set-env-vars` to give the proper environment variables
    - `--add-cloudsql-instances` to connect the Cloud Run with Cloud SQL Instance
