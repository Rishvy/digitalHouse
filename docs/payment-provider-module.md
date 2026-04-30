# Payment Provider Module

## Overview

The Payment Provider Module is a **deep module** that abstracts payment gateway operations behind a unified interface. It hides provider-specific API details, authentication mechanisms, and error handling.

## Why This is a Deep Module

### Before (Shallow)

Payment logic was mixed in `provider.ts`:
- **Interface complexity**: Conditional logic for each provider
- **Implementation complexity**: Provider-specific code inline
- **Extensibility**: Hard to add new providers (Stripe, PayPal, etc.)
- **Consistency**: Razorpay inline vs Cashfree in separate module

The **deletion test** revealed the problem: the file was doing orchestration + provider-specific logic, making it hard to add new providers.

### After (Deep)

The module exposes a simple interface:
```typescript
// Interface (what callers must know)
createOrder(params) → OrderResult
refundPayment(params) → RefundResult
verifyWebhook(params) → boolean
getAvailableProviders() → PaymentProvider[]

// Implementation (hidden)
- Provider-specific API endpoints
- Authentication mechanisms (Basic Auth, API keys)
- Request/response transformations
- Fallback logic
- Error handling
```

## Depth Metrics

### Leverage (what callers get)

**Before**: Callers had to know about:
- Conditional logic for provider selection
- Provider-specific API details
- Fallback logic
- Authentication mechanisms
- Response shape differences

**After**: Callers get:
- "Create order" → get order result
- "Refund payment" → get refund result
- "Verify webhook" → get boolean

**Leverage ratio**: 5:3 = **1.7x**

### Locality (where changes concentrate)

**Before**: Provider logic mixed in orchestration file
**After**: Each provider in its own adapter class

**Locality improvement**: 1 file (mixed) → 1 module with provider adapters

## Architecture

### Provider Interface (Seam)

```typescript
interface PaymentProviderAdapter {
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  verifyWebhook(rawBody: string, signature: string): boolean;
}
```

### Provider Adapters

1. **CashfreeAdapter** - Implements Cashfree API
2. **RazorpayAdapter** - Implements Razorpay API

Each adapter:
- Handles authentication
- Transforms requests/responses
- Manages provider-specific details

### Provider Registry

Lazy initialization of providers:
```typescript
const providers = new Map<PaymentProvider, PaymentProviderAdapter>();

function getProvider(provider: PaymentProvider): PaymentProviderAdapter {
  // Lazy initialization
  // Returns cached adapter or creates new one
}
```

## Interface Design

### Types (part of the interface)

```typescript
export type PaymentProvider = 'cashfree' | 'razorpay';

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  userId: string;
  email: string;
  phone: string;
  preferredProvider?: PaymentProvider;
}

export interface OrderResult {
  provider: PaymentProvider;
  orderId: string;
  paymentSessionId?: string;
  checkoutKey?: string;
  amount: number;
  fallback?: boolean;
}
```

### Functions (the seam)

#### `createOrder(params): Promise<OrderResult>`

Creates a payment order with the specified provider.

**What it does**:
1. Selects provider (preferred or default)
2. Calls provider-specific API
3. Handles authentication
4. Transforms response
5. Falls back to Razorpay on Cashfree failure

**Error modes**:
- Throws if both providers fail
- Returns `{ fallback: true }` if Cashfree fails and Razorpay succeeds

**Example**:
```typescript
const result = await createOrder({
  orderId: 'order_123',
  amount: 1000,
  userId: 'user_456',
  email: 'user@example.com',
  phone: '+919876543210',
  preferredProvider: 'cashfree',
});

if (result.fallback) {
  console.log('Fell back to Razorpay');
}
```

#### `refundPayment(params): Promise<RefundResult>`

Initiates a refund for a payment.

**What it does**:
1. Gets provider adapter
2. Calls provider-specific refund API
3. Handles authentication
4. Transforms response (paise ↔ rupees)

**Example**:
```typescript
const result = await refundPayment({
  provider: 'cashfree',
  orderId: 'order_123',
  paymentId: 'payment_456',
  amount: 500,
  reason: 'Customer request',
});

console.log('Refund ID:', result.refundId);
```

#### `verifyWebhook(params): boolean`

Verifies a webhook signature from a payment provider.

**What it does**:
1. Gets provider adapter
2. Uses provider-specific signature algorithm
3. Performs timing-safe comparison

**Example**:
```typescript
const isValid = verifyWebhook({
  provider: 'cashfree',
  rawBody: req.body,
  signature: req.headers['x-webhook-signature'],
});

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

#### `getAvailableProviders(): PaymentProvider[]`

Gets the list of available payment providers based on environment variables.

**Example**:
```typescript
const providers = getAvailableProviders();
// ['cashfree', 'razorpay']
```

## Thin Adapter

The `provider.ts` file is now a **thin adapter** that maintains backward compatibility:

```typescript
// Before: 75 lines with conditional logic
// After: 25 lines delegating to deep module

export async function createPaymentOrder(params) {
  return createOrder({
    orderId: params.orderId,
    amount: params.amount,
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    preferredProvider: params.preferredGateway,
  });
}
```

**Adapter size**: 25 lines (was 75 lines)
**Reduction**: **-67%**

## Benefits Achieved

### 1. Extensibility

**Before**: Hard to add new providers
```typescript
// Would need to add conditional logic in multiple places
if (params.preferredGateway === "stripe") {
  // Stripe logic here
} else if (params.preferredGateway === "paypal") {
  // PayPal logic here
}
```

**After**: Easy to add new providers
```typescript
// Just create a new adapter class
class StripeAdapter implements PaymentProviderAdapter {
  async createOrder(params) { /* Stripe API */ }
  async refundPayment(params) { /* Stripe API */ }
  verifyWebhook(rawBody, signature) { /* Stripe signature */ }
}

// Register it
providers.set('stripe', new StripeAdapter());
```

### 2. Testability

**Before**: Hard to test without mocking fetch
```typescript
// Needed to mock fetch for each provider
vi.mock('fetch');
```

**After**: Easy to test with mock adapters
```typescript
// Can create mock adapter
class MockAdapter implements PaymentProviderAdapter {
  async createOrder() { return mockResult; }
  async refundPayment() { return mockRefund; }
  verifyWebhook() { return true; }
}
```

### 3. Consistency

**Before**: Inconsistent provider handling
- Cashfree in separate module
- Razorpay inline
- Different error handling

**After**: Consistent provider handling
- All providers implement same interface
- Same error handling pattern
- Same authentication pattern

### 4. Maintainability

**Before**: Provider logic mixed with orchestration
- Hard to understand what's provider-specific
- Changes to one provider could affect others
- Fallback logic mixed with provider logic

**After**: Clear separation
- Provider logic in adapters
- Orchestration in public functions
- Fallback logic in one place

## Future Improvements

The deep module makes these future changes easier:

### 1. Add Stripe

```typescript
class StripeAdapter implements PaymentProviderAdapter {
  private readonly secretKey: string;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY!;
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    // Stripe API call
  }

  async refundPayment(params: RefundParams): Promise<RefundResult> {
    // Stripe refund API
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    // Stripe signature verification
  }
}
```

### 2. Add PayPal

```typescript
class PayPalAdapter implements PaymentProviderAdapter {
  // Similar implementation
}
```

### 3. Add Provider Health Checks

```typescript
interface PaymentProviderAdapter {
  // ... existing methods
  healthCheck(): Promise<boolean>;
}

export async function getHealthyProvider(): Promise<PaymentProvider> {
  for (const provider of getAvailableProviders()) {
    const adapter = getProvider(provider);
    if (await adapter.healthCheck()) {
      return provider;
    }
  }
  throw new Error('No healthy providers available');
}
```

### 4. Add Provider Metrics

```typescript
class MetricsAdapter implements PaymentProviderAdapter {
  constructor(private inner: PaymentProviderAdapter) {}

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const start = Date.now();
    try {
      const result = await this.inner.createOrder(params);
      recordMetric('order_created', Date.now() - start);
      return result;
    } catch (error) {
      recordMetric('order_failed', Date.now() - start);
      throw error;
    }
  }
  
  // ... wrap other methods
}
```

## Comparison

### Before (Shallow)

```typescript
// 75 lines mixing orchestration with provider logic
export async function createPaymentOrder(params) {
  if (params.preferredGateway === "razorpay") {
    // Razorpay logic inline
    return {
      provider: "razorpay",
      orderId: `razorpay_${params.orderId}`,
      checkoutKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: params.amount,
    };
  }

  try {
    // Cashfree logic via separate module
    const cashfree = await createCashfreeOrder({...});
    return cashfree;
  } catch {
    // Fallback logic mixed in
    return { provider: "razorpay", ... };
  }
}
```

**Problems**:
- Conditional logic for each provider
- Razorpay inline vs Cashfree in module
- Hard to add new providers
- Fallback logic mixed with provider logic

### After (Deep Module)

```typescript
// payment-provider.ts (deep module)
export async function createOrder(params) {
  const preferredProvider = params.preferredProvider ?? 'cashfree';
  
  try {
    const provider = getProvider(preferredProvider);
    return await provider.createOrder(params);
  } catch (error) {
    if (preferredProvider === 'cashfree') {
      const fallbackProvider = getProvider('razorpay');
      const result = await fallbackProvider.createOrder(params);
      return { ...result, fallback: true };
    }
    throw error;
  }
}

// provider.ts (thin adapter, 25 lines)
export async function createPaymentOrder(params) {
  return createOrder({
    orderId: params.orderId,
    amount: params.amount,
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    preferredProvider: params.preferredGateway,
  });
}
```

**Benefits**:
- Provider logic in adapters ✅
- Consistent interface ✅
- Easy to add new providers ✅
- Clear separation of concerns ✅

## Conclusion

The Payment Provider Module demonstrates successful **deepening**:

- **Moderate leverage**: 1.7x reduction in interface complexity (5 concerns → 3 functions)
- **Strong locality**: Provider logic in adapters, orchestration in module
- **Testable interface**: Can test with mock adapters
- **Clear separation**: Provider-specific vs orchestration logic
- **Future-proof**: Easy to add Stripe, PayPal, health checks, metrics

The adapter file became a **thin adapter** (25 lines, -67%) that maintains backward compatibility. The module became the **seam** where payment provider behavior can be altered without editing callers.

**This is what deepening achieves: more capability behind a smaller interface.**
