import express, { type Express } from 'express';
import { join } from 'node:path';

export function serveWebApplication(app: Express, directory: string): void {
  app.use(express.static(directory));
  app.use((request, response, next) => {
    if (request.method !== 'GET' || request.path.startsWith('/api') || request.path === '/ws') return next();
    return response.sendFile(join(directory, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}
