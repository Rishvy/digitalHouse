# Canva Integration Setup Checklist

## ✅ What's Already Done:
- [x] OAuth callback endpoint created
- [x] Single loading screen with progress bar (consolidated from 3 screens)
- [x] Return navigation processing endpoint created
- [x] Export status polling endpoint created
- [x] Add to cart debug information added
- [x] Database migration file created
- [x] Documentation written

## 🔧 What You Need to Do Now:

### 1. **Run Database Migration** (REQUIRED)

Go to your Supabase Dashboard:
1. Open https://supabase.com/dashboard/project/ybggextouoexzwwflogq
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `scripts/run_user_designs_migration.sql`
5. Click "Run" to execute the migration

This creates the `user_designs` table to store exported designs.

---

### 2. **Create Supabase Storage Bucket** (REQUIRED)

Go to your Supabase Dashboard:
1. Open https://supabase.com/dashboard/project/ybggextouoexzwwflogq
2. Click on "Storage" in the left sidebar
3. Click "Create a new bucket"
4. Name it: `user-uploads`
5. Make it **Public** (check the "Public bucket" option)
6. Click "Create bucket"

This is where exported Canva designs will be stored.

---

### 3. **Test the Complete Flow**

Now you can test the full integration:

#### In Canva (where you are now):
1. Click the **"Share"** button (top right)
2. Look for **"Publish"** or **"Download"** option
3. Click it to finalize the design

#### What Should Happen:
1. ✅ Canva redirects to your app (`/canva/finish`)
2. ✅ Single loading screen with progress bar appears
3. ✅ Export job is created via Canva API (behind the scenes)
4. ✅ Design is exported and uploaded to Supabase Storage
5. ✅ User is redirected to the result page with their design
4. ✅ Status is polled every second
5. ✅ File is downloaded from Canva
6. ✅ File is uploaded to Supabase Storage
7. ✅ Design metadata saved to database
8. ✅ You're redirected back to your app

---

## 🐛 Troubleshooting

### If you get "User not authenticated with Canva":
- The OAuth tokens might have expired
- Start the flow again from your app

### If you get "Failed to upload to Supabase":
- Make sure the `user-uploads` bucket exists
- Make sure it's set to **Public**

### If the processing page times out:
- Check browser console for errors
- Check Supabase logs for API errors
- The design might be too large (try a simpler design)

---

## 📝 Quick Reference

### Environment Variables (Already Set):
```
CANVA_CLIENT_ID=OC-AZ3Yr3LuLc6Q
CANVA_CLIENT_SECRET=cnvcazdMOh86nBhmsrB-NZ6_dyWMHaVnNAzU89MZwbdWREHg9e1e0345
CANVA_REDIRECT_URI=http://127.0.0.1:3000/api/canva/oauth/callback
CANVA_RETURN_NAV_URI=http://127.0.0.1:3000/canva/finish
CANVA_TOKEN_ENCRYPTION_KEY=976a6e4cc8635300cb27ed99f065f9259bf3b2e421799f4f234ccdc77677cee8
```

### API Endpoints:
- OAuth Start: `/api/canva/oauth/authorize`
- OAuth Callback: `/api/canva/oauth/callback`
- Return Navigation Processing: `/api/canva/return-nav-process`
- Export Status: `/api/canva/export-status`
- Loading Page: `/canva/finish` (single screen with progress)
- Export Status: `/api/canva/export-status`
- Processing Page: `/canva/processing`

### Database Tables:
- `canva_oauth_states` - OAuth state tokens
- `canva_user_tokens` - User access tokens
- `user_designs` - Exported designs (NEW - needs migration)

---

## 📚 Full Documentation

See `docs/canva-integration.md` for complete technical documentation.

---

## 🚀 Next Steps After Testing

Once the basic flow works, you can enhance it:

1. **Token Refresh** - Auto-refresh expired tokens
2. **Template Selection** - Start from predefined templates
3. **Re-edit Designs** - Allow users to edit existing designs
4. **Webhook Integration** - Use webhooks instead of polling
5. **Multiple Export Formats** - Support PDF, JPG, etc.

---

## ⚠️ Important Notes

- **Export URLs from Canva expire in 24 hours** - That's why we upload to Supabase Storage
- **Rate Limits**: 75 exports per user per 5 minutes, 500 per 24 hours
- **Premium Content**: Designs with premium elements may require Canva Pro
- **File Size**: Large designs may take longer to export

---

## 🎯 Current Status

You are here: **In Canva Editor** → Ready to publish

Next step: **Click "Share" → "Publish"** to trigger the return flow!
