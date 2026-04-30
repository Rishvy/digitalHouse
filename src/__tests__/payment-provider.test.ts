/**
 * Payment Provider Module Tests
 * 
 * Tests the deep payment provider module without needing actual API calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables
beforeEach(() => {
  process.env.CASHFREE_APP_ID = 'test_app_id';
  process.env.CASHFREE_SECRET_KEY = 'test_secret_key';
  process.env.CASHFREE_BASE_URL = 'https://sandbox.cashfree.com/pg';
  process.env.RAZORPAY_KEY_ID = 'test_razorpay_key';
  process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test_razorpay_public_key';
});

describe('Payment Provider Module', () => {
  describe('getAvailableProviders', () => {
    it('should return available providers based on env vars', async () => {
      const { getAvailableProviders } = await import('@/lib/payments/payment-provider');
      const providers = getAvailableProviders();
      
      expect(providers).toContain('cashfree');
      expect(providers).toContain('razorpay');
    });

    it('should not return providers without credentials', async () => {
      delete process.env.CASHFREE_APP_ID;
      
      // Need to re-import to get fresh module
      vi.resetModules();
      const { getAvailableProviders } = await import('@/lib/payments/payment-provider');
      const providers = getAvailableProviders();
      
      expect(providers).not.toContain('cashfree');
      expect(providers).toContain('razorpay');
    });
  });

  describe('createOrder', () => {
    it('should export createOrder function', async () => {
      const mod = await import('@/lib/payments/payment-provider');
      expect(typeof mod.createOrder).toBe('function');
    });

    it('should export refundPayment function', async () => {
      const mod = await import('@/lib/payments/payment-provider');
      expect(typeof mod.refundPayment).toBe('function');
    });

    it('should export verifyWebhook function', async () => {
      const mod = await import('@/lib/payments/payment-provider');
      expect(typeof mod.verifyWebhook).toBe('function');
    });
  });
});
