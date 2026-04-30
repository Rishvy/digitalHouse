# Canva OAuth Module - Quick Reference

## Usage

### Starting OAuth Flow

```typescript
import { initiateOAuthFlow } from '@/lib/canva/oauth-flow';

// In a route handler
export async function GET(request: Request) {
  const { userId, productId, variationId, templateId } = extractParams(request);
  
  const authUrl = await initiateOAuthFlow({
    userId,
    productId,      // optional
    variationId,    // optional
    templateId,     // optional
  });
  
  return NextResponse.redirect(authUrl);
}
```

### Completing OAuth Flow

```typescript
import { completeOAuthFlow } from '@/lib/canva/oauth-flow';

// In a callback route handler
export async function GET(request: Request) {
  const { code, state } = extractParams(request);
  
  const result = await completeOAuthFlow({ code, state });
  
  return NextResponse.redirect(result.canvaEditorUrl);
}
```

## Error Handling

```typescript
import { completeOAuthFlow, type OAuthError } from '@/lib/canva/oauth-flow';

try {
  const result = await completeOAuthFlow({ code, state });
  // Success
} catch (error) {
  const oauthError = error as OAuthError;
  
  switch (oauthError.code) {
    case 'INVALID_STATE':
      // State not found in database
      return errorResponse("Invalid request. Please try again.", 400);
      
    case 'EXPIRED_STATE':
      // State has expired (>10 minutes old)
      return errorResponse("Request expired. Please try again.", 400);
      
    case 'TOKEN_EXCHANGE_FAILED':
      // Canva rejected the authorization code
      return errorResponse("Authorization failed. Please try again.", 500);
      
    case 'DESIGN_CREATION_FAILED':
      // Both template and blank design failed
      return errorResponse("Failed to create design. Please try again.", 500);
      
    case 'CONFIG_MISSING':
      // Environment variables not set
      return errorResponse("Service configuration error.", 500);
      
    default:
      return errorResponse("An unexpected error occurred.", 500);
  }
}
```

## Types

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

## Environment Variables

Required in `.env`:

```bash
CANVA_CLIENT_ID=your_client_id
CANVA_CLIENT_SECRET=your_client_secret
CANVA_REDIRECT_URI=http://localhost:3000/api/canva/oauth/callback
CANVA_TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key
```

## What the Module Does

### `initiateOAuthFlow()`

1. ✓ Validates Canva configuration
2. ✓ Generates PKCE code verifier and challenge
3. ✓ Generates random state token
4. ✓ Stores state and context in database
5. ✓ Constructs authorization URL
6. ✓ Returns URL for redirect

### `completeOAuthFlow()`

1. ✓ Retrieves and validates state
2. ✓ Checks state expiration
3. ✓ Exchanges code for tokens (PKCE)
4. ✓ Encrypts tokens
5. ✓ Stores tokens in database
6. ✓ Retrieves template details (if selected)
7. ✓ Creates design from template
8. ✓ Falls back to blank design on failure
9. ✓ Extends state for return navigation
10. ✓ Constructs Canva editor URL
11. ✓ Returns result

## Testing

```typescript
import { initiateOAuthFlow, completeOAuthFlow } from '@/lib/canva/oauth-flow';

describe('OAuth Flow', () => {
  it('should generate authorization URL', async () => {
    const authUrl = await initiateOAuthFlow({ userId: 'user-123' });
    expect(authUrl).toContain('canva.com/api/oauth/authorize');
  });
  
  it('should handle template fallback', async () => {
    // Mock Canva API to fail template creation
    mockCanvaAPI.createDesign.mockRejectedValueOnce(new Error('Template not found'));
    
    // Should not throw — should fall back to blank design
    const result = await completeOAuthFlow({ code: 'code', state: 'state' });
    expect(result.canvaEditorUrl).toBeDefined();
  });
});
```

## Common Patterns

### With Template Selection

```typescript
// User selects template
const templateId = 'template-123';

// Start OAuth with template
const authUrl = await initiateOAuthFlow({
  userId: 'user-456',
  templateId,
});

// Redirect to Canva
// User authorizes
// Callback receives code and state

// Complete OAuth
const result = await completeOAuthFlow({ code, state });

// Design is created from template (or blank if template fails)
// User is redirected to Canva editor
```

### Without Template (Blank Canvas)

```typescript
// Start OAuth without template
const authUrl = await initiateOAuthFlow({
  userId: 'user-456',
});

// Complete OAuth
const result = await completeOAuthFlow({ code, state });

// Blank A4 design is created
// User is redirected to Canva editor
```

### With Product Context

```typescript
// Start OAuth with product context
const authUrl = await initiateOAuthFlow({
  userId: 'user-456',
  productId: 'product-789',
  variationId: 'variation-012',
});

// Product context is preserved through the flow
// Available in return navigation
```

## Migration Guide

### Before (Old Route Handler)

```typescript
export async function GET(request: Request) {
  // 280 lines of OAuth logic
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomBytes(96).toString("base64url");
  // ... PKCE generation
  // ... state storage
  // ... token exchange
  // ... encryption
  // ... design creation
  // ... fallback logic
  // ... URL construction
}
```

### After (New Thin Adapter)

```typescript
import { completeOAuthFlow } from '@/lib/canva/oauth-flow';

export async function GET(request: Request) {
  const { code, state } = extractParams(request);
  
  try {
    const result = await completeOAuthFlow({ code, state });
    return NextResponse.redirect(result.canvaEditorUrl);
  } catch (error) {
    return handleOAuthError(error);
  }
}
```

## Benefits

✅ **Testable** — Can test without HTTP server
✅ **Maintainable** — All OAuth logic in one place
✅ **Reusable** — Can be used from anywhere
✅ **Type-safe** — Full TypeScript support
✅ **Error-friendly** — Typed error codes
✅ **Well-documented** — Comprehensive inline docs

## Documentation

- **Architecture**: `docs/canva-oauth-module.md`
- **Comparison**: `docs/architecture-deepening-summary.md`
- **Diagrams**: `docs/oauth-architecture-diagram.md`
- **Module Code**: `src/lib/canva/oauth-flow.ts`
- **Tests**: `src/__tests__/canva-oauth-flow.test.ts`

## Support

For questions or issues:
1. Check the architecture documentation
2. Review the test cases for examples
3. Read the inline comments in the module code
