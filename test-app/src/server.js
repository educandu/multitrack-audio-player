import cors from 'cors';
import path from 'node:path';
import express from 'express';
import httpProxy from 'http-proxy';
import Graceful from 'node-graceful';
import { fileURLToPath } from 'node:url';
import { cleanEnv, port, url } from 'envalid';
import { inspect, promisify } from 'node:util';

Graceful.captureExceptions = true;
Graceful.captureRejections = true;

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(thisDir, '../dist/');

function cdnProxyMiddleware(cdnBaseUrl) {
  const proxy = httpProxy.createProxyServer({ target: cdnBaseUrl });

  return (req, res, next) => {
    if ((/^\/(media-library)\/.+$/).test(req.url)) {
      // eslint-disable-next-line no-console
      console.log(`Proxy request ${req.url} to ${cdnBaseUrl}`);
      return proxy.web(req, res);
    }

    return next();
  };
}

function errorMiddleware() {
  // eslint-disable-next-line no-unused-vars
  return (error, _req, res, _next) => {
    return res.status(500).send(inspect(error));
  };
}

const { PORT, CDN_BASE_URL } = cleanEnv(process.env, {
  PORT: port({ default: 3000 }),
  CDN_BASE_URL: url({ default: 'http://localhost:9000/dev-educandu-cdn' })
});

let server = express()
  .use(cors())
  .use(cdnProxyMiddleware(CDN_BASE_URL))
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
