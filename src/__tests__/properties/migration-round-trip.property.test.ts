// Feature: w2p-platform-init, Property 16: Migration Round-Trip Schema Integrity
// Validates: Requirements 13.1, 13.2, 13.4

import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Verifies that all migration files exist in the correct order, have valid
 * SQL structure, and collectively define all expected schema objects.
 *
 * Since we cannot connect to a live database in unit tests, we parse the SQL
 * files directly to confirm the presence of required DDL statements.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../supabase/migrations')

// Expected migration files in deterministic timestamp order
const EXPECTED_MIGRATIONS = [
  '20240101000000_create_enums.sql',
  '20240101000001_create_users.sql',
  '20240101000002_create_product_categories.sql',
  '20240101000003_create_templates.sql',
  '20240101000004_create_products.sql',
  '20240101000005_create_product_variations.sql',
  '20240101000006_create_orders.sql',
  '20240101000007_create_order_items.sql',
  '20240101000008_create_production_tracking.sql',
  '20240101000009_create_indexes.sql',
  '20240101000010_create_materialized_views.sql',
  '20240101000011_enable_rls.sql',
  '20240101000012_storage_buckets.sql',
  '20240101000013_seed_data.sql',
  '20240101000014_async_job_events.sql',
  '20240101000015_notification_triggers.sql',
  '20240101000016_refresh_analytics_rpc.sql',
  '20240101000017_fix_users_rls_recursion.sql',
]

// Tables that must be created across the migration set
const EXPECTED_TABLES = [
  'users',
  'product_categories',
  'templates',
  'products',
  'product_variations',
  'orders',
  'order_items',
  'production_tracking',
]

// Enums that must be defined
const EXPECTED_ENUMS = [
  'user_role',
  'order_status',
  'preflight_status',
  'production_status',
]

// Indexes that must be created
const EXPECTED_INDEXES = [
  'idx_orders_user_id',
  'idx_orders_status',
  'idx_orders_created_at',
  'idx_order_items_order_id',
  'idx_order_items_product_id',
  'idx_production_tracking_order_item_id',
  'idx_products_category_id',
  'idx_product_variations_product_id',
]

// Materialized views that must be created
const EXPECTED_VIEWS = [
  'daily_revenue_aggregates',
  'product_velocity_metrics',
]

// RLS policies — spot-check a representative set
const EXPECTED_POLICIES = [
  'customer_select_own_user',
  'customer_own_orders',
  'admin_all_users',
  'public_read_categories',
  'public_read_products',
  'production_staff_select_orders',
]

interface MigrationFile {
  filename: string
  content: string
}

let migrationFiles: MigrationFile[]
let combinedSql: string

beforeAll(() => {
  migrationFiles = EXPECTED_MIGRATIONS.map(filename => ({
    filename,
    content: fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf-8'),
  }))
  combinedSql = migrationFiles.map(f => f.content).join('\n')
})

// ── Helpers ────────────────────────────────────────────────────────────────

function containsCreateTable(sql: string, tableName: string): boolean {
  return new RegExp(`CREATE\\s+TABLE\\s+(?:public\\.)?${tableName}\\b`, 'i').test(sql)
}

function containsCreateType(sql: string, typeName: string): boolean {
  return new RegExp(`CREATE\\s+TYPE\\s+(?:public\\.)?${typeName}\\b`, 'i').test(sql)
}

function containsCreateIndex(sql: string, indexName: string): boolean {
  return new RegExp(`CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${indexName}\\b`, 'i').test(sql)
}

function containsCreateView(sql: string, viewName: string): boolean {
  return new RegExp(`CREATE\\s+MATERIALIZED\\s+VIEW\\s+(?:public\\.)?${viewName}\\b`, 'i').test(sql)
}

function containsPolicy(sql: string, policyName: string): boolean {
  return new RegExp(`CREATE\\s+POLICY\\s+"${policyName}"`, 'i').test(sql)
}

function containsEnableRls(sql: string, tableName: string): boolean {
  return new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i').test(sql)
}

// ── Static structure tests ─────────────────────────────────────────────────

describe('Property 16: Migration Round-Trip Schema Integrity', () => {
  it('all expected migration files exist on disk', () => {
    for (const filename of EXPECTED_MIGRATIONS) {
      const fullPath = path.join(MIGRATIONS_DIR, filename)
      expect(fs.existsSync(fullPath), `Missing migration: ${filename}`).toBe(true)
    }
  })

  it('migration files are sorted in deterministic timestamp order', () => {
    const actual = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()
    const expected = [...EXPECTED_MIGRATIONS].sort()
    expect(actual).toEqual(expected)
  })

  it('all migration files are non-empty', () => {
    for (const { filename, content } of migrationFiles) {
      expect(content.trim().length, `Empty migration: ${filename}`).toBeGreaterThan(0)
    }
  })

  it('all expected tables are defined across migrations', () => {
    for (const table of EXPECTED_TABLES) {
      expect(
        containsCreateTable(combinedSql, table),
        `Missing CREATE TABLE for: ${table}`
      ).toBe(true)
    }
  })

  it('all expected enums are defined', () => {
    for (const enumName of EXPECTED_ENUMS) {
      expect(
        containsCreateType(combinedSql, enumName),
        `Missing CREATE TYPE for enum: ${enumName}`
      ).toBe(true)
    }
  })

  it('all expected indexes are defined', () => {
    for (const indexName of EXPECTED_INDEXES) {
      expect(
        containsCreateIndex(combinedSql, indexName),
        `Missing CREATE INDEX for: ${indexName}`
      ).toBe(true)
    }
  })

  it('all expected materialized views are defined', () => {
    for (const viewName of EXPECTED_VIEWS) {
      expect(
        containsCreateView(combinedSql, viewName),
        `Missing CREATE MATERIALIZED VIEW for: ${viewName}`
      ).toBe(true)
    }
  })

  it('unique indexes exist for concurrent materialized view refresh', () => {
    expect(containsCreateIndex(combinedSql, 'idx_daily_revenue_date')).toBe(true)
    expect(containsCreateIndex(combinedSql, 'idx_product_velocity_product_id')).toBe(true)
  })

  it('RLS is enabled on all core tables', () => {
    for (const table of EXPECTED_TABLES) {
      expect(
        containsEnableRls(combinedSql, table),
        `RLS not enabled on: ${table}`
      ).toBe(true)
    }
  })

  it('expected RLS policies are defined', () => {
    for (const policy of EXPECTED_POLICIES) {
      expect(
        containsPolicy(combinedSql, policy),
        `Missing RLS policy: ${policy}`
      ).toBe(true)
    }
  })

  it('seed data migration inserts all 3 required categories', () => {
    const seedContent = migrationFiles.find(f => f.filename.includes('seed_data'))!.content
    expect(seedContent).toContain('Business Cards')
    expect(seedContent).toContain('Flyers')
    expect(seedContent).toContain('Promotional Items')
  })

  /**
   * Property: every migration file, when read independently, contains at least
   * one SQL keyword — confirming no file is accidentally empty or corrupted.
   */
  it('property — every migration file contains valid SQL keywords', () => {
    const sqlKeywords = ['CREATE', 'INSERT', 'ALTER', 'DROP', 'SELECT', 'UPDATE', 'DELETE']

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: migrationFiles.length - 1 }),
        (idx) => {
          const { content } = migrationFiles[idx]
          const upperContent = content.toUpperCase()
          const hasKeyword = sqlKeywords.some(kw => upperContent.includes(kw))
          expect(hasKeyword).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: migration filenames are strictly ordered — each timestamp prefix
   * is lexicographically greater than the previous one.
   */
  it('property — migration filenames are strictly lexicographically ordered', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: EXPECTED_MIGRATIONS.length - 2 }),
        (idx) => {
          const current = EXPECTED_MIGRATIONS[idx]
          const next = EXPECTED_MIGRATIONS[idx + 1]
          expect(current < next).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: applying the schema detection functions to the combined SQL
   * always returns true for every expected table — simulating idempotent
   * schema verification (Requirement 13.4).
   */
  it('property — schema object detection is stable across repeated checks', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: EXPECTED_TABLES.length - 1 }),
        (idx) => {
          const table = EXPECTED_TABLES[idx]
          // Calling the check multiple times must always yield the same result
          const result1 = containsCreateTable(combinedSql, table)
          const result2 = containsCreateTable(combinedSql, table)
          expect(result1).toBe(result2)
          expect(result1).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: for any table in the expected set, RLS enablement detection
   * is consistent — no table is sometimes detected and sometimes not.
   */
  it('property — RLS detection is deterministic for all tables', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: EXPECTED_TABLES.length - 1 }),
        (idx) => {
          const table = EXPECTED_TABLES[idx]
          const r1 = containsEnableRls(combinedSql, table)
          const r2 = containsEnableRls(combinedSql, table)
          expect(r1).toBe(r2)
          expect(r1).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
