import { environment } from './environment';

export const affindaConfig = {
  // Affinda API Configuration from environment
  // Automatically uses development or production settings based on build configuration
  apiUrl: environment.affinda.apiUrl,
  apiKey: environment.affinda.apiKey,
  workspaceIdentifier: environment.affinda.workspaceIdentifier,
  documentTypeIdentifier: environment.affinda.documentTypeIdentifier,

  // File upload constraints
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/tiff',
  ],

  // Environment Configuration:
  //
  // ✅ DEVELOPMENT (Current):
  // - File: src/app/env/env.developmnet.ts
  // - Contains your Affinda credentials
  // - Used when running: ng serve
  //
  // 🔧 PRODUCTION:
  // - File: src/app/env/env.ts
  // - Currently has empty credentials (needs to be configured)
  // - Used when building: ng build --configuration production
  //
  // 🚀 TO DEPLOY TO PRODUCTION:
  // 1. Update src/app/env/env.ts with your production Affinda credentials
  // 2. Or use environment variables in your deployment platform
  // 3. Never commit production API keys to version control
};
