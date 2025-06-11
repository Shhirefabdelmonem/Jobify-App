# Environment Configuration

This directory contains environment-specific configuration files for the Jobify application.

## 🔧 Final Configuration

**API Status**: Updated to use Affinda v3 API with proper authentication and parameter structure.

## Files Structure

```
src/app/env/
├── env.ts                    # Production environment (empty credentials)
├── env.developmnet.ts        # Development environment (with credentials)
├── environment.ts            # Environment selector (development default)
├── environment.prod.ts       # Production environment selector
├── affinda.config.ts         # Affinda configuration (uses environment)
└── README.md                 # This file
```

## How It Works

### Development Mode (`ng serve`)

- Uses `env.developmnet.ts`
- Contains your Affinda API credentials
- Ready to use out of the box

### Production Mode (`ng build --configuration production`)

- Uses `env.ts`
- Currently has empty credentials
- Needs to be configured for production deployment

## Current Configuration ✅

Your development environment is configured with:

- **API URL**: `https://api.affinda.com/v3`
- **API Key**: `aff_157d857934285c2b20dc269127fe8eba8605c713`
- **Workspace ID**: `bFXKqqpl`
- **Document Type**: `rBuWWnDD`

## API Requirements

Based on the latest Affinda v3 documentation, the following parameters are required:

1. **file**: The resume file to parse
2. **workspace**: Your workspace identifier (required)
3. **documentType**: Document type identifier (recommended for accuracy)
4. **wait**: Set to 'true' for synchronous responses

## Troubleshooting

### Authentication Errors (401)

- Verify your API key is correct and active
- Check that the API key hasn't expired
- Ensure the Bearer token format is correct

### Access Denied (403)

- Verify workspace identifier is correct
- Check that your API key has access to the specified workspace
- Ensure document type identifier is valid

### Invalid Request (400)

- Check file format (supported: PDF, DOC, DOCX, PNG, JPG, TIFF)
- Verify file size is under the limit
- Ensure required parameters are provided

## For Production Deployment 🚀

1. **Update Production Environment:**

   ```typescript
   // In src/app/env/env.ts
   export const environment = {
     production: true,
     baseUrl: "your-production-api-url",
     affinda: {
       apiUrl: "https://api.affinda.com/v3",
       apiKey: "your-production-api-key",
       workspaceIdentifier: "your-production-workspace",
       documentTypeIdentifier: "your-production-document-type",
     },
   };
   ```

## Security Notes

- ⚠️ Never commit production API keys to version control
- 🔒 Use environment variables or secure configuration management for production
- 🔐 Rotate API keys regularly
- 👀 Monitor API usage in your Affinda dashboard

## Testing

To test the environment configuration:

```bash
# Start development server
ng serve

# Test resume parsing functionality in the profile component
```

The service now properly handles:

- ✅ v3 API endpoint structure
- ✅ Required workspace and document type parameters
- ✅ Proper error handling and user feedback
- ✅ Synchronous response handling
