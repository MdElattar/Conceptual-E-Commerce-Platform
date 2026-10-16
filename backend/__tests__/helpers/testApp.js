import express from 'express';
import { notFound, errorHandler } from '../../middleware/errorMiddleware.js';

export function createTestApp() {
  const app = express();
  app.use(express.json());
  return app;
}

export function addErrorHandlers(app) {
  app.use(notFound);
  app.use(errorHandler);
}
