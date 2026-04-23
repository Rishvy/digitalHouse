// Feature: w2p-platform-init, Property 1: Customer RLS Isolation
// Validates: Requirements 5.1, 5.2, 5.3

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Simulates the RLS policy evaluation logic for customer isolation.
 * In production, these policies run in PostgreSQL. Here we model the
 * policy predicates as pure functions to verify their logical correctness.
 */

// Policy: customer_select_own_user — id = auth.uid()
function customerCanSelectUser(rowId: string, authUid: string): boolean {
  return rowId === authUid
}

// Policy: customer_update_own_user — id = auth.uid()
function customerCanUpdateUser(rowId: string, authUid: string): boolean {
  return rowId === authUid
}

// Policy: customer_own_orders (SELECT) — user_id = auth.uid()
function customerCanSelectOrder(orderUserId: string, authUid: string): boolean {
  return orderUserId === authUid
}

// Policy: customer_insert_orders (INSERT) — user_id = auth.uid()
function customerCanInsertOrder(orderUserId: string, authUid: string): boolean {
  return orderUserId === authUid
}

// Policy: customer_update_own_orders (UPDATE) — user_id = auth.uid()
function customerCanUpdateOrder(orderUserId: string, authUid: string): boolean {
  return orderUserId === authUid
}

// Policy: customer_own_order_items_select — EXISTS (orders where id = order_items.order_id AND user_id = auth.uid())
function customerCanSelectOrderItem(
  orderItemOrderId: string,
  parentOrderId: string,
  parentOrderUserId: string,
  authUid: string
): boolean {
  return orderItemOrderId === parentOrderId && parentOrderUserId === authUid
}

// Policy: customer_own_order_items_insert — same EXISTS check
function customerCanInsertOrderItem(
  orderItemOrderId: string,
  parentOrderId: string,
  parentOrderUserId: string,
  authUid: string
): boolean {
  return orderItemOrderId === parentOrderId && parentOrderUserId === authUid
}

describe('Property 1: Customer RLS Isolation', () => {
  it('customer A cannot SELECT user row belonging to customer B', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (idA, idB) => {
          fc.pre(idA !== idB)
          // A can only see their own row
          expect(customerCanSelectUser(idA, idA)).toBe(true)
          expect(customerCanSelectUser(idB, idA)).toBe(false)
          expect(customerCanSelectUser(idA, idB)).toBe(false)
          expect(customerCanSelectUser(idB, idB)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('customer A cannot UPDATE user row belonging to customer B', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (idA, idB) => {
          fc.pre(idA !== idB)
          expect(customerCanUpdateUser(idA, idA)).toBe(true)
          expect(customerCanUpdateUser(idB, idA)).toBe(false)
          expect(customerCanUpdateUser(idA, idB)).toBe(false)
          expect(customerCanUpdateUser(idB, idB)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('customer A cannot SELECT orders belonging to customer B', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (idA, idB) => {
          fc.pre(idA !== idB)
          // Order owned by A
          expect(customerCanSelectOrder(idA, idA)).toBe(true)
          expect(customerCanSelectOrder(idA, idB)).toBe(false)
          // Order owned by B
          expect(customerCanSelectOrder(idB, idB)).toBe(true)
          expect(customerCanSelectOrder(idB, idA)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('customer A cannot INSERT orders with user_id of customer B', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (idA, idB) => {
          fc.pre(idA !== idB)
          expect(customerCanInsertOrder(idA, idA)).toBe(true)
          expect(customerCanInsertOrder(idB, idA)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('customer A cannot UPDATE orders belonging to customer B', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (idA, idB) => {
          fc.pre(idA !== idB)
          expect(customerCanUpdateOrder(idA, idA)).toBe(true)
          expect(customerCanUpdateOrder(idB, idA)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('customer A cannot SELECT order_items belonging to customer B via parent order', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        (idA, idB, orderId) => {
          fc.pre(idA !== idB)
          // Item in an order owned by A — A can see it, B cannot
          expect(customerCanSelectOrderItem(orderId, orderId, idA, idA)).toBe(true)
          expect(customerCanSelectOrderItem(orderId, orderId, idA, idB)).toBe(false)
          // Item in an order owned by B — B can see it, A cannot
          expect(customerCanSelectOrderItem(orderId, orderId, idB, idB)).toBe(true)
          expect(customerCanSelectOrderItem(orderId, orderId, idB, idA)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('customer A cannot INSERT order_items into orders belonging to customer B', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        (idA, idB, orderId) => {
          fc.pre(idA !== idB)
          expect(customerCanInsertOrderItem(orderId, orderId, idA, idA)).toBe(true)
          expect(customerCanInsertOrderItem(orderId, orderId, idA, idB)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})
