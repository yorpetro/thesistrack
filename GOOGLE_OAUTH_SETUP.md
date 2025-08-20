# Google OAuth Setup Instructions

## Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "ThesisTrack"
   - Authorized JavaScript origins:
     - `https://thesistrack.dev`
     - `http://localhost:5173` (for development)
   - Authorized redirect URIs:
     - `https://thesistrack.dev`
     - `http://localhost:5173` (for development)
   - Click "Create"

5. Copy the Client ID and Client Secret

## Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following repository secrets:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret

## Step 3: Deploy

Once the secrets are configured in GitHub, push your changes and the CI/CD pipeline will automatically:
1. Build the frontend with the Google Client ID
2. Deploy to Kubernetes with both Client ID and Client Secret
3. Enable Google Sign-In functionality

## Verification

After deployment, you should be able to:
1. Visit https://thesistrack.dev
2. See the "Sign in with Google" button enabled (not showing "disabled")
3. Successfully authenticate with your Google account

## Troubleshooting

If Google Sign-In is still disabled:
1. Ensure GitHub Secrets are properly configured
2. Check that the CI/CD pipeline completed successfully
3. Verify the deployment is using the latest image
4. Check backend logs for any OAuth configuration errors
