# Deployment Guide

## CORS Issue Resolution

The CORS error occurs when the deployed application tries to make API requests to `localhost:8080` instead of the production backend URL.

### Environment Configuration

This project uses environment-specific configuration files:

- `.env` - Default configuration (development)
- `.env.development` - Development-specific settings
- `.env.production` - Production-specific settings
- `vercel.json` - Vercel deployment configuration

### For Vercel Deployment

1. **Automatic Configuration**: The `vercel.json` file automatically sets the correct environment variables for production:
   ```json
   {
     "env": {
       "VITE_API_BASE_URL": "https://hr-eval-sys.vercel.app",
       "VITE_APP_ENV": "production"
     }
   }
   ```

2. **Manual Configuration** (if needed):
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add the following variables:
     - `VITE_API_BASE_URL` = `https://hr-eval-sys.vercel.app`
     - `VITE_APP_ENV` = `production`
     - `VITE_API_TIMEOUT` = `10000`

### Build Commands

- **Development build**: `npm run build:dev`
- **Production build**: `npm run build`
- **Production build with explicit env vars**: `npm run build:prod`

### Deployment Steps

1. Ensure all environment files are properly configured
2. Commit and push changes to your repository
3. Deploy to Vercel (automatic deployment if connected to Git)
4. Verify the environment variables are set correctly in Vercel dashboard

### Troubleshooting

If you still encounter CORS errors:

1. **Check Environment Variables**: Ensure `VITE_API_BASE_URL` is set to `https://hr-eval-sys.vercel.app` in production
2. **Use Explicit Build**: Try using `npm run build:prod` which explicitly sets environment variables
3. **Verify Backend**: Check that the backend API at `https://hr-eval-sys.vercel.app` has proper CORS headers
4. **Clear Cache**: Clear browser cache and try again
5. **Check Build Logs**: Review Vercel deployment logs for any build errors
6. **Environment File Issues**: If `.env.production` is not in the repository, the environment variables in `vercel.json` and the build script should handle this
7. **Manual Vercel Config**: Go to Vercel dashboard → Settings → Environment Variables and manually add:
   - `VITE_API_BASE_URL` = `https://hr-eval-sys.vercel.app`
   - `VITE_APP_ENV` = `production`
   - `VITE_API_TIMEOUT` = `10000`

### Local Development

For local development, the application uses a proxy configuration in `vite.config.ts` that routes `/api` requests to the backend, avoiding CORS issues.