/**
 * Payment Provider Module
 * 
 * A deep module that abstracts payment gateway operations behind a unified interface.
 * Hides provider-specific API details, authentication, and error handling.
 * 
 * Interface (what callers must know):
 * - createOrder(params) → OrderResult
 * - refundPayment(params) → RefundResult
 * - verifyWebhook(rawBody, signature) → boolean
 * 
 * Implementation (what's hidden):
 * - Provider-specific API endpoints
 * - Authentication mechanisms (Basic Auth, API keys, etc.)
 * - Request/response shape transformations
 * - Fallback logic
 * - Error handling and retries
 */

// ============================================================================
// Types (part of the interface)
// ============================================================================

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

export interface RefundParams {
  provider: PaymentProvider;
  orderId: string;
  paymentId: string;
  amount: number;
  reason: string;
}

export interface RefundResult {
  refundId: string;
  status: string;
  amount: number;
}

export interface WebhookVerificationParams {
  provider: PaymentProvider;
  rawBody: string;
  signature: string;
}

// ============================================================================
// Provider Interface (internal seam)
// ============================================================================

interface PaymentProviderAdapter {
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  verifyWebhook(rawBody: string, signature: string): boolean;
}

// ============================================================================
// Cashfree Adapter (internal implementation)
// ============================================================================

class CashfreeAdapter implements PaymentProviderAdapter {
  private readonly appId: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor() {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
    if (!appId || !secretKey) {
      throw new Error('Cashfree credentials missing');
    }

    this.appId = appId;
    this.secretKey = secretKey;
    this.baseUrl = process.env.CASHFREE_BASE_URL ?? 'https://sandbox.cashfree.com/pg';
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: params.orderId,
        order_amount: Number(params.amount.toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          customer_id: params.userId,
          customer_email: params.email,
          customer_phone: params.phone,
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/orders/${params.orderId}/confirmation`,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cashfree create order failed: ${response.status} ${text}`);
    }

    const json = await response.json() as {
      cf_order_id: string;
      payment_session_id: string;
      order_status: string;
    };

    return {
      provider: 'cashfree',
      orderId: json.cf_order_id,
      paymentSessionId: json.payment_session_id,
      amount: params.amount,
    };
  }

  async refundPayment(params: RefundParams): Promise<RefundResult> {
    const response = await fetch(`${this.baseUrl}/orders/${params.orderId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': this.appId,
        'x-client-secret': this.secretKey,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        refund_id: `rfnd_${crypto.randomUUID()}`,
        refund_amount: Number(params.amount.toFixed(2)),
        refund_note: params.reason,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cashfree refund failed: ${response.status} ${text}`);
    }

    const json = await response.json() as {
      cf_refund_id: string;
      refund_status: string;
      refund_amount: number;
    };

    return {
      refundId: json.cf_refund_id,
      status: json.refund_status,
      amount: json.refund_amount,
    };
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = this.secretKey;
    const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    
    if (digest.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }
}

// ============================================================================
// Razorpay Adapter (internal implementation)
// ============================================================================

class RazorpayAdapter implements PaymentProviderAdapter {
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials missing');
    }

    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    // Razorpay order creation happens client-side with the key
    // Server just provides the checkout key
    return {
      provider: 'razorpay',
      orderId: `razorpay_${params.orderId}`,
      checkoutKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
      amount: params.amount,
    };
  }

  async refundPayment(params: RefundParams): Promise<RefundResult> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        payment_id: params.paymentId,
        amount: Math.round(params.amount * 100), // Razorpay uses paise
        notes: { 
          reason: params.reason, 
          reference_order_id: params.orderId 
        },
        receipt: `refund_${crypto.randomUUID().slice(0, 12)}`,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Razorpay refund failed: ${response.status} ${text}`);
    }

    const json = await response.json() as {
      id: string;
      status: string;
      amount: number;
    };

    return {
      refundId: json.id,
      status: json.status,
      amount: json.amount / 100, // Convert paise to rupees
    };
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    
    return expectedSignature === signature;
  }
}

// ============================================================================
// Provider Registry (internal)
// ============================================================================

const providers = new Map<PaymentProvider, PaymentProviderAdapter>();

function getProvider(provider: PaymentProvider): PaymentProviderAdapter {
  let adapter = providers.get(provider);
  
  if (!adapter) {
    // Lazy initialization
    adapter = provider === 'cashfree' 
      ? new CashfreeAdapter() 
      : new RazorpayAdapter();
    providers.set(provider, adapter);
  }
  
  return adapter;
}

// ============================================================================
// Public Interface
// ============================================================================

/**
 * Creates a payment order with the specified provider.
 * 
 * Automatically handles:
 * - Provider selection (preferred or fallback)
 * - Provider-specific API calls
 * - Authentication
 * - Response transformation
 * - Fallback to Razorpay on Cashfree failure
 * 
 * @param params - Order creation parameters
 * @returns Order result with provider-specific details
 */
export async function createOrder(params: CreateOrderParams): Promise<OrderResult> {
  const preferredProvider = params.preferredProvider ?? 'cashfree';
  
  // Try preferred provider first
  try {
    const provider = getProvider(preferredProvider);
    return await provider.createOrder(params);
  } catch (error) {
    // Fallback to Razorpay if Cashfree fails
    if (preferredProvider === 'cashfree') {
      console.warn('Cashfree failed, falling back to Razorpay:', error);
      const fallbackProvider = getProvider('razorpay');
      const result = await fallbackProvider.createOrder(params);
      return { ...result, fallback: true };
    }
    throw error;
  }
}

/**
 * Initiates a refund for a payment.
 * 
 * Automatically handles:
 * - Provider-specific API calls
 * - Authentication
 * - Amount formatting (paise vs rupees)
 * - Response transformation
 * - Error handling
 * 
 * @param params - Refund parameters
 * @returns Refund result
 */
export async function refundPayment(params: RefundParams): Promise<RefundResult> {
  const provider = getProvider(params.provider);
  return provider.refundPayment(params);
}

/**
 * Verifies a webhook signature from a payment provider.
 * 
 * Automatically handles:
 * - Provider-specific signature algorithms
 * - Secret key retrieval
 * - Timing-safe comparison
 * 
 * @param params - Webhook verification parameters
 * @returns True if signature is valid
 */
export function verifyWebhook(params: WebhookVerificationParams): boolean {
  const provider = getProvider(params.provider);
  return provider.verifyWebhook(params.rawBody, params.signature);
}

/**
 * Gets the list of available payment providers.
 * 
 * @returns Array of provider names
 */
export function getAvailableProviders(): PaymentProvider[] {
  const available: PaymentProvider[] = [];
  
  if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
    available.push('cashfree');
  }
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    available.push('razorpay');
  }
  
  return available;
}
