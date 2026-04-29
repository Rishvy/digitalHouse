# Canva Integration Flow

This document explains how the Canva design editor integration works in the K.T Digital House application.

## Overview

The integration allows users to create and edit designs using Canva's editor, then export those designs back to our application for use with products.

## Architecture

```
User → OAuth Flow → Canva Editor → Return Navigation (/canva/finish) → Export Job → Download → Storage
```

## Flow Diagram

```
1. User clicks "Edit in Canva" button
   ↓
2. OAuth authorization starts (/api/canva/oauth/authorize)
   - Generates PKCE code verifier & challenge
   - Stores state in database
   - Redirects to Canva authorization page
   ↓
3. User authorizes the app on Canva
   ↓
4. Canva redirects back to callback (/api/canva/oauth/callback)
   - Validates state (CSRF protection)
   - Exchanges authorization code for access token
   - Stores encrypted tokens in database
   - Creates a blank design via Canva API
   - Redirects user to Canva editor with returnTo URL
   ↓
5. User edits design in Canva
   ↓
6. User clicks "Publish" or "Done" in Canva
   ↓
7. Canva redirects to return navigation endpoint (/canva/finish)
   - Single loading screen with progress bar appears
   - Extracts design ID from JWT
   - Creates export job via Canva API
   - Polls for completion every second
   - Downloads and stores the design
   - Redirects to result page
   ↓
9. When export is complete:
   - Downloads the exported file from Canva
   - Uploads to Supabase Storage
   - Stores design metadata in database
   - Redirects user to product page or dashboard
```

## API Endpoints

### 1. `/api/canva/oauth/authorize` (GET)
**Purpose**: Initiates the OAuth flow

**Query Parameters**:
- `productId` (optional): Product being customized
- `variationId` (optional): Product variation being customized

**Process**:
1. Generates PKCE code verifier and challenge
2. Creates a random state token
3. Stores state, code verifier, and metadata in `canva_oauth_states` table
4. Redirects to Canva authorization URL

### 2. `/api/canva/oauth/callback` (GET)
**Purpose**: Handles OAuth callback from Canva

**Query Parameters**:
- `code`: Authorization code from Canva
- `state`: State token for CSRF protection
- `error` (optional): Error from Canva

**Process**:
1. Validates state token
2. Exchanges authorization code for access token using PKCE
3. Encrypts and stores tokens in `canva_user_tokens` table
4. Creates a blank design via Canva REST API
5. Redirects user to Canva editor with `returnTo` URL

**Security**:
- Uses PKCE (Proof Key for Code Exchange) for OAuth
- Validates state to prevent CSRF attacks
- Encrypts tokens before storing in database

### 3. `/api/canva/return-nav-process` (GET)
**Purpose**: Processes return navigation from Canva editor and creates export job

**Query Parameters**:
- `correlation_jwt`: JWT token from Canva containing design ID and state

**Returns**: JSON with job ID and context for polling
- `designId`: Canva design ID
- `userId`: User ID
- `productId` (optional): Product ID
- `variationId` (optional): Variation ID

**Process**:
1. Extracts design ID from query params or referer header
2. Retrieves user's access token from database
3. Creates export job via Canva REST API
4. Redirects to processing page with job ID

### 4. `/api/canva/export-status` (GET)
**Purpose**: Polls export job status and downloads completed exports

**Query Parameters**:
- `jobId`: Canva export job ID
- `userId`: User ID
- `productId` (optional): Product ID
- `variationId` (optional): Variation ID

**Process**:
1. Checks export job status via Canva REST API
2. If in progress: Returns status for client to poll again
3. If failed: Returns error details
4. If successful:
   - Downloads exported file from Canva
   - Uploads to Supabase Storage (`user-uploads` bucket)
   - Stores design metadata in `user_designs` table
   - Returns success with redirect URL

**Response**:
```json
{
  "status": "in_progress" | "success" | "failed",
  "message": "...",
  "redirectUrl": "/products/123?designComplete=true",
  "error": "..." // only if failed
}
```

## Frontend Pages

### `/canva/processing`
**Purpose**: Shows progress while export job is processing

**Features**:
- Polls `/api/canva/export-status` every second
- Shows animated spinner and progress bar
- Displays success/error messages
- Auto-redirects when complete

## Database Tables

### `canva_oauth_states`
Stores temporary OAuth state for CSRF protection

```sql
CREATE TABLE canva_oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID,
  variation_id UUID,
  code_verifier TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `canva_user_tokens`
Stores encrypted Canva access tokens per user

```sql
CREATE TABLE canva_user_tokens (
  user_id UUID PRIMARY KEY,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `user_designs`
Stores exported design metadata

```sql
CREATE TABLE user_designs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  design_id TEXT, -- Canva design ID
  export_url TEXT NOT NULL, -- URL to exported file
  product_id UUID,
  variation_id UUID,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

## Environment Variables

```env
# Canva OAuth credentials
CANVA_CLIENT_ID=your_client_id
CANVA_CLIENT_SECRET=your_client_secret

# OAuth redirect URIs (must match Canva app settings)
CANVA_REDIRECT_URI=http://localhost:3000/api/canva/oauth/callback
CANVA_RETURN_NAV_URI=http://localhost:3000/canva/finish

# Encryption key for storing tokens (32-byte hex string)
CANVA_TOKEN_ENCRYPTION_KEY=your_encryption_key
```

## Canva API Endpoints Used

### 1. Create Design
```
POST https://api.canva.com/rest/v1/designs
```
Creates a new blank design that the user can edit.

### 2. Create Export Job
```
POST https://api.canva.com/rest/v1/exports
```
Starts an asynchronous job to export a design as PNG/JPG/PDF/etc.

### 3. Get Export Job Status
```
GET https://api.canva.com/rest/v1/exports/{exportId}
```
Checks the status of an export job and gets download URLs when complete.

## Security Considerations

1. **PKCE (Proof Key for Code Exchange)**
   - Protects against authorization code interception
   - Code verifier stored in database, challenge sent to Canva

2. **State Parameter**
   - Prevents CSRF attacks
   - Validated on callback
   - Expires after 10 minutes

3. **Token Encryption**
   - Access and refresh tokens encrypted before storage
   - Uses AES-256-GCM encryption
   - Encryption key stored in environment variable

4. **Row Level Security (RLS)**
   - Users can only access their own designs
   - Service role has full access for backend operations

## Rate Limits

Canva API has the following rate limits:

- **Integration throttle**: 750 exports per 5 minutes, 5,000 per 24 hours
- **Document throttle**: 75 exports per 5 minutes per document
- **User throttle**: 75 exports per 5 minutes, 500 per 24 hours per user

## Export Formats Supported

- PNG (with optional transparency)
- JPG (with quality settings)
- PDF (with paper size options)
- GIF
- MP4 (video)
- PPTX (PowerPoint)
- HTML (bundle or standalone)

## Error Handling

### Common Errors

1. **Token Expired**
   - TODO: Implement token refresh logic
   - Currently returns 401 error

2. **Export Failed**
   - `license_required`: Design contains premium elements
   - `approval_required`: Design needs reviewer approval
   - `internal_failure`: Canva service error

3. **Upload Failed**
   - Falls back to storing Canva's temporary URL (expires in 24 hours)
   - User should be notified to re-export

## Future Improvements

1. **Token Refresh**
   - Implement automatic token refresh when expired
   - Use refresh token to get new access token

2. **Template Selection**
   - Allow users to start from predefined templates
   - Load product-specific templates

3. **Design Editing**
   - Allow users to re-edit existing designs
   - Store design ID for future edits

4. **Webhook Integration**
   - Use Canva webhooks instead of polling
   - Get notified when export is complete

5. **Batch Export**
   - Export multiple pages/designs at once
   - Handle multi-page designs better

6. **Design Preview**
   - Show thumbnail preview before export
   - Allow users to preview before finalizing

## Testing

### Manual Testing Steps

1. Start the application
2. Navigate to a product page
3. Click "Edit in Canva" button
4. Authorize the app on Canva
5. Edit the design in Canva
6. Click "Publish" or "Done"
7. Verify redirect to processing page
8. Verify export completes and file is saved
9. Verify redirect to product page

### Test Credentials

See `memory/test_credentials.md` for test account details.

## Troubleshooting

### Issue: "Invalid state parameter"
- State token expired (10 minute limit)
- State token not found in database
- Solution: Start OAuth flow again

### Issue: "Token exchange failed"
- Invalid client credentials
- Incorrect redirect URI
- Solution: Check environment variables match Canva app settings

### Issue: "Export taking too long"
- Large design file
- Canva service slow
- Solution: Increase polling timeout or implement webhook

### Issue: "Upload to Supabase failed"
- Storage bucket doesn't exist
- Insufficient permissions
- Solution: Create `user-uploads` bucket with public access

## References

- [Canva Connect API Documentation](https://canva.dev/docs/connect/)
- [Canva OAuth Guide](https://canva.dev/docs/connect/authentication/)
- [Canva Export API](https://canva.dev/docs/connect/api-reference/exports/)
