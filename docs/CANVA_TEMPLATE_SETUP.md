# Canva Template Selection - Setup Guide

This guide will help you set up the Canva Template Selection feature for your K.T Digital House platform.

## Prerequisites

- Existing Canva integration working (OAuth flow functional)
- Supabase project configured
- Admin access to Supabase SQL Editor

## Setup Steps

### 1. Run Database Migrations

Execute the following SQL scripts in your Supabase SQL Editor in order:

#### a. Create Templates Table
```bash
# Run this file in Supabase SQL Editor
scripts/create_canva_templates_table.sql
```

This creates:
- `canva_templates` table
- Storage bucket `canva-template-thumbnails`
- Indexes for performance
- Row Level Security policies
- Auto-update trigger for `updated_at`

#### b. Extend OAuth States Table
```bash
# Run this file in Supabase SQL Editor
scripts/add_template_id_to_oauth_states.sql
```

This adds:
- `template_id` column to `canva_oauth_states`
- Foreign key reference to `canva_templates`
- Index for template lookup

### 2. Verify Environment Variables

Ensure these variables are set in your `.env` file:

```env
# Canva OAuth (should already exist)
CANVA_CLIENT_ID=your_client_id
CANVA_CLIENT_SECRET=your_client_secret
CANVA_REDIRECT_URI=http://localhost:3000/api/canva/oauth/callback
CANVA_TOKEN_ENCRYPTION_KEY=your_encryption_key

# Supabase (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install Dependencies

No new dependencies are required. The feature uses existing packages.

### 4. Build and Start the Application

```bash
npm run build
npm run dev
```

### 5. Verify Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Verify `canva-template-thumbnails` bucket exists
3. Verify bucket is set to **Public**
4. Check policies are applied (read: public, write: service_role)

If the bucket wasn't created automatically:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('canva-template-thumbnails', 'canva-template-thumbnails', true)
ON CONFLICT (id) DO NOTHING;
```

## Usage

### For Administrators

#### Adding Templates

1. Navigate to `/admin/canva-templates`
2. Click "Add New Template"
3. Fill in the form:
   - **Canva Template URL**: Paste the full Canva template URL
     - Example: `https://www.canva.com/templates/ABC123xyz/modern-business-card`
   - **Template Name**: Display name (e.g., "Modern Business Card")
   - **Description**: Optional description
   - **Product Category**: Select category (e.g., "Business Cards")
   - **Thumbnail**: Upload a preview image (max 500KB, JPEG/PNG/WebP)
4. Click "Create Template"

#### Editing Templates

1. Navigate to `/admin/canva-templates`
2. Click "Edit" on any template
3. Update fields as needed
4. Click "Update Template"

#### Deleting Templates

1. Navigate to `/admin/canva-templates`
2. Click "Delete" on any template
3. Confirm deletion
4. Template and thumbnail are removed

### For End Users

1. Navigate to a product page
2. Click "Edit in Canva" button
3. Template selection page appears
4. Choose a template or "Start with Blank Canvas"
5. OAuth flow starts
6. Canva editor opens with selected template (or blank canvas)
7. Edit and export as usual

## Testing

### Test Template Addition

1. Find a public Canva template:
   - Go to https://www.canva.com/templates/
   - Search for "business card"
   - Click on a template
   - Copy the URL from browser address bar

2. Add to admin interface:
   - Navigate to `/admin/canva-templates`
   - Paste the URL
   - Fill in name and category
   - Upload a screenshot as thumbnail
   - Save

3. Test selection:
   - Go to a product page
   - Click "Edit in Canva"
   - Verify template appears in selection page
   - Select the template
   - Verify it loads in Canva editor

### Test Blank Canvas

1. Navigate to template selection page
2. Click "Start with Blank Canvas"
3. Verify blank A4 design is created
4. Verify existing flow works as before

### Test Error Handling

1. **No templates for category:**
   - Select a category with no templates
   - Verify "Blank Canvas" option is available
   - Verify user can proceed

2. **Invalid template URL:**
   - Try adding template with invalid URL
   - Verify error message appears
   - Verify template is not created

3. **Large thumbnail:**
   - Try uploading file > 500KB
   - Verify error message appears
   - Verify upload is rejected

## Troubleshooting

### Templates Not Appearing

**Check database:**
```sql
SELECT * FROM canva_templates;
```

**Check API endpoint:**
```bash
curl http://localhost:3000/api/canva/templates?category=business_cards
```

### Thumbnails Not Loading

**Check storage bucket:**
1. Go to Supabase Dashboard → Storage
2. Open `canva-template-thumbnails` bucket
3. Verify files are present
4. Check bucket is public

**Check policies:**
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'canva-template-thumbnails';
```

### Template Creation Fails in Canva

**Check logs:**
- Look for errors in browser console
- Check server logs for Canva API errors

**Verify template ID:**
- Ensure template ID is correct
- Try creating blank design to verify OAuth works
- Check Canva API documentation for template format

### OAuth Flow Broken

**Verify state table:**
```sql
SELECT * FROM canva_oauth_states ORDER BY created_at DESC LIMIT 5;
```

**Check template_id column exists:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'canva_oauth_states' 
AND column_name = 'template_id';
```

## Product Categories

The following categories are available by default:

- `business_cards` - Business Cards
- `flyers` - Flyers
- `posters` - Posters
- `brochures` - Brochures
- `banners` - Banners
- `invitations` - Invitations
- `postcards` - Postcards
- `other` - Other

To add more categories, update the `PRODUCT_CATEGORIES` array in:
- `src/app/admin/canva-templates/page.tsx`

## Security Notes

### Admin Interface Protection

The admin interface (`/admin/canva-templates`) should be protected with authentication. Add middleware to verify admin role:

```typescript
// middleware.ts or in the page component
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: Request) {
  // Check if user is admin
  // Redirect if not authorized
}
```

### Template URL Validation

The system validates template URLs to ensure they:
- Are valid URLs
- Point to canva.com domain
- Match expected format
- Contain valid template ID

### Storage Security

- Thumbnails are public (read-only)
- Only service role can upload/delete
- File size limited to 500KB
- File types restricted to images

## Performance Optimization

### Database Indexes

Already created by migration:
- `product_category` - Fast category filtering
- `canva_template_id` - Fast template lookup

### Caching

Consider adding:
- CDN for thumbnail delivery
- API response caching
- Browser cache headers

### Image Optimization

Thumbnails should be:
- Optimized for web (compressed)
- Appropriate dimensions (e.g., 400x533 for 3:4 ratio)
- WebP format for best compression

## Next Steps

1. **Add Authentication** to admin interface
2. **Populate Templates** with your designs
3. **Test End-to-End** with real users
4. **Monitor Usage** and gather feedback
5. **Optimize Performance** based on metrics

## Support

For issues or questions:
- Check [Canva API Documentation](https://canva.dev/docs/connect/)
- Review [canva-template-selection.md](canva-template-selection.md)
- Check server logs for errors
- Verify database migrations completed successfully

## Rollback

If you need to rollback the feature:

```sql
-- Remove template_id column from oauth states
ALTER TABLE canva_oauth_states DROP COLUMN IF EXISTS template_id;

-- Drop templates table
DROP TABLE IF EXISTS canva_templates CASCADE;

-- Remove storage bucket
DELETE FROM storage.buckets WHERE id = 'canva-template-thumbnails';
```

Then remove the new files and revert code changes.
