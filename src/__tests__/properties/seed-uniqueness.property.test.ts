// Feature: w2p-platform-init, Property 15: Seed Data Uniqueness
// Validates: Requirements 12.5

import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Parses INSERT statements from the seed SQL file and extracts values
 * for a given column by position within the VALUES tuples.
 *
 * This test verifies that the seed migration contains no duplicate slug
 * or sku values, satisfying Requirement 12.5.
 */

const SEED_FILE = path.resolve(__dirname, '../../../supabase/migrations/20240101000013_seed_data.sql')

/** Extract all single-quoted string literals from a VALUES block */
function extractInsertValues(sql: string, tableName: string): string[][] {
  const rows: string[][] = []
  // Match INSERT INTO <table> ... VALUES (...) blocks
  const insertRegex = new RegExp(
    `INSERT\\s+INTO\\s+(?:public\\.)?${tableName}\\s*\\([^)]+\\)\\s*VALUES([\\s\\S]*?)ON\\s+CONFLICT`,
    'gi'
  )
  const match = insertRegex.exec(sql)
  if (!match) return rows

  const valuesBlock = match[1]
  // Match each tuple: ( ... )
  const tupleRegex = /\(([^()]+)\)/g
  let tupleMatch: RegExpExecArray | null
  while ((tupleMatch = tupleRegex.exec(valuesBlock)) !== null) {
    const fields = tupleMatch[1].split(',').map(f => f.trim().replace(/^'|'$/g, ''))
    rows.push(fields)
  }
  return rows
}

/** Extract column index from INSERT column list */
function getColumnIndex(sql: string, tableName: string, columnName: string): number {
  const colListRegex = new RegExp(
    `INSERT\\s+INTO\\s+(?:public\\.)?${tableName}\\s*\\(([^)]+)\\)`,
    'i'
  )
  const match = colListRegex.exec(sql)
  if (!match) return -1
  const cols = match[1].split(',').map(c => c.trim())
  return cols.indexOf(columnName)
}

/** Extract all values for a specific column from an INSERT block */
function extractColumnValues(sql: string, tableName: string, columnName: string): string[] {
  const colIdx = getColumnIndex(sql, tableName, columnName)
  if (colIdx === -1) return []
  const rows = extractInsertValues(sql, tableName)
  return rows.map(row => row[colIdx]).filter(Boolean)
}

let seedSql: string

beforeAll(() => {
  seedSql = fs.readFileSync(SEED_FILE, 'utf-8')
})

describe('Property 15: Seed Data Uniqueness', () => {
  it('seed SQL file exists and is non-empty', () => {
    expect(seedSql.length).toBeGreaterThan(0)
  })

  it('product_categories slugs are unique in seed data', () => {
    const slugs = extractColumnValues(seedSql, 'product_categories', 'slug')
    expect(slugs.length).toBeGreaterThanOrEqual(3)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('products slugs are unique in seed data', () => {
    const slugs = extractColumnValues(seedSql, 'products', 'slug')
    expect(slugs.length).toBeGreaterThanOrEqual(1)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('product_variations skus are unique in seed data', () => {
    const skus = extractColumnValues(seedSql, 'product_variations', 'sku')
    expect(skus.length).toBeGreaterThanOrEqual(2)
    const unique = new Set(skus)
    expect(unique.size).toBe(skus.length)
  })

  it('no slug appears in both product_categories and products', () => {
    const categorySlugs = new Set(extractColumnValues(seedSql, 'product_categories', 'slug'))
    const productSlugs = extractColumnValues(seedSql, 'products', 'slug')
    for (const slug of productSlugs) {
      expect(categorySlugs.has(slug)).toBe(false)
    }
  })

  /**
   * Property: for any subset of the seeded slugs, no two elements are equal.
   * We model this by verifying the full set has no duplicates, then use
   * fast-check to confirm that random pairs drawn from the slug list are
   * always distinct (i.e., the list behaves like a set).
   */
  it('property — any two distinct positions in slug list hold different values', () => {
    const categorySlugs = extractColumnValues(seedSql, 'product_categories', 'slug')
    const productSlugs = extractColumnValues(seedSql, 'products', 'slug')
    const allSlugs = [...categorySlugs, ...productSlugs]

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: allSlugs.length - 1 }),
        fc.integer({ min: 0, max: allSlugs.length - 1 }),
        (i, j) => {
          fc.pre(i !== j)
          expect(allSlugs[i]).not.toBe(allSlugs[j])
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: for any two distinct positions in the SKU list, values differ.
   */
  it('property — any two distinct positions in sku list hold different values', () => {
    const skus = extractColumnValues(seedSql, 'product_variations', 'sku')

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: skus.length - 1 }),
        fc.integer({ min: 0, max: skus.length - 1 }),
        (i, j) => {
          fc.pre(i !== j)
          expect(skus[i]).not.toBe(skus[j])
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: a set constructed from the slug/sku arrays always has the same
   * cardinality as the original array — no matter how many times we rebuild it.
   */
  it('property — Set cardinality equals array length for slugs (no duplicates)', () => {
    const allSlugs = [
      ...extractColumnValues(seedSql, 'product_categories', 'slug'),
      ...extractColumnValues(seedSql, 'products', 'slug'),
    ]
    const skus = extractColumnValues(seedSql, 'product_variations', 'sku')

    fc.assert(
      fc.property(
        fc.constant(allSlugs),
        fc.constant(skus),
        (slugArr, skuArr) => {
          expect(new Set(slugArr).size).toBe(slugArr.length)
          expect(new Set(skuArr).size).toBe(skuArr.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})
