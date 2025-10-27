# 🔧 **Fix Render Build Command**

## **The Error:**
```
bash: line 1: added: command not found
==> Build failed
```

## **The Problem:**
You used backticks in the Build Command:
```
`cd server && npm install`
```

The backticks (`) are being interpreted by the shell, causing errors.

## **The Solution:**

### **Update Build Command:**

In Render dashboard → Service → Settings:

**Remove the backticks!**

**Change from:**
```
`cd server && npm install`
```

**To:**
```
cd server && npm install
```

**And Start Command:**

**Change from:**
```
`cd server && node ghl-express-api.js`
```

**To:**
```
cd server && node ghl-express-api.js
```

### **No Backticks Needed!**

Render doesn't need backticks - just use the plain command.

---

## **Quick Fix Steps:**

1. **Go to Render Dashboard:**
   https://dashboard.render.com/web

2. **Click on:** ghl-oauth-api service

3. **Click "Settings"**

4. **Scroll to "Build & Deploy"**

5. **Update Build Command:**
   - Type: `cd server && npm install`
   - **NO backticks!**

6. **Update Start Command:**
   - Type: `cd server && node ghl-express-api.js`
   - **NO backticks!**

7. **Click "Save Changes"**

8. **Click "Manual Deploy"** → **"Deploy latest commit"**

---

## **What You'll See:**

```
==> Running build command 'cd server && npm install'...
added 65 packages
==> Build successful ✅
==> Starting service...
🚀 GHL OAuth API Server running on port 10000
```

---

## **Correct Settings Summary:**

### **Build Command:**
```
cd server && npm install
```
(No backticks, just plain text)

### **Start Command:**
```
cd server && node ghl-express-api.js
```
(No backticks, just plain text)

### **Environment Variables:**
- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_SHARED_SECRET`
- `GHL_REDIRECT_URI`
- `PORT=10000`
- `NODE_ENV=production`

---

## **After Fixing:**

1. Save settings
2. Click "Manual Deploy"
3. Watch for "Build successful"
4. Service goes live! 🎉

---

**The issue is the backticks - remove them!** 🚀

See `UPDATE_RENDER_SETTINGS.md` for detailed instructions.

