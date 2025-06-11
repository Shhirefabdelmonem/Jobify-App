// This file can be replaced during build by using the `fileReplacements` array.
// When building for production, this file is replaced with `environment.prod.ts`.

import { environment as devEnv } from './env.developmnet';
import { environment as prodEnv } from './env';

// Determine which environment to use
const isProduction = false; // This will be replaced by Angular CLI for production builds

export const environment = isProduction ? prodEnv : devEnv;
