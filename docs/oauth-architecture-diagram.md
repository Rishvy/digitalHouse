# Canva OAuth Architecture: Before & After

## Before: Shallow Route Handlers

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Layer                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  /api/canva/auth/route.ts (80 lines)                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • Generate PKCE verifier & challenge                      │ │
│  │ • Generate state token                                    │ │
│  │ • Store state in database                                 │ │
│  │ • Build authorization URL                                 │ │
│  │ • Redirect to Canva                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  /api/canva/oauth/callback/route.ts (280 lines)                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • Validate state parameter                                │ │
│  │ • Check state expiration                                  │ │
│  │ • Retrieve code verifier from database                    │ │
│  │ • Build Basic Auth header                                 │ │
│  │ • Exchange code for tokens                                │ │
│  │ • Encrypt access & refresh tokens                         │ │
│  │ • Store encrypted tokens in database                      │ │
│  │ • Retrieve template details                               │ │
│  │ • Create design from template                             │ │
│  │ • Fall back to blank design on failure                    │ │
│  │ • Get design details                                      │ │
│  │ • Extend state expiration                                 │ │
│  │ • Build Canva editor URL                                  │ │
│  │ • Redirect to Canva editor                                │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Dependencies                        │
│  • Supabase (database, storage)                                │
│  • Canva API (OAuth, designs)                                  │
│  • Crypto (PKCE, encryption)                                   │
└─────────────────────────────────────────────────────────────────┘

Problems:
❌ Interface complexity = Implementation complexity (shallow)
❌ Can't test without HTTP server
❌ Changes require editing multiple route files
❌ Logic duplicated across routes
❌ Hard to reuse outside HTTP context
```

---

## After: Deep Module + Thin Adapters

```
┌─────────────────────────────────────────────────────────────────┐
│                         HTTP Layer                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Thin Adapters (translate HTTP ↔ Module)                       │
│                                                                 │
│  /api/canva/auth/route.ts (25 lines)                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • Extract params from HTTP request                        │ │
│  │ • Validate required params                                │ │
│  │ • Call initiateOAuthFlow()                                │ │
│  │ • Translate result to HTTP redirect                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  /api/canva/oauth/callback/route.ts (50 lines)                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • Extract params from HTTP request                        │ │
│  │ • Validate required params                                │ │
│  │ • Call completeOAuthFlow()                                │ │
│  │ • Translate result to HTTP redirect                       │ │
│  │ • Translate errors to HTTP status codes                   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SEAM (Module Interface)                      │
│                                                                 │
│  initiateOAuthFlow(context) → authUrl                          │
│  completeOAuthFlow(params) → { canvaEditorUrl, correlationState }│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Deep Module: lib/canva/oauth-flow.ts (450 lines)              │
│                                                                 │
│  Public Interface (what callers see):                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ initiateOAuthFlow(context)                                │ │
│  │ completeOAuthFlow(params)                                 │ │
│  │ OAuthFlowContext type                                     │ │
│  │ OAuthFlowResult type                                      │ │
│  │ OAuthError type                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Implementation (hidden from callers):                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Configuration Management                                  │ │
│  │ • getCanvaConfig()                                        │ │
│  │                                                           │ │
│  │ PKCE Utilities                                            │ │
│  │ • generatePKCE()                                          │ │
│  │                                                           │ │
│  │ State Management                                          │ │
│  │ • storeOAuthState()                                       │ │
│  │ • retrieveOAuthState()                                    │ │
│  │ • extendStateExpiration()                                 │ │
│  │                                                           │ │
│  │ Token Management                                          │ │
│  │ • exchangeCodeForTokens()                                 │ │
│  │ • storeTokens()                                           │ │
│  │                                                           │ │
│  │ Design Creation                                           │ │
│  │ • createDesignFromTemplate()                              │ │
│  │ • createBlankDesign()                                     │ │
│  │ • createDesignWithFallback()                              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Dependencies                        │
│  • Supabase (database, storage)                                │
│  • Canva API (OAuth, designs)                                  │
│  • Crypto (PKCE, encryption)                                   │
└─────────────────────────────────────────────────────────────────┘

Benefits:
✅ High leverage: 15 concerns → 2 methods (7.5x)
✅ Can test without HTTP server
✅ Changes happen in one module
✅ Logic centralized and reusable
✅ Can be used from anywhere (CLI, jobs, admin, tests)
```

---

## Depth Visualization

### Before (Shallow)

```
Interface Complexity:  ████████████████ (15 concerns)
Implementation:        ████████████████ (15 concerns)
                       ─────────────────
Depth:                 Low (1:1 ratio)
```

Callers must know almost as much as the implementation.

### After (Deep)

```
Interface Complexity:  ██ (2 methods)
Implementation:        ████████████████ (15 concerns)
                       ─────────────────
Depth:                 High (7.5:1 ratio)
```

Callers know very little; implementation hides complexity.

---

## Testability Comparison

### Before: HTTP Integration Tests Only

```
┌─────────────────────────────────────────────────────────────────┐
│                         Test Setup                              │
│  1. Start HTTP server                                           │
│  2. Create mock Canva API server                                │
│  3. Insert state into database                                  │
│  4. Set up environment variables                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Test Execution                             │
│  5. Make HTTP request to route                                  │
│  6. Wait for response                                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Test Assertions                            │
│  7. Assert on HTTP response                                     │
│  8. Check database for stored tokens                            │
│  9. Verify redirect URL                                         │
└─────────────────────────────────────────────────────────────────┘

Complexity: 9 steps, requires HTTP server
```

### After: Direct Module Tests

```
┌─────────────────────────────────────────────────────────────────┐
│                         Test Setup                              │
│  1. Mock Canva API responses                                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Test Execution                             │
│  2. Call module function directly                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Test Assertions                            │
│  3. Assert on return value                                      │
└─────────────────────────────────────────────────────────────────┘

Complexity: 3 steps, no HTTP server needed
```

---

## Locality Comparison

### Before: Changes Scattered

```
Adding refresh token support:

/api/canva/auth/route.ts
├─ Add refresh scope to authorization URL
└─ Update state storage

/api/canva/oauth/callback/route.ts
├─ Handle refresh token in response
├─ Store refresh token
└─ Add refresh logic

/api/canva/some-other-route.ts
└─ Use refresh token when access token expires

= 3+ files changed
```

### After: Changes Concentrated

```
Adding refresh token support:

lib/canva/oauth-flow.ts
├─ Add refresh scope to scopes array
├─ Handle refresh token in exchangeCodeForTokens()
├─ Store refresh token in storeTokens()
└─ Add refreshAccessToken() method

= 1 file changed
Routes automatically get new behavior
```

---

## Reusability Comparison

### Before: Tied to HTTP

```
Can only use OAuth from:
├─ HTTP routes
└─ (nowhere else)

Cannot use from:
├─ CLI tools ❌
├─ Background jobs ❌
├─ Admin interfaces ❌
└─ Tests ❌
```

### After: Independent of HTTP

```
Can use OAuth from:
├─ HTTP routes ✓
├─ CLI tools ✓
├─ Background jobs ✓
├─ Admin interfaces ✓
└─ Tests ✓

Example:
// In a CLI tool
const authUrl = await initiateOAuthFlow({ userId: 'admin' });
console.log('Visit:', authUrl);

// In a background job
await refreshAccessToken(userId);

// In tests
const result = await completeOAuthFlow(mockParams);
```

---

## Summary

The transformation from shallow route handlers to a deep module achieved:

| Aspect | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Leverage** | 1:1 | 7.5:1 | **7.5x** |
| **Locality** | 3+ files | 1 file | **3x** |
| **Testability** | HTTP only | Direct | **∞** |
| **Reusability** | Routes only | Anywhere | **∞** |
| **Route complexity** | 280 lines | 50 lines | **-82%** |

**This is what deepening achieves: more capability behind a smaller interface.**
