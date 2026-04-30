# Canva Template Selection Feature

This document explains how the Canva template selection feature works in the K.T Digital House application.

## Overview

The template selection feature allows users to choose from pre-configured Canva templates before entering the Canva editor, or start with a blank canvas. This provides a better user experience by offering starting points that match their design needs.

## Architecture

```
User → Template Selection Page → OAuth Flow (with template_id) → Canva Editor (with template pre-loaded)
```

## Flow Diagram

```
1. User clicks "Edit in Canva" button on product page
   ↓
2. Redirects to Template Selection Page (/canva/select-template)
   - Displays templates filtered by product category
   - Shows "Blank Canvas" option
   ↓
3. User selects a template or blank canvas
   ↓
4. OAuth authorization starts (/api/canva/auth)
   - Stores template_id in canva_oauth_states table
   - Generates PKCE code verifier & challenge
   - Redirects to Canva authorization page
   ↓
5. User authorizes the app on Canva
   ↓
6. Canva redirects back to callback (/api/canva/oauth/callback)
   - Validates state (CSRF protection)
   - Exchanges authorization code for access token
   - Retrieves template_id from state
   - Creates design from template (or blank if no template)
   - Redirects user to Canva editor
   ↓
7. User edits design in Canva
   ↓
8. [Rest of flow continues as before - see canva-integration.md]
```

## Database Schema

### `canva_templates` Table

Stores template metadata for the template catalog.

```sql
CREATE TABLE canva_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canva_template_id TEXT NOT NULL UNIQUE,
  canva_template_url TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  product_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier (UUID)
- `canva_template_id`: Extracted template ID from Canva URL (e.g., "ABC123xyz")
- `canva_template_url`: Original Canva template URL
- `name`: Display name for the template
- `description`: Optional description
- `thumbnail_url`: URL to thumbnail image in Supabase Storage
- `product_category`: Category filter (e.g., "business_cards", "flyers")
- `created_at`, `updated_at`: Timestamps

### `canva_oauth_states` Table Extension

Extended to include template selection.

```sql
ALTER TABLE canva_oauth_states 
ADD COLUMN template_id UUID REFERENCES canva_templates(id);
```

## API Endpoints

### Template Retrieval

#### `GET /api/canva/templates?category={category}`

Retrieves templates filtered by product category.

**Query Parameters:**
- `category` (required): Product category to filter by

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "canva_template_id": "ABC123xyz",
      "name": "Modern Business Card",
      "description": "A professional business card template",
      "thumbnail_url": "https://...",
      "product_category": "business_cards"
    }
  ]
}
```

### Admin Template Management

#### `GET /api/admin/canva-templates`

Retrieves all templates for admin management.

**Response:**
```json
{
  "templates": [...]
}
```

#### `POST /api/admin/canva-templates`

Creates a new template.

**Request Body:**
```json
{
  "canva_template_url": "https://www.canva.com/templates/ABC123xyz/",
  "name": "Modern Business Card",
  "description": "A professional template",
  "product_category": "business_cards",
  "thumbnail_url": "https://..." // optional
}
```

**Response:**
```json
{
  "template": { ... }
}
```

#### `PATCH /api/admin/canva-templates/{id}`

Updates an existing template.

**Request Body:** Same as POST (all fields optional)

#### `DELETE /api/admin/canva-templates/{id}`

Deletes a template and its thumbnail.

#### `POST /api/admin/canva-templates/upload-thumbnail`

Uploads a thumbnail image for a template.

**Request:** multipart/form-data
- `file`: Image file (JPEG, PNG, or WebP, max 500KB)
- `templateId`: UUID of the template

**Response:**
```json
{
  "thumbnailUrl": "https://...",
  "message": "Thumbnail uploaded successfully"
}
```

## Frontend Components

### `/canva/select-template` Page

The template selection page that displays available templates.

**Query Parameters:**
- `category`: Product category (default: "business_cards")
- `productId`: Optional product ID
- `variationId`: Optional variation ID

**Features:**
- Responsive grid layout (1/2/3 columns based on screen size)
- "Blank Canvas" option always available
- Template thumbnails with name and description
- Visual selection indicator
- Loading and error states
- Fallback to blank canvas on error

### `TemplateSelector` Component

Reusable component for displaying and selecting templates.

**Props:**
```typescript
interface TemplateSelectorProps {
  category: string;
  productId?: string;
  variationId?: string;
  onSelect: (templateId: string | null) => void;
}
```

## Admin Interface

### `/admin/canva-templates` Page

Admin interface for managing templates.

**Features:**
- List all templates with thumbnails
- Add new templates by pasting Canva URL
- Edit template metadata
- Upload thumbnail images
- Delete templates
- Automatic template ID extraction from URLs
- Form validation
- Preview thumbnails before saving

**Product Categories:**
- Business Cards
- Flyers
- Posters
- Brochures
- Banners
- Invitations
- Postcards
- Other

## Template URL Format

Canva template URLs follow this format:
```
https://www.canva.com/templates/{templateId}/
```

The system automatically extracts the `templateId` portion when admins paste the full URL.

**Example:**
- Input: `https://www.canva.com/templates/ABC123xyz/modern-business-card`
- Extracted ID: `ABC123xyz`

## Storage

### Supabase Storage Bucket

Template thumbnails are stored in the `canva-template-thumbnails` bucket.

**Configuration:**
- Public access enabled
- Max file size: 500KB
- Allowed formats: JPEG, PNG, WebP
- Filename format: `{template_uuid}.{ext}`

**Policies:**
- Anyone can read (public catalog)
- Service role can upload/delete

## Canva API Integration

### Creating Design from Template

When a template is selected, the callback creates a design using:

```javascript
{
  "title": "Custom Design from Template",
  "design_type": {
    "type": "from_template",
    "template_id": "ABC123xyz"
  }
}
```

### Fallback Behavior

If template creation fails:
1. Log the error
2. Attempt to create a blank A4 design
3. Continue the flow with blank design
4. User can still edit and export

This ensures the user experience is never blocked by template issues.

## Error Handling

### Template Loading Errors

If templates fail to load on the selection page:
- Display error message
- Offer "Start with Blank Canvas" button
- User can proceed without templates

### Template Creation Errors

If Canva API fails to create design from template:
- Automatically fall back to blank design
- Log error for admin review
- User continues editing without interruption

### Thumbnail Upload Errors

If thumbnail upload fails:
- Display specific error message
- Template is still created/updated
- Admin can retry upload later

## Security

### Row Level Security (RLS)

**Templates Table:**
- Public read access (anyone can view templates)
- Service role only for write operations

**Storage Bucket:**
- Public read access for thumbnails
- Service role only for upload/delete

### Admin Access

The admin interface should be protected by authentication middleware (to be implemented based on your auth system).

## Performance Considerations

### Database Indexes

- `product_category`: Fast filtering by category
- `canva_template_id`: Fast lookup by template ID

### Caching

- Template thumbnails are cached by browser
- Consider adding CDN for thumbnail delivery

### API Response Times

- Template retrieval: < 500ms
- Template creation: < 2s (depends on Canva API)

## Testing

### Manual Testing Steps

1. **Admin Flow:**
   - Navigate to `/admin/canva-templates`
   - Add a new template with Canva URL
   - Upload a thumbnail
   - Verify template appears in list
   - Edit template metadata
   - Delete template

2. **User Flow:**
   - Navigate to product page
   - Click "Edit in Canva"
   - Verify template selection page loads
   - Select a template
   - Verify OAuth flow starts
   - Verify Canva editor opens with template
   - Complete design and export

3. **Blank Canvas Flow:**
   - Navigate to template selection
   - Click "Start with Blank Canvas"
   - Verify blank design is created
   - Verify existing flow continues

### Edge Cases

- No templates for category → Shows blank canvas option
- Template creation fails → Falls back to blank design
- Thumbnail missing → Shows placeholder icon
- Invalid template URL → Shows validation error

## Future Enhancements

1. **Template Preview**
   - Show larger preview on hover
   - Preview modal with more details

2. **Template Search**
   - Search templates by name
   - Filter by multiple categories

3. **Template Analytics**
   - Track template usage
   - Popular templates dashboard

4. **Bulk Template Import**
   - Import multiple templates at once
   - CSV/JSON import format

5. **Template Versioning**
   - Track template updates
   - Version history

6. **User Favorites**
   - Allow users to favorite templates
   - Show recently used templates

## Troubleshooting

### Issue: "Invalid Canva template URL"
- Ensure URL format is correct: `https://www.canva.com/templates/{id}/`
- Template ID must be alphanumeric with hyphens/underscores

### Issue: Template not loading in Canva
- Verify template ID is correct
- Check Canva API logs for errors
- Ensure template is publicly accessible
- Falls back to blank design automatically

### Issue: Thumbnail not displaying
- Check file was uploaded successfully
- Verify storage bucket permissions
- Check file size (max 500KB)
- Verify file format (JPEG, PNG, WebP)

### Issue: Templates not filtered correctly
- Verify product_category matches exactly
- Check database indexes are created
- Verify API endpoint receives correct category parameter

## References

- [Canva Connect API Documentation](https://canva.dev/docs/connect/)
- [Canva Design API](https://canva.dev/docs/connect/api-reference/designs/)
- [Main Canva Integration Docs](./canva-integration.md)
