# MasTour Backend API

## Documentation

-   [ERD](https://dbdocs.io/excalios/MasTour)

## Setup Project

1. Clone the project
2. run `pnpm install`
3. cp `.env.example` to `.env`
4. run `docker-compose up` to run database locally
5. run `pnpm migrate-latest` to update the tables
6. run `pnpm dev` to run the server
7. open `localhost:9000/docs` for swagger documentation

## Migration

### Creating

`touch ./db/migrations/$(date '+%Y%m%d%H%M%S')_todo.ts`
