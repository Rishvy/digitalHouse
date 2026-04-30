# Canva Template Selection - Quick Reference

## 🚀 Quick Start

### For Developers

```bash
# 1. Run database migrations
# Execute in Supabase SQL Editor:
scripts/create_canva_templates_table.sql
scripts/add_template_id_to_oauth_states.sql

# 2. Start development server
npm run dev

# 3. Navigate to admin interface
open http://localhost:3000/admin/canva-templates

# 4. Add a template and test
```

### For Admins

```
1. Go to /admin/canva-templates
2. Click "Add New Template"
3. Paste Canva template URL
4. Fill in name and category
5. Upload thumbnail
6. Click "Create Template"
```

## 📁 Key Files

### Database
- `scripts/create_canva_templates_table.sql` - Main table
- `scripts/add_template_id_to_oauth_states.sql` - OAuth extension

### Backend APIs
- `src/app/api/canva/templates/route.ts` - Get templates
- `src/app/api/admin/canva-templates/route.ts` - Admin CRUD
- `src/app/api/admin/canva-templates/[id]/route.ts` - Single template
- `src/app/api/admin/canva-templates/upload-thumbnail/route.ts` - Upload

### Frontend
- `src/app/canva/select-template/page.tsx` - Selection page
- `src/components/canva/TemplateSelector.tsx` - Selector component
- `src/app/admin/canva-templates/page.tsx` - Admin interface

### Utilities
- `src/lib/canva/templates.ts` - Template utilities

### Modified Files
- `src/app/api/canva/auth/route.ts` - OAuth with template
- `src/app/api/canva/oauth/callback/route.ts` - Create from template

## 🔗 URLs

### User-Facing
```
/canva/select-template?category={category}&productId={id}&userId={id}
```

### Admin
```
/admin/canva-templates
```

### API Endpoints
```
GET  /api/canva/templates?category={category}
GET  /api/admin/canva-templates
POST /api/admin/canva-templates
GET  /api/admin/canva-templates/{id}
PATCH /api/admin/canva-templates/{id}
DELETE /api/admin/canva-templates/{id}
POST /api/admin/canva-templates/upload-thumbnail
```

## 🗄️ Database Tables

### canva_templates
```sql
id                  UUID PRIMARY KEY
canva_template_id   TEXT UNIQUE
canva_template_url  TEXT
name                TEXT
description         TEXT
thumbnail_url       TEXT
product_category    TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### canva_oauth_states (extended)
```sql
-- Added column:
template_id         UUID REFERENCES canva_templates(id)
```

## 📦 Storage

### Bucket
```
canva-template-thumbnails (public)
```

### File Format
```
{template_uuid}.{jpg|png|webp}
Max size: 500KB
```

## 🎨 Product Categories

```typescript
const categories = [
  'business_cards',
  'flyers',
  'posters',
  'brochures',
  'banners',
  'invitations',
  'postcards',
  'other'
];
```

## 🔧 Common Tasks

### Add a Template (Admin)
```typescript
POST /api/admin/canva-templates
{
  "canva_template_url": "https://www.canva.com/templates/ABC123/",
  "name": "Modern Business Card",
  "description": "Professional design",
  "product_category": "business_cards"
}
```

### Upload Thumbnail
```typescript
POST /api/admin/canva-templates/upload-thumbnail
FormData {
  file: File,
  templateId: "uuid"
}
```

### Get Templates by Category
```typescript
GET /api/canva/templates?category=business_cards
```

### Link to Template Selection
```typescript
const url = `/canva/select-template?` +
  `category=${category}&` +
  `productId=${productId}&` +
  `userId=${userId}`;
```

## 🔍 Debugging

### Check Templates Exist
```sql
SELECT * FROM canva_templates;
```

### Check OAuth State
```sql
SELECT * FROM canva_oauth_states 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Storage Bucket
```sql
SELECT * FROM storage.buckets 
WHERE id = 'canva-template-thumbnails';
```

### Check RLS Policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'canva_templates';
```

### Test API Endpoint
```bash
curl http://localhost:3000/api/canva/templates?category=business_cards
```

## ⚠️ Common Issues

### Templates Not Showing
```
1. Check database: SELECT * FROM canva_templates;
2. Check API: curl /api/canva/templates?category=...
3. Check browser console for errors
4. Verify RLS policies are active
```

### Thumbnails Not Loading
```
1. Check storage bucket exists
2. Verify bucket is public
3. Check file was uploaded
4. Verify thumbnail_url in database
```

### Template Creation Fails
```
1. Check Canva API logs
2. Verify template ID is correct
3. Check access token is valid
4. System falls back to blank design automatically
```

### OAuth Flow Broken
```
1. Check template_id column exists
2. Verify state is stored correctly
3. Check environment variables
4. Review callback logs
```

## 🧪 Testing

### Manual Test Flow
```
1. Navigate to product page
2. Click "Edit in Canva"
3. Select a template
4. Verify OAuth starts
5. Authorize on Canva
6. Verify template loads in editor
7. Complete design
8. Verify export works
```

### Test Blank Canvas
```
1. Go to template selection
2. Click "Start with Blank Canvas"
3. Verify blank design created
4. Complete flow normally
```

## 📊 Monitoring

### Key Metrics
```
- Template selection rate vs blank canvas
- Template creation success rate
- API response times
- Error rates
- Storage usage
```

### Log Locations
```
- Browser console: Client-side errors
- Server logs: API errors
- Supabase logs: Database errors
- Canva API logs: Integration errors
```

## 🔐 Security Checklist

```
✓ RLS enabled on canva_templates
✓ Storage bucket policies configured
✓ Input validation on all endpoints
✓ File upload restrictions (type, size)
✓ OAuth CSRF protection (state)
✓ Token encryption
☐ Admin authentication (TODO)
☐ Rate limiting (TODO)
```

## 📚 Documentation

### Full Documentation
- `CANVA_TEMPLATE_SETUP.md` - Setup guide
- `docs/canva-template-selection.md` - Technical docs
- `docs/template-selection-integration-example.md` - Integration
- `docs/template-selection-flow-diagram.md` - Visual diagrams
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide

### Implementation
- `.kiro/specs/canva-template-selection/requirements.md` - Requirements
- `.kiro/specs/canva-template-selection/implementation-summary.md` - Summary

## 🎯 Quick Commands

### Development
```bash
npm run dev                    # Start dev server
npm run build                  # Build for production
npm test                       # Run tests
```

### Database
```bash
# Generate types
npm run db:types

# Seed demo data
npm run db:seed
```

## 💡 Tips

### Optimize Thumbnails
```bash
# Resize and compress
convert input.jpg -resize 400x533 -quality 85 output.jpg

# Convert to WebP
cwebp -q 85 input.jpg -o output.webp
```

### Extract Template ID
```typescript
import { extractCanvaTemplateId } from '@/lib/canva/templates';

const url = "https://www.canva.com/templates/ABC123/modern-card";
const id = extractCanvaTemplateId(url); // "ABC123"
```

### Validate Template ID
```typescript
import { isValidCanvaTemplateId } from '@/lib/canva/templates';

const valid = isValidCanvaTemplateId("ABC123"); // true
const invalid = isValidCanvaTemplateId("ABC 123"); // false
```

## 🆘 Support

### Getting Help
1. Check documentation in `docs/`
2. Review implementation summary
3. Check troubleshooting section
4. Review Canva API docs: https://canva.dev/docs/connect/

### Reporting Issues
Include:
- Error message
- Steps to reproduce
- Browser/environment
- Relevant logs
- Database state (if applicable)

## 🔄 Rollback

### Quick Rollback
```sql
-- Remove template_id column
ALTER TABLE canva_oauth_states DROP COLUMN template_id;

-- Drop templates table
DROP TABLE canva_templates CASCADE;

-- Remove storage bucket
DELETE FROM storage.buckets 
WHERE id = 'canva-template-thumbnails';
```

Then revert code changes and redeploy.

## ✅ Pre-Deployment Checklist

```
☐ Database migrations run
☐ Storage bucket created
☐ RLS policies active
☐ Environment variables set
☐ Admin auth implemented
☐ Templates populated
☐ End-to-end tested
☐ Documentation updated
☐ Team trained
☐ Monitoring configured
```

## 📞 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  CANVA TEMPLATE SELECTION - QUICK REFERENCE             │
├─────────────────────────────────────────────────────────┤
│  User Flow:                                             │
│    Product → Template Selection → OAuth → Canva        │
│                                                          │
│  Admin Flow:                                            │
│    /admin/canva-templates → Add/Edit/Delete            │
│                                                          │
│  Key Tables:                                            │
│    • canva_templates                                    │
│    • canva_oauth_states (+ template_id)                │
│                                                          │
│  Key APIs:                                              │
│    • GET /api/canva/templates?category=...             │
│    • POST /api/admin/canva-templates                   │
│                                                          │
│  Storage:                                               │
│    • canva-template-thumbnails (public)                │
│                                                          │
│  Categories:                                            │
│    business_cards, flyers, posters, brochures,         │
│    banners, invitations, postcards, other              │
└─────────────────────────────────────────────────────────┘
```

---

**Last Updated:** April 30, 2026  
**Version:** 1.0.0  
**Status:** ✅ Implementation Complete
