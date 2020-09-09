#!/bin/sh

set -e

# Create empty AWS credential values to prevent the AWS SDK from throwing an error.
mkdir $HOME/.aws
printf "[default]\naws_access_key_id = nil\naws_secret_access_key = nil\n" > $HOME/.aws/credentials

# Start the server.
npm run start:test &

# Execute cypress e2e tests once the server is running.
wait-on http-get://localhost:3000 && cypress run
