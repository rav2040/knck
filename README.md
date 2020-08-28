# Knck - URL shortening service

Example website: https://knck.xyz

Knck (pronounced *knock*) is a simple URL shortening service utilizing [Tuft](https://www.tuft.dev) (Node.js) and written in TypeScript.

## Prerequisities

Knck requires [pm2](https://pm2.io/) to be installed as a peer dependency. It also requires access to a MongoDB database.

You should also have the following environment variables set:

* `NODE_ENV` - `'development'` or `'production'`.
* `HOST` - The server host address.
* `PORT` - The server host port.
* `DB_URI` - The connection string for a MongoDB database.
* `DB_NAME` - The name of the MongoDB database to use.

## Building locally

To build Knck after cloning to your machine, execute the following commands:

```sh
  $ npm install
  $ npm run build
```

## Deploying

First, the `DB_URI` environment variable should be set in `ecosystem.config.yml`, and pm2 should be installed. Other settings like host and port can be changed as well.

The server can then be started by executing:

```sh
  $ npm start
```

Alternatively, to start a server in development mode, execute:

```sh
  $ npm run start:dev
```

This requires that environment variables be set in a `.env` file in the project root.

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
