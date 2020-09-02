# Knck (DynamoDB) - URL shortening service

Example website: https://knck.xyz

Knck (pronounced *knock*) is a simple URL shortening service utilizing [Tuft](https://www.tuft.dev) (Node.js) and written in TypeScript.

## Prerequisities

Knck (DynamoDB) requires [pm2](https://pm2.io/) to be installed as a peer dependency if running in production mode. It also requires access to [AWS DynamoDB](https://aws.amazon.com/dynamodb/).

If running in a development environment, you should also have the following environment variables set:

* `NODE_ENV` - Set to `'development'.
* `HOST` - The server host address.
* `PORT` - The server host port.
* `DB_TTL` - The 'Time To Live' value for each short URL item (in seconds). If not set, defaults to `2_592_000` (30 days).

If running in a production environment, the values above are set in the pm2 config file: `ecosystem.config.yml`.

A `DB_ENDPOINT` environment variable should also be set when running in development mode, which points to a [local instance of DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html). If not set, the application will attempt to access the default endpoint of `'http://localhost:8000'`.

The rest of the DynamoDB configuration is pulled automatically from the local environment by the AWS SDK, and is not handled within the application code. It is up to you to make sure your machine is configured with AWS credentials that have full access (read and write) to DynamoDB.

## Building locally

To build Knck after cloning to your machine, execute the following commands:

```sh
  $ npm install
  $ npm run build
```

## Deploying

First, make sure that environment variables have been set as outlined above, and that pm2 is installed globally. Other settings like host and port can be modified as well.

The server can then be started by executing:

```sh
  $ npm start
```

Alternatively, to start a server in development mode, execute:

```sh
  $ npm run start:dev
```

This requires that environment variables be set in a `.env` file in the project root, but does not require that pm2 be installed.

## Usage

Knck provides the following endpoints:

### GET /

Displays a webpage with a text box for the user to input an original URL. Submitting the URL will then call the POST endpoint below.

### POST /

An original URL should be submitted under the key `url` in an `'x-www-form-urlencoded'` request body (limited to 2KB). A new webpage will then be displayed containing the new, shorter URL.

If the request body is not received in the expected format, the server will respond with `400 Bad Request`.

### GET /{hash}

If the string `hash` is valid, and matches a database entry, the server will respond with `302 Found`, and redirect the client to the corresponding URL.

If `hash` is valid, but does not match a database entry, the server will respond with `404 Not Found`.

If `hash` is invalid (not 6 characters in length), the server will respond with `400 Bad Request`.

## People

The creator of Knck is [Stuart Kennedy](https://github.com/rav2040).

## License

[MIT](https://github.com/rav2040/knck/blob/master/LICENSE)
