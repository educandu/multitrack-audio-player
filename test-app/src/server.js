import cors from 'cors';
import path from 'node:path';
import express from 'express';
import Graceful from 'node-graceful';
import { fileURLToPath } from 'node:url';
import { inspect, promisify } from 'node:util';

Graceful.captureExceptions = true;
Graceful.captureRejections = true;

const PORT = process.env.PORT || 3000;

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(thisDir, '../dist/');

function errorMiddleware() {
  // eslint-disable-next-line no-unused-vars
  return (error, _req, res, _next) => {
    return res.status(500).send(inspect(error));
  };
}

let server = express()
  .use(cors())
  .use(express.static(distDir))
  .use(errorMiddleware())
  .listen(PORT, err => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      server = null;
    } else {
      // eslint-disable-next-line no-console
      console.log(`Test server started on port ${PORT}`);
    }
  });

Graceful.on('exit', () => {
  // eslint-disable-next-line no-console
  console.log('Shutting down test server');
  return server ? promisify(server.close)() : Promise.resolve();
});
