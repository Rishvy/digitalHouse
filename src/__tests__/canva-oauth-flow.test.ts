/**
 * Tests for the Canva OAuth Flow Module
 * 
 * These tests demonstrate the improved testability of the deep module.
 * We can test OAuth logic without HTTP, mock Canva API responses,
 * and verify template fallback behavior directly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initiateOAuthFlow, completeOAuthFlow } from '@/lib/canva/oauth-flow';

// Mock dependencies
vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
      upsert: vi.fn(() => ({ error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

vi.mock('@/lib/canva/crypto', () => ({
  encrypt: vi.fn((text: string) => `encrypted_${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted_', '')),
}));

describe('Canva OAuth Flow Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up environment variables
    process.env = {
      ...originalEnv,
      CANVA_CLIENT_ID: 'test_client_id',
      CANVA_CLIENT_SECRET: 'test_client_secret',
      CANVA_REDIRECT_URI: 'http://localhost:3000/api/canva/oauth/callback',
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initiateOAuthFlow', () => {
    it('should generate authorization URL with PKCE parameters', async () => {
      const context = {
        userId: 'user-123',
        productId: 'product-456',
        templateId: 'template-789',
      };

      const authUrl = await initiateOAuthFlow(context);

      // Verify URL structure
      expect(authUrl).toContain('https://www.canva.com/api/oauth/authorize');
      expect(authUrl).toContain('code_challenge=');
      expect(authUrl).toContain('code_challenge_method=S256');
      expect(authUrl).toContain('client_id=test_client_id');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('state=');
    });

    it('should include all required OAuth scopes', async () => {
      const context = { userId: 'user-123' };
      const authUrl = await initiateOAuthFlow(context);

      const url = new URL(authUrl);
      const scopes = url.searchParams.get('scope');

      expect(scopes).toContain('asset:read');
      expect(scopes).toContain('asset:write');
      expect(scopes).toContain('design:content:read');
      expect(scopes).toContain('design:content:write');
      expect(scopes).toContain('design:meta:read');
      expect(scopes).toContain('profile:read');
    });

    it('should throw error when Canva config is missing', async () => {
      delete process.env.CANVA_CLIENT_ID;

      const context = { userId: 'user-123' };

      await expect(initiateOAuthFlow(context)).rejects.toThrow('Canva configuration missing');
    });
  });

  describe('completeOAuthFlow', () => {
    it('should throw error when state is not found', async () => {
      // The mock returns null data, simulating state not found
      const params = {
        code: 'auth_code_123',
        state: 'state_456',
      };

      await expect(completeOAuthFlow(params)).rejects.toThrow('Invalid or expired state parameter');
    });

    // Note: Full integration tests would require mocking fetch and Supabase responses
    // These tests demonstrate the interface is testable without HTTP
  });

  describe('Error Handling', () => {
    it('should provide typed error codes for different failure modes', async () => {
      delete process.env.CANVA_CLIENT_ID;

      try {
        await initiateOAuthFlow({ userId: 'user-123' });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('CONFIG_MISSING');
        expect(error.details).toBeDefined();
      }
    });
  });
});

/**
 * Integration Test Examples (would require more setup)
 * 
 * These demonstrate what's now possible with the deep module:
 * 
 * 1. Test template fallback logic:
 *    - Mock Canva API to return template creation error
 *    - Verify module falls back to blank design
 *    - Verify no error is thrown to caller
 * 
 * 2. Test token encryption:
 *    - Mock token exchange response
 *    - Verify tokens are encrypted before storage
 *    - Verify encrypted tokens are stored in database
 * 
 * 3. Test state expiration:
 *    - Create expired state in database
 *    - Attempt to complete OAuth flow
 *    - Verify EXPIRED_STATE error is thrown
 * 
 * 4. Test PKCE validation:
 *    - Store state with code_verifier
 *    - Mock token exchange with wrong verifier
 *    - Verify TOKEN_EXCHANGE_FAILED error
 * 
 * All of these tests can now be written without:
 * - Starting an HTTP server
 * - Making real HTTP requests
 * - Testing through route handlers
 */
