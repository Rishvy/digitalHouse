# Canva Template Selection - Deployment Checklist

Use this checklist to deploy the Canva Template Selection feature to production.

## Pre-Deployment

### 1. Code Review
- [ ] Review all new files for security issues
- [ ] Check error handling is comprehensive
- [ ] Verify no sensitive data in logs
- [ ] Confirm environment variables are used correctly
- [ ] Review SQL migrations for safety

### 2. Local Testing
- [ ] All features work in development
- [ ] Database migrations run successfully
- [ ] Template CRUD operations work
- [ ] Thumbnail upload works
- [ ] OAuth flow with templates works
- [ ] Fallback to blank canvas works
- [ ] Responsive design tested on all screen sizes
- [ ] Error states display correctly

### 3. Documentation
- [ ] README updated with new feature
- [ ] API documentation complete
- [ ] Setup guide reviewed
- [ ] Integration examples provided
- [ ] Troubleshooting guide complete

## Database Migration

### 4. Backup Production Database
```bash
# Create backup before migration
# Use Supabase Dashboard or CLI
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
```
- [ ] Backup created and verified
- [ ] Backup stored securely

### 5. Run Migrations in Production

**Step 1: Create Templates Table**
- [ ] Open Supabase SQL Editor (Production)
- [ ] Copy contents of `scripts/create_canva_templates_table.sql`
- [ ] Execute SQL
- [ ] Verify table created: `SELECT * FROM canva_templates LIMIT 1;`
- [ ] Verify indexes created: `\d canva_templates`
- [ ] Verify RLS enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'canva_templates';`

**Step 2: Extend OAuth States Table**
- [ ] Copy contents of `scripts/add_template_id_to_oauth_states.sql`
- [ ] Execute SQL
- [ ] Verify column added: `\d canva_oauth_states`
- [ ] Verify foreign key constraint exists

**Step 3: Verify Storage Bucket**
- [ ] Go to Supabase Dashboard → Storage
- [ ] Verify `canva-template-thumbnails` bucket exists
- [ ] Verify bucket is set to **Public**
- [ ] Test upload a file manually
- [ ] Test public URL access
- [ ] Delete test file

### 6. Verify Database Changes
```sql
-- Check templates table
SELECT COUNT(*) FROM canva_templates;

-- Check oauth states has template_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'canva_oauth_states' 
AND column_name = 'template_id';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'canva_templates';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'canva-template-thumbnails';

-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'canva-template-thumbnails';
```
- [ ] All queries return expected results

## Application Deployment

### 7. Environment Variables
- [ ] Verify all required env vars are set in production:
  - `CANVA_CLIENT_ID`
  - `CANVA_CLIENT_SECRET`
  - `CANVA_REDIRECT_URI` (production URL)
  - `CANVA_TOKEN_ENCRYPTION_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 8. Build and Deploy
```bash
# Build application
npm run build

# Check for build errors
# Deploy to production
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Deployment successful

### 9. Post-Deployment Verification

**API Endpoints:**
- [ ] `GET /api/canva/templates?category=business_cards` returns 200
- [ ] `GET /api/admin/canva-templates` returns 200
- [ ] `POST /api/admin/canva-templates` works (test with dummy data)
- [ ] `DELETE /api/admin/canva-templates/{id}` works (delete test data)

**Pages:**
- [ ] `/canva/select-template?category=business_cards` loads
- [ ] `/admin/canva-templates` loads
- [ ] Template selection page shows "Blank Canvas" option
- [ ] Admin page shows empty state or templates

**OAuth Flow:**
- [ ] Start OAuth from template selection
- [ ] Complete authorization
- [ ] Verify design created in Canva
- [ ] Complete design and export
- [ ] Verify file saved to database

## Security

### 10. Security Checks
- [ ] Admin routes protected by authentication
- [ ] RLS policies active on templates table
- [ ] Storage bucket has correct policies
- [ ] API endpoints validate input
- [ ] File uploads have size limits
- [ ] File uploads have type restrictions
- [ ] No sensitive data in client-side code
- [ ] CSRF protection active (OAuth state)

### 11. Add Admin Authentication

**Example middleware:**
```typescript
// middleware.ts or in admin page
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: Request) {
  const { pathname } = new URL(request.url);
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const supabase = createServerClient(/* ... */);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect('/login');
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.redirect('/');
    }
  }
  
  return NextResponse.next();
}
```
- [ ] Admin authentication implemented
- [ ] Admin role check implemented
- [ ] Unauthorized access redirects correctly

## Content Population

### 12. Add Initial Templates

**For each product category:**
- [ ] Find suitable Canva templates
- [ ] Navigate to `/admin/canva-templates`
- [ ] Add template with URL
- [ ] Upload thumbnail (optimized, < 500KB)
- [ ] Test template selection
- [ ] Verify template loads in Canva

**Recommended initial templates:**
- [ ] Business Cards (3-5 templates)
- [ ] Flyers (3-5 templates)
- [ ] Posters (3-5 templates)
- [ ] Brochures (2-3 templates)
- [ ] Banners (2-3 templates)

### 13. Optimize Thumbnails

For each thumbnail:
- [ ] Resize to appropriate dimensions (e.g., 400x533 for 3:4 ratio)
- [ ] Compress to < 500KB
- [ ] Convert to WebP if possible
- [ ] Test loading speed

## Integration

### 14. Update Product Pages

For each product type:
- [ ] Update "Edit in Canva" button
- [ ] Link to `/canva/select-template`
- [ ] Pass correct category parameter
- [ ] Pass productId and userId
- [ ] Test end-to-end flow

**Example locations to update:**
- [ ] Product detail pages
- [ ] Product catalog pages
- [ ] User dashboard
- [ ] Cart/checkout pages (if applicable)

### 15. Update Navigation

- [ ] Add link to admin templates (if needed)
- [ ] Update help/documentation links
- [ ] Update user guides

## Monitoring

### 16. Set Up Monitoring

**Metrics to track:**
- [ ] Template selection rate vs blank canvas
- [ ] Template creation success rate
- [ ] API response times
- [ ] Error rates
- [ ] Storage usage
- [ ] Most popular templates

**Tools:**
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics (Google Analytics, etc.)
- [ ] Set up performance monitoring
- [ ] Set up database query monitoring

### 17. Create Alerts

- [ ] Alert on high error rate
- [ ] Alert on slow API responses
- [ ] Alert on storage quota approaching limit
- [ ] Alert on failed OAuth flows

## Testing

### 18. End-to-End Testing

**Test Case 1: Template Selection Flow**
1. [ ] Navigate to product page
2. [ ] Click "Edit in Canva"
3. [ ] Template selection page loads
4. [ ] Templates display correctly
5. [ ] Select a template
6. [ ] OAuth flow starts
7. [ ] Authorize on Canva
8. [ ] Canva editor opens with template
9. [ ] Edit design
10. [ ] Export design
11. [ ] Design saved to database

**Test Case 2: Blank Canvas Flow**
1. [ ] Navigate to template selection
2. [ ] Click "Start with Blank Canvas"
3. [ ] OAuth flow starts
4. [ ] Blank design created
5. [ ] Canva editor opens
6. [ ] Complete flow as normal

**Test Case 3: Error Handling**
1. [ ] Test with no templates for category
2. [ ] Test with invalid template ID
3. [ ] Test with network error
4. [ ] Verify fallback to blank canvas works

**Test Case 4: Admin Flow**
1. [ ] Login as admin
2. [ ] Navigate to `/admin/canva-templates`
3. [ ] Add new template
4. [ ] Upload thumbnail
5. [ ] Edit template
6. [ ] Delete template
7. [ ] Verify changes reflected in selection page

### 19. Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### 20. Performance Testing
- [ ] Template selection page loads < 2s
- [ ] API responses < 500ms
- [ ] Thumbnails load < 1s
- [ ] No memory leaks
- [ ] No console errors

## Documentation

### 21. Update User Documentation
- [ ] Add template selection to user guide
- [ ] Create video tutorial (optional)
- [ ] Update FAQ
- [ ] Update help center

### 22. Update Developer Documentation
- [ ] Update API documentation
- [ ] Update architecture diagrams
- [ ] Update deployment guide
- [ ] Update troubleshooting guide

## Rollback Plan

### 23. Prepare Rollback

**If issues occur, rollback steps:**

1. **Revert code deployment**
   ```bash
   # Deploy previous version
   git revert <commit-hash>
   npm run build
   # Deploy
   ```

2. **Rollback database (if needed)**
   ```sql
   -- Remove template_id column
   ALTER TABLE canva_oauth_states DROP COLUMN IF EXISTS template_id;
   
   -- Drop templates table
   DROP TABLE IF EXISTS canva_templates CASCADE;
   
   -- Remove storage bucket
   DELETE FROM storage.buckets WHERE id = 'canva-template-thumbnails';
   ```

3. **Restore from backup**
   ```bash
   # If needed, restore from backup
   psql < backup_YYYYMMDD_HHMMSS.sql
   ```

- [ ] Rollback plan documented
- [ ] Rollback tested in staging
- [ ] Team knows rollback procedure

## Communication

### 24. Stakeholder Communication
- [ ] Notify team of deployment
- [ ] Notify users of new feature (if applicable)
- [ ] Update changelog
- [ ] Update release notes

### 25. Training
- [ ] Train admin staff on template management
- [ ] Train support staff on troubleshooting
- [ ] Create internal documentation

## Post-Deployment

### 26. Monitor for 24 Hours
- [ ] Check error logs hourly
- [ ] Monitor API response times
- [ ] Check user feedback
- [ ] Verify no performance degradation
- [ ] Check database query performance

### 27. Gather Feedback
- [ ] Collect user feedback
- [ ] Review analytics data
- [ ] Identify issues or improvements
- [ ] Plan next iteration

### 28. Optimize
- [ ] Optimize slow queries
- [ ] Optimize large thumbnails
- [ ] Add caching if needed
- [ ] Improve error messages based on feedback

## Sign-Off

### 29. Deployment Complete
- [ ] All checklist items completed
- [ ] No critical issues
- [ ] Monitoring in place
- [ ] Documentation updated
- [ ] Team notified

**Deployed by:** _______________  
**Date:** _______________  
**Version:** _______________  

**Approved by:** _______________  
**Date:** _______________  

## Notes

Use this section for deployment-specific notes:

```
[Add any notes, issues encountered, or special considerations here]
```

---

## Quick Reference

**Database Migrations:**
1. `scripts/create_canva_templates_table.sql`
2. `scripts/add_template_id_to_oauth_states.sql`

**Key URLs:**
- Template Selection: `/canva/select-template`
- Admin Interface: `/admin/canva-templates`
- Template API: `/api/canva/templates`
- Admin API: `/api/admin/canva-templates`

**Documentation:**
- Setup: `CANVA_TEMPLATE_SETUP.md`
- Technical: `docs/canva-template-selection.md`
- Integration: `docs/template-selection-integration-example.md`
- Summary: `.kiro/specs/canva-template-selection/implementation-summary.md`
