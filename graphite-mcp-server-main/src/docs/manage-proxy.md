# Manage Proxy Guide

## Overview

A Manage proxy is required for Maximo applications to communicate with a Maximo Manage server during development. The proxy allows your local development environment to make API calls to a Maximo Manage instance without running into CORS issues or authentication problems.

A proxy can be created by creating a `.env` file in the project root directory, at the same level as your `src` folder.

If the user has not provided any proxy server information, just ask them for the Manage server URL and username and password.

After changing the .env file, you MUST run `yarn clean && yarn build` and tell the user to run `yarn start` to start the application.

## Sample .env file

The following file shows all the environment variables that can be configured.

```
# Manage emulation will emulate the base manage APIs without needing a proxy server
# When APIs are emulated only the initial login apis are emulated.  Other APIs will fail if proxy is not enabled.
# GRAPHITE_PROXY_MANAGE_EMULATION=true

# Emulates the base MAS apis for uiresources allowing an application to think it is being run in MAS
# GRAPHITE_PROXY_MAS_EMULATION=true

# Full URL to the Maximo/Manage server being proxied
# GRAPHITE_PROXY_MANAGE_URL="http://sandbox03-1.fyre.ibm.com:9083/maximo/"

# The value can be a username:password pair, or just a username (password is the same as username), or a base64 encoded value
# GRAPHITE_PROXY_MANAGE_MAXAUTH="wilson"
# if MANAGE_WEBCLIENT is true then it will proxy the webclient as well, allowing some access to maximo classic UI
# GRAPHITE_PROXY_MANAGE_WEBCLIENT=true

# The API must be setup in API key
# GRAPHITE_PROXY_MANAGE_APIKEY=""

# The x-access-token value from the x-access-token, or the complete x-access-token cookie
# GRAPHITE_PROXY_MANAGE_XACCESSTOKEN=""

# The secure value can be false to skip SSL validation on self-signed HTTPS servers
# GRAPHITE_PROXY_SECURE=true

# By default graphite will use a snapshot if it exists, but will also try to load the real URL if it doesn't
# Setting this to true will prevent attempting to load the real URL when a snapshot is not found
# GRAPHITE_FAIL_ON_MISSING_SNAPSHOTS=true

# Log the final proxy urls that go to the remote site
# GRAPHITE_PROXY_LOG_URL=true
```

### Sample using username and password

Most times configurations do not need MAS or MANAGE or WEBCLIENT emulation enabled.  Just a connection to Manage is enough.

```
GRAPHITE_PROXY_MAS_EMULATION=false
GRAPHITE_PROXY_MANAGE_URL="http://localhost:9080/maximo/"
GRAPHITE_PROXY_MANAGE_MAXAUTH="wilson"
```

### Sample using api key
```
GRAPHITE_PROXY_MAS_EMULATION=false
GRAPHITE_PROXY_MANAGE_URL="http://main.manage.maximo.com/maximo/"
GRAPHITE_PROXY_MANAGE_APIKEY="xxxyyyzzz"
```

