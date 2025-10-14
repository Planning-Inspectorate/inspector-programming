# Function
This package includes the Functions used for integration. See [Create a function in Azure from the command line](https://learn.microsoft.com/en-gb/azure/azure-functions/how-to-create-function-azure-cli) for adding new functions.

## About

The apps/function directory contains code for running and managing our Azure functions - serverless functions that we want our Azure cloud to run for various jobs including syncing CBOS api with our database and other various tasks considered external to the core application.

When run, Azure functions will run all code assigned to our 'app' object imported form @azure/functions. Remember this is separate to the app source code so you will need to run anything in here independently.

## Setup

To set up your local dev environment, firstly you will need to create some config files. In `/apps/function` create a `.env` file with this inside:

```
LOG_LEVEL=debug
CBOS_FETCH_CASES_SCHEDULE='your_cronjob_schedule'
CBOS_API_URL=http://localhost:3000
OS_API_KEY=test_key
SQL_CONNECTION_STRING=<db-connection-string>
```

Ask a developer for the OSmaps api key and set your own desired cronjob schedule.

Also create `local.settings.json` and ask a developer what should go inside. This is our Azure config.

Next you will need to install Azure and azurite on your machine. In your terminal:

* install azurite storage emulator with `npm install -g azurite`
* install azure-function-core-tools with `npm install -g azure-functions-core-tools@4`

## Running your Functions

Once you're set up you will need to make sure you are running:
* Run `azurite` in a temporary directory somewhere as a storage emulator
* Run `npm run api` in the appeals back office
* Run `npm run start` in `apps/function` to start the function(s)
* 