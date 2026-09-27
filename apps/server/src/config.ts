import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface AppOptions {
  staticDirectory?: string;
  secureCookies?: boolean;
}

export function runtimeOptions(environment: NodeJS.ProcessEnv = process.env): AppOptions {
  const options: AppOptions = { secureCookies: environment.COOKIE_SECURE === 'true' };
  if (environment.NODE_ENV === 'production') {
    options.staticDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../../web');
  }
  return options;
}
