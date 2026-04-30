# Canva Template Selection - Flow Diagram

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY                                    │
└─────────────────────────────────────────────────────────────────────────┘

1. PRODUCT PAGE
   │
   │  User clicks "Edit in Canva"
   │
   ▼
   
2. TEMPLATE SELECTION PAGE (/canva/select-template)
   │
   │  Query params: ?category=business_cards&productId=123&userId=456
   │
   ├─► Fetch templates: GET /api/canva/templates?category=business_cards
   │   │
   │   └─► Returns: [{ id, name, thumbnail_url, ... }]
   │
   │  Display:
   │  ┌──────────────┬──────────────┬──────────────┐
   │  │ Blank Canvas │  Template 1  │  Template 2  │
   │  └──────────────┴──────────────┴──────────────┘
   │
   │  User selects template or blank canvas
   │
   ▼

3. OAUTH AUTHORIZATION (/api/canva/auth)
   │
   │  Query params: ?userId=456&productId=123&templateId=789
   │
   ├─► Generate PKCE code_verifier and code_challenge
   ├─► Generate state token
   ├─► Store in database:
   │   INSERT INTO canva_oauth_states (
   │     state, code_verifier, user_id, 
   │     product_id, template_id
   │   )
   │
   └─► Redirect to Canva:
       https://www.canva.com/api/oauth/authorize?
         client_id=...&
         redirect_uri=...&
         state=...&
         code_challenge=...
   │
   ▼

4. CANVA AUTHORIZATION PAGE
   │
   │  User authorizes the app
   │
   └─► Canva redirects back with code and state
   │
   ▼

5. OAUTH CALLBACK (/api/canva/oauth/callback)
   │
   │  Query params: ?code=ABC&state=XYZ
   │
   ├─► Validate state token
   ├─► Retrieve from database:
   │   SELECT * FROM canva_oauth_states WHERE state = 'XYZ'
   │   Returns: { user_id, product_id, template_id, code_verifier }
   │
   ├─► Exchange code for tokens:
   │   POST https://api.canva.com/rest/v1/oauth/token
   │   Body: { code, code_verifier, ... }
   │   Returns: { access_token, refresh_token }
   │
   ├─► Store encrypted tokens:
   │   INSERT INTO canva_user_tokens (
   │     user_id, encrypted_access_token, ...
   │   )
   │
   ├─► IF template_id exists:
   │   │
   │   ├─► Fetch template details:
   │   │   SELECT canva_template_id FROM canva_templates 
   │   │   WHERE id = template_id
   │   │
   │   └─► Create design from template:
   │       POST https://api.canva.com/rest/v1/designs
   │       Body: {
   │         design_type: {
   │           type: "from_template",
   │           template_id: "ABC123"
   │         }
   │       }
   │       │
   │       └─► IF FAILS: Fallback to blank design
   │
   └─► ELSE (no template):
       │
       └─► Create blank design:
           POST https://api.canva.com/rest/v1/designs
           Body: {
             design_type: {
               type: "custom",
               width: 2480,
               height: 3508
             }
           }
   │
   ├─► Get design edit URL:
   │   GET https://api.canva.com/rest/v1/designs/{designId}
   │   Returns: { urls: { edit_url } }
   │
   └─► Redirect to Canva editor:
       {edit_url}?correlation_state={state}
   │
   ▼

6. CANVA EDITOR
   │
   │  User edits design
   │  (Template is pre-loaded if selected)
   │
   │  User clicks "Publish" or "Done"
   │
   └─► Canva redirects to return URL
   │
   ▼

7. RETURN NAVIGATION (/canva/finish)
   │
   │  [Existing flow continues...]
   │  - Extract design ID
   │  - Create export job
   │  - Poll for completion
   │  - Download and store design
   │  - Redirect to product page
   │
   └─► COMPLETE
```

## Admin Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ADMIN JOURNEY                                   │
└─────────────────────────────────────────────────────────────────────────┘

1. ADMIN DASHBOARD
   │
   │  Navigate to /admin/canva-templates
   │
   ▼

2. TEMPLATE MANAGEMENT PAGE
   │
   ├─► Fetch templates: GET /api/admin/canva-templates
   │   Returns: [{ id, name, thumbnail_url, category, ... }]
   │
   │  Display template grid
   │
   ├─► ADD NEW TEMPLATE
   │   │
   │   ├─► Admin fills form:
   │   │   - Canva template URL
   │   │   - Name
   │   │   - Description
   │   │   - Category
   │   │   - Thumbnail file
   │   │
   │   ├─► Submit: POST /api/admin/canva-templates
   │   │   Body: { canva_template_url, name, ... }
   │   │   │
   │   │   ├─► Extract template ID from URL
   │   │   ├─► Validate format
   │   │   └─► INSERT INTO canva_templates
   │   │
   │   └─► Upload thumbnail: POST /api/admin/canva-templates/upload-thumbnail
   │       FormData: { file, templateId }
   │       │
   │       ├─► Validate file (type, size)
   │       ├─► Upload to Supabase Storage
   │       └─► UPDATE canva_templates SET thumbnail_url
   │
   ├─► EDIT TEMPLATE
   │   │
   │   ├─► Fetch: GET /api/admin/canva-templates/{id}
   │   ├─► Admin updates form
   │   └─► Submit: PATCH /api/admin/canva-templates/{id}
   │       Body: { name, description, ... }
   │
   └─► DELETE TEMPLATE
       │
       └─► Confirm: DELETE /api/admin/canva-templates/{id}
           │
           ├─► DELETE FROM canva_templates WHERE id = ...
           └─► Delete thumbnail from storage
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────┘

canva_templates
├─ id (UUID, PK)
├─ canva_template_id (TEXT, UNIQUE)
├─ canva_template_url (TEXT)
├─ name (TEXT)
├─ description (TEXT)
├─ thumbnail_url (TEXT) ──────┐
├─ product_category (TEXT)    │
├─ created_at (TIMESTAMPTZ)   │
└─ updated_at (TIMESTAMPTZ)   │
                               │
                               │  References
                               │
canva_oauth_states             │
├─ id (UUID, PK)               │
├─ state (TEXT, UNIQUE)        │
├─ code_verifier (TEXT)        │
├─ user_id (UUID)              │
├─ product_id (TEXT)           │
├─ variation_id (TEXT)         │
├─ template_id (UUID, FK) ─────┘  Foreign Key to canva_templates.id
├─ expires_at (TIMESTAMPTZ)
└─ created_at (TIMESTAMPTZ)

storage.buckets
└─ canva-template-thumbnails
   ├─ {template_id}.jpg
   ├─ {template_id}.png
   └─ {template_id}.webp
```

## API Endpoint Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          API ENDPOINTS                                   │
└─────────────────────────────────────────────────────────────────────────┘

PUBLIC ENDPOINTS
│
├─ GET /api/canva/templates
│  │  Query: ?category=business_cards
│  │  Returns: { templates: [...] }
│  └─ Used by: Template selection page
│
└─ GET /api/canva/auth
   │  Query: ?userId=...&productId=...&templateId=...
   │  Returns: Redirect to Canva OAuth
   └─ Used by: Template selection page

ADMIN ENDPOINTS (Protected)
│
├─ GET /api/admin/canva-templates
│  │  Returns: { templates: [...] }
│  └─ Used by: Admin management page
│
├─ POST /api/admin/canva-templates
│  │  Body: { canva_template_url, name, ... }
│  │  Returns: { template: {...} }
│  └─ Used by: Admin management page
│
├─ GET /api/admin/canva-templates/{id}
│  │  Returns: { template: {...} }
│  └─ Used by: Admin management page
│
├─ PATCH /api/admin/canva-templates/{id}
│  │  Body: { name, description, ... }
│  │  Returns: { template: {...} }
│  └─ Used by: Admin management page
│
├─ DELETE /api/admin/canva-templates/{id}
│  │  Returns: { success: true }
│  └─ Used by: Admin management page
│
└─ POST /api/admin/canva-templates/upload-thumbnail
   │  FormData: { file, templateId }
   │  Returns: { thumbnailUrl, message }
   └─ Used by: Admin management page

EXISTING ENDPOINTS (Modified)
│
├─ GET /api/canva/auth
│  │  NOW ACCEPTS: templateId parameter
│  └─ Stores template_id in oauth state
│
└─ GET /api/canva/oauth/callback
   │  NOW RETRIEVES: template_id from state
   └─ Creates design from template or blank
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT TREE                                  │
└─────────────────────────────────────────────────────────────────────────┘

TEMPLATE SELECTION PAGE
│
└─ /canva/select-template/page.tsx
   │
   └─ <TemplateSelectionContent>
      │
      ├─ useSearchParams() → category, productId, variationId
      │
      └─ <TemplateSelector>
         │
         ├─ useEffect() → fetchTemplates()
         │  └─ GET /api/canva/templates?category=...
         │
         ├─ Loading State
         │  └─ <Spinner />
         │
         ├─ Error State
         │  └─ <ErrorMessage /> + "Blank Canvas" button
         │
         └─ Template Grid
            │
            ├─ <BlankCanvasOption />
            │  └─ onClick → handleTemplateSelect(null)
            │
            └─ templates.map(template =>
               <TemplateCard>
                  ├─ <Image src={thumbnail_url} />
                  ├─ <h3>{name}</h3>
                  ├─ <p>{description}</p>
                  └─ onClick → handleTemplateSelect(template.id)
               </TemplateCard>
            )

ADMIN MANAGEMENT PAGE
│
└─ /admin/canva-templates/page.tsx
   │
   ├─ useEffect() → fetchTemplates()
   │  └─ GET /api/admin/canva-templates
   │
   ├─ <Header>
   │  └─ "Add New Template" button
   │
   ├─ showForm && <TemplateForm>
   │  │
   │  ├─ <Input name="canva_template_url" />
   │  ├─ <Input name="name" />
   │  ├─ <Textarea name="description" />
   │  ├─ <Select name="product_category" />
   │  ├─ <FileInput name="thumbnail" />
   │  ├─ thumbnailPreview && <Image />
   │  │
   │  └─ onSubmit → handleSubmit()
   │     ├─ POST /api/admin/canva-templates
   │     └─ POST /api/admin/canva-templates/upload-thumbnail
   │
   └─ <TemplateGrid>
      │
      └─ templates.map(template =>
         <TemplateCard>
            ├─ <Image src={thumbnail_url} />
            ├─ <h3>{name}</h3>
            ├─ <p>{category}</p>
            │
            └─ <Actions>
               ├─ <EditButton onClick={handleEdit} />
               └─ <DeleteButton onClick={handleDelete} />
            </Actions>
         </TemplateCard>
      )
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          STATE FLOW                                      │
└─────────────────────────────────────────────────────────────────────────┘

TEMPLATE SELECTION STATE
│
├─ templates: CanvaTemplate[]
│  └─ Fetched from API on mount
│
├─ loading: boolean
│  ├─ true → Show spinner
│  └─ false → Show templates
│
├─ error: string | null
│  ├─ null → Normal display
│  └─ string → Show error message
│
├─ selectedTemplate: string | null
│  ├─ null → Blank canvas selected
│  └─ string → Template ID selected
│
└─ isProcessing: boolean
   ├─ true → Show "Starting Canva Editor..."
   └─ false → Show template selector

ADMIN FORM STATE
│
├─ templates: CanvaTemplate[]
│  └─ List of all templates
│
├─ showForm: boolean
│  ├─ true → Show form
│  └─ false → Show grid only
│
├─ editingTemplate: CanvaTemplate | null
│  ├─ null → Create mode
│  └─ object → Edit mode
│
├─ formData: { url, name, description, category }
│  └─ Form field values
│
├─ thumbnailFile: File | null
│  └─ Selected file for upload
│
├─ thumbnailPreview: string | null
│  └─ Data URL for preview
│
├─ submitting: boolean
│  ├─ true → Disable form, show "Saving..."
│  └─ false → Enable form
│
└─ error: string | null
   ├─ null → No error
   └─ string → Show error message
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ERROR HANDLING                                  │
└─────────────────────────────────────────────────────────────────────────┘

TEMPLATE SELECTION ERRORS
│
├─ API Error (templates fetch fails)
│  └─ Show error message + "Blank Canvas" button
│     └─ User can proceed without templates
│
├─ No Templates for Category
│  └─ Show "No templates available" + "Blank Canvas" button
│     └─ User can proceed with blank canvas
│
└─ OAuth Error
   └─ Redirect to error page with message

TEMPLATE CREATION ERRORS
│
├─ Template Creation Fails (Canva API)
│  │
│  ├─ Log error
│  ├─ Attempt fallback to blank design
│  │  │
│  │  ├─ Success → Continue with blank design
│  │  └─ Fail → Return 500 error
│  │
│  └─ User continues editing (transparent fallback)
│
└─ Invalid Template ID
   └─ Fallback to blank design automatically

ADMIN ERRORS
│
├─ Invalid Template URL
│  └─ Show validation error
│     └─ "Invalid Canva template URL. Expected format: ..."
│
├─ Duplicate Template
│  └─ Show error: "Template with this ID already exists"
│
├─ File Too Large
│  └─ Show error: "File size exceeds 500KB limit"
│
├─ Invalid File Type
│  └─ Show error: "Only JPEG, PNG, and WebP are allowed"
│
└─ Upload Failed
   └─ Show error: "Failed to upload thumbnail"
      └─ Template still created, can retry upload
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────────┘

ROW LEVEL SECURITY (RLS)
│
├─ canva_templates
│  ├─ SELECT: Anyone (public catalog)
│  └─ INSERT/UPDATE/DELETE: service_role only
│
└─ canva_oauth_states
   └─ ALL: service_role only

STORAGE POLICIES
│
└─ canva-template-thumbnails
   ├─ SELECT: Anyone (public read)
   └─ INSERT/DELETE: service_role only

INPUT VALIDATION
│
├─ Template URL
│  ├─ Must be valid URL
│  ├─ Must be canva.com domain
│  └─ Must match template format
│
├─ Template ID
│  └─ Must be alphanumeric with hyphens/underscores
│
└─ File Upload
   ├─ Type: image/jpeg, image/png, image/webp
   └─ Size: max 500KB

AUTHENTICATION
│
├─ Public Endpoints
│  └─ /api/canva/templates (read-only)
│
└─ Admin Endpoints (TODO: Add auth middleware)
   ├─ /api/admin/canva-templates
   └─ /admin/canva-templates

OAUTH SECURITY
│
├─ PKCE (Proof Key for Code Exchange)
├─ State parameter (CSRF protection)
├─ Token encryption (AES-256-GCM)
└─ State expiration (5 minutes)
```

This diagram provides a comprehensive visual overview of the entire Canva Template Selection feature implementation.
