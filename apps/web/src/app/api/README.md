# API

This directory contains the code related to the API endpoints. This API is primarily used to support PowerBI and other reporting functions, and isn't used directly by the web app. The API interacts with the Graph API using applications permissions (rather than delegated permissions) to retrieve user and (calendar) event data.

## Auth

The API uses Entra auth, and a valid JWT Bearer token is required. For local development a request can be made to the api, e.g. `/api/v1/health`, which will return a 401 Unauthorized response with a `WWW-Authenticate` header. This header contains the URL to the Entra authorization endpoint, which can be used to obtain a valid token.

## Configuration

There are several environment variables used to configure the API behaviour. The following are shared with the web app:

```
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
APP_HOSTNAME
```

And the follow are API specific:

```
API_MOCK_DATA
API_INSPECTOR_ENTRA_GROUPS
```

Set `API_MOCK_DATA=true` to return mock data from the APIs instead of making requests to the Graph API. This is useful for local development and testing. Any other value will result in the API making requests to the Graph API for real data.

Set `API_INSPECTOR_ENTRA_GROUPS` to a comma-separated list of Entra group IDs. Inspectors (and associated events) will be returned for users who are members of these groups.