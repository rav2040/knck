# Knck - URL shortening service

Website: https://knck.xyz

Knck (pronounced *knock*) is a simple URL shortening service utilizing [Tuft](https://www.tuft.dev) (Node.js) and written in TypeScript.

## Building locally

To build Knck after cloning to your machine, execute the following commands:

```sh
  $ npm install
  $ npm run build
```

Knck requires access to a MongoDB database, accessed via the `DB_URI` environment variable.

To start a server in development mode, run:

```sh
  $ npm run dev-start
```

To start a server in production mode, run:

```sh
  $ npm start
```

The application will then serve static website content on the root path `'/'`, providing a user-friendly way to interact with the API.

## API

Knck provides the following two API endpoints:

### POST /new?url={url}

Creates a new database entry for the provided `url`. E.g. `/new?url=https://www.example.com`.

Returns a JSON object with the following properties:

* `originalURL` - the URL provided in the POST request.
* `shortUrl` - the short URL that can be used to access the `originalUrl`.

### GET /{hash}

If `hash` matches a valid database entry, the server will respond with a `302 Found` status code, and redirect the client to the corresponding URL.

## People

The creator of Knck is [Stuart Kennedy](https://github.com/rav2040).

## License

[MIT](https://github.com/rav2040/knck/blob/master/LICENSE)
