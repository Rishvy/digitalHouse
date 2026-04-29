# Canva Integration - Simple Workaround

## The Problem
The "Return" button in Canva requires additional setup in the Canva Developer Portal (enabling return navigation and configuring the return URL). Without this setup, there's no automatic way for users to return from Canva to your app.

## The Solution
I've created a **manual export flow** that works without the Return button.

---

## 🎯 How It Works Now

### **Step 1: User Edits in Canva** (You are here)
- User is redirected to Canva editor
- They make their edits
- They can close the Canva tab when done

### **Step 2: User Goes to Finish Page**
- User navigates to: `http://127.0.0.1:3000/canva/finish?designId={DESIGN_ID}&userId={USER_ID}`
- They click "Save Design & Return" button
- This triggers the export process

### **Step 3: Export Happens Automatically**
- Export job is created
- Processing page shows progress
- File is downloaded and saved
- User is redirected back to your app

---

## 📝 For Your Current Session

Since you're already in Canva editing, here's what to do:

### **Option 1: Manual Export (Easiest)**

1. **Copy the design ID from the URL**
   - Look at your browser URL bar
   - It should be: `https://www.canva.com/design/{DESIGN_ID}/edit`
   - Copy the `DESIGN_ID` part

2. **Get your user ID**
   - You'll need to know your user ID from the database
   - Or we can add it to the session

3. **Navigate to the finish page**
   - Go to: `http://127.0.0.1:3000/canva/finish?designId={DESIGN_ID}&userId={USER_ID}`
   - Click "Save Design & Return"

### **Option 2: Just Download Manually**

Since you already downloaded the file:
1. Close the Canva tab
2. Go back to your app
3. Upload the downloaded PNG file directly

---

## 🔧 Proper Fix (For Production)

To enable the automatic Return button in Canva:

### **1. Configure Return Navigation in Canva Developer Portal**

1. Go to: https://www.canva.com/developers
2. Open your integration settings
3. Navigate to **"Return navigation"** page
4. Enable return navigation
5. Add return URL: `http://127.0.0.1:3000/canva/finish`
6. For production, add: `https://yourdomain.com/canva/finish`

### **2. Update the Code**

The code is already updated to use:
- `correlation_state` parameter (instead of `returnTo`)
- Proper Connect API edit URL (with token)
- JWT decoding for return navigation

### **3. Test the Flow**

After configuring the Developer Portal:
1. Start a new OAuth flow
2. Edit a design in Canva
3. Look for the **"Return"** button in Canva's top bar
4. Click it to automatically return to your app

---

## 🚀 Quick Test

Want to test the manual export flow right now?

1. **Get the design ID from your current Canva URL**
   - Example: If URL is `https://www.canva.com/design/DAGcXYZ123/edit`
   - Design ID is: `DAGcXYZ123`

2. **Get your user ID**
   - Run this in your terminal:
   ```bash
   # Query the canva_user_tokens table to find your user_id
   # Or check the browser console for the userId from the OAuth flow
   ```

3. **Navigate to**:
   ```
   http://127.0.0.1:3000/canva/finish?designId=DAGcXYZ123&userId=YOUR_USER_ID
   ```

4. **Click "Save Design & Return"**

---

## 📚 Files Created

1. **`/api/canva/export-design`** - Manual export trigger endpoint
2. **`/canva/finish`** - User-facing page to trigger export
3. **Updated `/api/canva/oauth/callback`** - Now uses proper Connect API URLs
4. **Updated `/api/canva/return-nav`** - Now handles JWT tokens correctly

---

## ⚠️ Current Limitations

- User must manually navigate to the finish page (or we add a link)
- Requires knowing the design ID and user ID
- Not as seamless as the automatic Return button

## ✅ Benefits

- Works immediately without Developer Portal configuration
- No waiting for Canva approval
- User has full control over when to export
- Can test the full flow right now

---

## 🎯 Next Steps

**For immediate testing:**
1. Get your design ID from the Canva URL
2. Get your user ID from the database
3. Navigate to the finish page
4. Click "Save Design & Return"

**For production:**
1. Configure return navigation in Canva Developer Portal
2. The automatic Return button will appear
3. Users won't need the manual finish page

---

## 💡 Alternative: Add a Link in Your App

You can add a "Finish Editing in Canva" button in your app that:
1. Stores the design ID when redirecting to Canva
2. Shows a button to trigger export when user returns
3. Automatically passes the design ID and user ID

This way users don't need to manually construct the URL!
