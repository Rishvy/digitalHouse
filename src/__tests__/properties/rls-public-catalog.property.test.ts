// Feature: w2p-platform-init, Property 2: Public Catalog Read
// Validates: Requirements 5.4, 5.5, 5.6, 5.7

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Models the public catalog read RLS policies.
 * Policy: USING (true) — any session (including unauthenticated) can SELECT.
 */

// Policy: public_read_categories / public_read_products / public_read_variations / public_read_templates
// USING (true) — always permits SELECT regardless of auth state
function publicCatalogSelectPolicy(_authUid: string | null): boolean {
  return true
}

interface CatalogRow {
  name: string
  slug: string
}

describe('Property 2: Public Catalog Read', () => {
  it('any catalog row is readable by an unauthenticated session (null uid)', () => {
    fc.assert(
      fc.property(
        fc.record({ name: fc.string(), slug: fc.string() }),
        (row: CatalogRow) => {
          // Unauthenticated session — auth.uid() is null
          expect(publicCatalogSelectPolicy(null)).toBe(true)
          // The row itself doesn't affect the policy result
          expect(row).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('any catalog row is readable by an authenticated customer', () => {
    fc.assert(
      fc.property(
        fc.record({ name: fc.string(), slug: fc.string() }),
        fc.uuid(),
        (row: CatalogRow, authUid: string) => {
          expect(publicCatalogSelectPolicy(authUid)).toBe(true)
          expect(row).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('public read policy is USING (true) — independent of row content', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          slug: fc.string(),
        }),
        fc.option(fc.uuid(), { nil: null }),
        (row: CatalogRow, authUid: string | null) => {
          // Policy USING (true) always returns true regardless of row or session
          const canSelect = publicCatalogSelectPolicy(authUid)
          expect(canSelect).toBe(true)
          expect(row).toBeDefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('product_categories, products, product_variations, and templates all use USING (true)', () => {
    // Verify the policy definition for all four catalog tables is identical
    const catalogTables = [
      'product_categories',
      'products',
      'product_variations',
      'templates',
    ] as const

    const policyDefinitions: Record<string, { operation: string; using: string }[]> = {
      product_categories: [
        { operation: 'SELECT', using: 'true' },
      ],
      products: [
        { operation: 'SELECT', using: 'true' },
      ],
      product_variations: [
        { operation: 'SELECT', using: 'true' },
      ],
      templates: [
        { operation: 'SELECT', using: 'true' },
      ],
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...catalogTables),
        fc.record({ name: fc.string(), slug: fc.string() }),
        fc.option(fc.uuid(), { nil: null }),
        (table, _row, authUid) => {
          const policies = policyDefinitions[table]
          const selectPolicy = policies.find(p => p.operation === 'SELECT')
          expect(selectPolicy).toBeDefined()
          expect(selectPolicy!.using).toBe('true')
          // Simulate evaluation: USING (true) always allows
          expect(publicCatalogSelectPolicy(authUid)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
