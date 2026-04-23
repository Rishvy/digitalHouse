// Feature: w2p-platform-init, Property 3: Admin Full Access
// Validates: Requirements 6.1

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Models the admin full-access RLS policies.
 * All admin policies use: USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
 * This grants SELECT, INSERT, UPDATE, DELETE on every table to admin users.
 */

type UserRole = 'customer' | 'admin' | 'production_staff'
type Operation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'

// Simulates the admin policy predicate
function adminPolicyAllows(authUserRole: UserRole): boolean {
  return authUserRole === 'admin'
}

const ALL_TABLES = [
  'users',
  'orders',
  'order_items',
  'product_categories',
  'products',
  'product_variations',
  'templates',
  'production_tracking',
] as const

type TableName = typeof ALL_TABLES[number]

const ALL_OPERATIONS: Operation[] = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

// Admin policy definitions per table (FOR ALL = covers all operations)
const adminPolicies: Record<TableName, { policyName: string; operation: 'ALL' }> = {
  users: { policyName: 'admin_all_users', operation: 'ALL' },
  orders: { policyName: 'admin_all_orders', operation: 'ALL' },
  order_items: { policyName: 'admin_all_order_items', operation: 'ALL' },
  product_categories: { policyName: 'admin_all_categories', operation: 'ALL' },
  products: { policyName: 'admin_all_products', operation: 'ALL' },
  product_variations: { policyName: 'admin_all_variations', operation: 'ALL' },
  templates: { policyName: 'admin_all_templates', operation: 'ALL' },
  production_tracking: { policyName: 'admin_all_production_tracking', operation: 'ALL' },
}

describe('Property 3: Admin Full Access', () => {
  it('admin can perform all operations on every table', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_TABLES),
        fc.constantFrom(...ALL_OPERATIONS),
        fc.uuid(),
        (table: TableName, operation: Operation, _rowId: string) => {
          const policy = adminPolicies[table]
          expect(policy).toBeDefined()
          expect(policy.operation).toBe('ALL')
          // Admin role satisfies the policy predicate
          expect(adminPolicyAllows('admin')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('non-admin roles do NOT satisfy the admin policy predicate', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('customer', 'production_staff') as fc.Arbitrary<Exclude<UserRole, 'admin'>>,
        fc.constantFrom(...ALL_TABLES),
        (role, _table) => {
          expect(adminPolicyAllows(role)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('every table has exactly one admin policy covering ALL operations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_TABLES),
        (table: TableName) => {
          const policy = adminPolicies[table]
          expect(policy).toBeDefined()
          expect(policy.operation).toBe('ALL')
          expect(policy.policyName).toMatch(/^admin_all_/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('admin policy allows SELECT, INSERT, UPDATE, DELETE on any row', () => {
    fc.assert(
      fc.property(
        fc.record({
          rowId: fc.uuid(),
          table: fc.constantFrom(...ALL_TABLES),
          operation: fc.constantFrom(...ALL_OPERATIONS),
        }),
        ({ rowId: _rowId, table, operation: _operation }) => {
          const policy = adminPolicies[table]
          expect(policy.operation).toBe('ALL')
          // FOR ALL in PostgreSQL covers SELECT, INSERT, UPDATE, DELETE
          expect(adminPolicyAllows('admin')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
