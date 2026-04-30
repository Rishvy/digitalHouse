# Canva OAuth Module Architecture

## Overview

The Canva OAuth Module is a **deep module** that handles the complete OAuth flow with Canva, including PKCE, state management, token exchange, encryption, and design creation with template fallback.

## Why This is a Deep Module

### Before (Shallow)

The OAuth logic was spread across route handlers:
- **Interface complexity**: Route handlers exposed HTTP details (query params, response codes, redirects)
- **Implementation complexity**: 280+ lines of OAuth protocol, encryption, database operations, and API calls
- **Testability**: Could only test through HTTP integration tests
- **Locality**: Changes to OAuth logic required editing multiple route files

The **deletion test** revealed the problem: deleting the route handler didn't concentrate complexity — it just moved it to wherever called the route.

### After (Deep)

The module exposes a simple interface:
```typescript
// Interface (what callers must know)
initiateOAuthFlow({ userId, productId?, variationId?, templateId? })
  → returns authorization URL

completeOAuthFlow({ code, state })
  → returns { canvaEditorUrl, correlationState }
```

The implementation hides:
- PKCE generation and validation
- State storage and retrieval
- Token exchange with Canva
- Token encryption and storage
- Design creation from templates
- Fallback to blank design on template failure
- Return navigation setup

## Depth Metrics

### Leverage (what callers get)

**Before**: Callers had to know about:
- PKCE code verifier/challenge generation
- State token generation and storage
- Database schema for oauth_states table
- Token exchange API endpoint and parameters
- Basic Auth header construction
- Token encryption algorithm
- Database schema for user_tokens table
- Canva design creation API
- Template lookup and fallback logic
- URL construction for Canva editor
- Correlation state for return navigation

**After**: Callers get:
- "Start OAuth flow" → get authorization URL
- "Complete OAuth flow" → get editor URL

**Leverage ratio**: ~15:1 (15 concerns hidden behind 2 interface methods)

### Locality (where changes concentrate)

**Before**: Changes scattered across:
- `/api/canva/auth/route.ts` (authorization)
- `/api/canva/oauth/callback/route.ts` (callback)
- Potentially other routes that need OAuth

**After**: All OAuth logic in one module:
- `src/lib/canva/oauth-flow.ts`

**Locality improvement**: Changes to OAuth (refresh tokens, webhooks, different scopes) happen in one file.

## Interface Design

### Types (part of the interface)

```typescript
interface OAuthFlowContext {
  userId: string;
  productId?: string;
  variationId?: string;
  templateId?: string;
}

interface OAuthFlowResult {
  canvaEditorUrl: string;
  correlationState: string;
}

interface OAuthCallbackParams {
  code: string;
  state: string;
}

interface OAuthError extends Error {
  code: 'INVALID_STATE' | 'EXPIRED_STATE' | 'TOKEN_EXCHANGE_FAILED' 
       | 'DESIGN_CREATION_FAILED' | 'CONFIG_MISSING';
  details?: any;
}
```

### Methods (the seam)

#### `initiateOAuthFlow(context: OAuthFlowContext): Promise<string>`

Starts the OAuth flow. Returns the Canva authorization URL that the user should be redirected to.

**What it does**:
1. Validates Canva configuration (client ID, secret, redirect URI)
2. Generates PKCE code verifier and challenge
3. Generates random state token for CSRF protection
4. Stores state, code verifier, and context in database
5. Constructs authorization URL with all parameters
6. Returns URL for redirect

**Error modes**:
- Throws `OAuthError` with code `CONFIG_MISSING` if environment variables are missing
- Throws `Error` if database storage fails

**Example**:
```typescript
const authUrl = await initiateOAuthFlow({
  userId: 'user-123',
  productId: 'product-456',
  templateId: 'template-789',
});

// Redirect user to authUrl
```

#### `completeOAuthFlow(params: OAuthCallbackParams): Promise<OAuthFlowResult>`

Completes the OAuth flow after user authorization. Returns the Canva editor URL with correlation state.

**What it does**:
1. Retrieves and validates state from database
2. Checks state expiration
3. Exchanges authorization code for tokens using PKCE
4. Encrypts tokens
5. Stores encrypted tokens in database
6. Retrieves template details if template was selected
7. Creates design from template (or blank if no template)
8. Falls back to blank design if template creation fails
9. Extends state expiration for return navigation
10. Constructs Canva editor URL with correlation state
11. Returns result

**Error modes**:
- Throws `OAuthError` with code `INVALID_STATE` if state not found in database
- Throws `OAuthError` with code `EXPIRED_STATE` if state has expired
- Throws `OAuthError` with code `TOKEN_EXCHANGE_FAILED` if Canva rejects the code
- Throws `OAuthError` with code `DESIGN_CREATION_FAILED` if both template and blank design fail
- Throws `OAuthError` with code `CONFIG_MISSING` if environment variables are missing

**Example**:
```typescript
const result = await completeOAuthFlow({
  code: 'auth_code_from_canva',
  state: 'state_from_url',
});

// Redirect user to result.canvaEditorUrl
```

## Route Handlers as Thin Adapters

The route handlers are now **thin adapters** that translate HTTP to the module's interface:

### `/api/canva/auth/route.ts` (25 lines, was 80 lines)

```typescript
export async function GET(request: Request) {
  // Extract params from HTTP request
  const { userId, productId, variationId, templateId } = extractParams(request);
  
  // Validate required params
  if (!userId) return errorResponse("Please log in", 401);
  
  // Delegate to module
  const authUrl = await initiateOAuthFlow({ userId, productId, variationId, templateId });
  
  // Translate result to HTTP response
  return NextResponse.redirect(authUrl);
}
```

### `/api/canva/oauth/callback/route.ts` (50 lines, was 280 lines)

```typescript
export async function GET(request: Request) {
  // Extract params from HTTP request
  const { code, state, error } = extractParams(request);
  
  // Handle Canva errors
  if (error) return errorResponse(`Canva auth error: ${error}`, 400);
  
  // Validate required params
  if (!state || !code) return errorResponse("Missing parameters", 400);
  
  // Delegate to module
  const result = await completeOAuthFlow({ code, state });
  
  // Translate result to HTTP response
  return NextResponse.redirect(result.canvaEditorUrl);
}
```

## Testing Strategy

### Module Tests (unit tests)

Test the module's interface directly without HTTP:

```typescript
describe('initiateOAuthFlow', () => {
  it('should generate authorization URL with PKCE parameters', async () => {
    const authUrl = await initiateOAuthFlow({ userId: 'user-123' });
    expect(authUrl).toContain('code_challenge=');
    expect(authUrl).toContain('code_challenge_method=S256');
  });
  
  it('should throw CONFIG_MISSING when environment variables are missing', async () => {
    delete process.env.CANVA_CLIENT_ID;
    await expect(initiateOAuthFlow({ userId: 'user-123' }))
      .rejects.toThrow('Canva configuration missing');
  });
});

describe('completeOAuthFlow', () => {
  it('should fall back to blank design when template creation fails', async () => {
    // Mock Canva API to fail template creation
    mockCanvaAPI.createDesign.mockRejectedValueOnce(new Error('Template not found'));
    
    // Should not throw — should fall back to blank design
    const result = await completeOAuthFlow({ code: 'code', state: 'state' });
    expect(result.canvaEditorUrl).toBeDefined();
  });
  
  it('should throw EXPIRED_STATE when state has expired', async () => {
    // Mock database to return expired state
    mockDatabase.getState.mockResolvedValueOnce({ expiresAt: new Date('2020-01-01') });
    
    await expect(completeOAuthFlow({ code: 'code', state: 'state' }))
      .rejects.toMatchObject({ code: 'EXPIRED_STATE' });
  });
});
```

### Route Tests (integration tests)

Test that routes correctly translate HTTP to module calls:

```typescript
describe('GET /api/canva/auth', () => {
  it('should redirect to authorization URL', async () => {
    const response = await GET(mockRequest({ userId: 'user-123' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('canva.com/api/oauth/authorize');
  });
  
  it('should return 401 when userId is missing', async () => {
    const response = await GET(mockRequest({}));
    expect(response.status).toBe(401);
  });
});
```

## Benefits Achieved

### 1. Testability

**Before**: Could only test OAuth flow through HTTP integration tests. Required:
- Starting HTTP server
- Making real HTTP requests
- Mocking Canva API at network level
- Testing through route handlers

**After**: Can test OAuth logic directly:
- No HTTP server needed
- Mock Canva API at function level
- Test template fallback logic in isolation
- Test PKCE validation independently
- Test token encryption separately

### 2. Maintainability

**Before**: OAuth changes required editing multiple route files. Example: adding refresh token support would touch:
- `/api/canva/auth/route.ts` (add refresh scope)
- `/api/canva/oauth/callback/route.ts` (handle refresh token)
- Any other routes that need tokens

**After**: OAuth changes happen in one module:
- Add refresh token support in `oauth-flow.ts`
- Routes automatically get the new behavior
- No route changes needed

### 3. Reusability

**Before**: OAuth logic was tied to HTTP routes. Couldn't reuse for:
- CLI tools
- Background jobs
- Admin interfaces
- Testing utilities

**After**: OAuth logic is independent of HTTP:
- Can be called from anywhere
- Can be used in CLI tools
- Can be used in background jobs
- Can be used in tests

### 4. Error Handling

**Before**: Errors were HTTP-specific (status codes, response bodies). Hard to:
- Distinguish error types
- Handle errors programmatically
- Test error scenarios

**After**: Errors are typed and semantic:
- `INVALID_STATE` — state not found or invalid
- `EXPIRED_STATE` — state has expired
- `TOKEN_EXCHANGE_FAILED` — Canva rejected the code
- `DESIGN_CREATION_FAILED` — both template and blank design failed
- `CONFIG_MISSING` — environment variables missing

Routes translate these to appropriate HTTP status codes.

## Future Improvements

The deep module makes these future changes easier:

### 1. Refresh Token Support

Add to module:
```typescript
export async function refreshAccessToken(userId: string): Promise<void> {
  // Retrieve refresh token
  // Exchange for new access token
  // Store new tokens
}
```

Routes don't change — they already use the module's interface.

### 2. Webhook Integration

Add to module:
```typescript
export async function handleCanvaWebhook(event: CanvaWebhookEvent): Promise<void> {
  // Process webhook event
  // Update design status
  // Trigger export if needed
}
```

Create new route that delegates to module:
```typescript
export async function POST(request: Request) {
  const event = await request.json();
  await handleCanvaWebhook(event);
  return NextResponse.json({ success: true });
}
```

### 3. Template Preview

Add to module:
```typescript
export async function getTemplatePreview(templateId: string): Promise<string> {
  // Retrieve template details
  // Generate preview URL
  // Return preview
}
```

Template selector component calls module directly — no new route needed.

### 4. Multi-Provider OAuth

The module pattern can be replicated for other providers:
- `oauth-flow-canva.ts` (current)
- `oauth-flow-figma.ts` (future)
- `oauth-flow-adobe.ts` (future)

All share the same interface shape, making them interchangeable.

## Conclusion

The Canva OAuth Module demonstrates the power of **depth** in software architecture:

- **High leverage**: Callers get "complete OAuth flow" instead of managing 15+ concerns
- **Strong locality**: All OAuth logic in one place, changes concentrate
- **Testable interface**: Can test without HTTP, mock at function level
- **Clear error modes**: Typed errors with semantic codes
- **Future-proof**: Easy to add refresh tokens, webhooks, new providers

The route handlers became **thin adapters** (25-50 lines) that translate HTTP to the module's interface. The module became the **seam** where OAuth behavior can be altered without editing routes.

This is what **deepening** achieves: more capability behind a smaller interface.
