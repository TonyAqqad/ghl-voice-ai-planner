# 📤 **Manual Git Push Instructions**

## **Issue:**
Git command not found in this PowerShell session.

## **Solution:**

### **Option 1: Use Git Bash or GitHub Desktop**

If you have Git Bash installed:
1. Open Git Bash
2. Navigate to project:
```bash
cd "/c/Users/eaqqa/OneDrive/Desktop/THE MONEY MAKER/cursor-agent-builder/sandbox-apps/ghl-voice-ai-planner"
```

3. Run:
```bash
git add -A
git commit -m "Add database module and Voice AI API utilities"
git push origin main
```

---

### **Option 2: Use GitHub Desktop**

1. Open GitHub Desktop
2. Select repository: `ghl-voice-ai-planner`
3. Review changes
4. Commit with message: "Add database module and Voice AI API utilities"
5. Click "Push origin"

---

### **Option 3: Restart PowerShell**

Git might be installed but not in current session PATH:

1. Close current PowerShell
2. Open new PowerShell window
3. Try git commands again

---

## **What Needs to Be Pushed:**

### **New Files:**
- `server/database.js` - Database module
- `src/utils/ghlVoiceAI.ts` - Voice AI API utilities
- `server/package.json` - Updated with sqlite3

### **Updated Files:**
- `server/ghl-express-api.js` - Integrated database

### **Documentation:**
- `DEPLOY_DATABASE.md`
- `ULTRA_MODE_ACTIVE.md`
- `MANUAL_GIT_PUSH.md` (this file)

---

## **After Pushing:**

Render will auto-deploy in 2-3 minutes.

Then test endpoints:
```bash
curl https://ghlvoiceai.captureclient.com/api/tokens/latest
curl https://ghlvoiceai.captureclient.com/api/locations
```

---

**Choose your preferred method and push!** 🚀

