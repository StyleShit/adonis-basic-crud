# Adonis Basic CRUD

Just another basic CRUD application for Posts in order to get familiar with [Adonis.js](https://adonisjs.com/).

## Available Commands:

- All of the default [Ace](https://docs.adonisjs.com/guides/ace-commandline#document) commands.


- `npm run dev` - Start a dev server with watch mode.


- `npm run lint` - Lint the code according Adonis' guidelines.


- `node ace test` - Run unit tests.


- `npm run build` - Transpile & Build the application to production.


- `npm start` - Run the built application from the command above.


## Available Routes:

```bash
# node ace list:routes

GET         /api/v1/posts
POST        /api/v1/posts
GET         /api/v1/posts/:id
PATCH       /api/v1/posts/:id
DELETE      /api/v1/posts/:id
```

## How To Use:

### Initializing the project
```bash
npm i

mkdir ./tmp # required since Adonis won't create it automatically.

node ace migration:run
```

### Starting the dev server
```bash
npm run dev
```


### Running tests
```bash
node ace test
```