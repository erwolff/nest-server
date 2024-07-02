<p align="center">
  <a href="https://nestjs.com/" target="blank"><img src="./resources/nestjs.svg" width="269" alt="NestJS Logo" /></a>
</p>

## Description

A simple back-end server built using the [nest.js](https://github.com/nestjs/nest) framework for the purpose of demonstrating coding/architecture proficiency. This server functions as a movie database, allowing users to sign-up, authenticate, and create/retrieve movies from the database using basic http requests.

OpenAPI documentation can be viewed by starting the server locally, then navigating to http://localhost:3000/docs

### Basic Stack

Database: [MongoDB](https://www.mongodb.com/)  
Cache: [Redis](https://redis.io/)  
Messaging: [Amazon SQS](https://aws.amazon.com/sqs/)  
Web Framework: [Express](https://expressjs.com/)


## Setup

```bash
# install correct version of node
$ nvm install v20.9.0

# install yarn
$ npm install -g yarn
```

## Installation

```bash
# install dependencies
$ yarn install
```

## Starting the services

```bash
# from the project root
$ docker-compose up

# or start the services in the background
$ docker-compose up -d
```

## Running the app

In order to run the application, first copy the `.env.example` file contents into a new `.env` file, and edit the environment variables as necessary.

```bash
# build the app
$ yarn run build

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test:unit

# e2e tests
$ yarn run test:e2e
```

## Troubleshooting

```
AggregateError: 
    at internalConnectMultiple (node:net:1102:18)
    at afterConnectMultiple (node:net:1620:5)
error Command failed with exit code 1.
```
The server is unable to connect to a required service. Is docker running and configured properly?
