# Screenshot Guide for User Manual

## 📸 How to Capture Screenshots for the User Manual

Since screenshots need to be captured from your deployed application, here's a guide to capture them yourself.

---

## Required Screenshots (11 total)

### Screenshot 1: Login Page
**File:** `01_login_page.png`  
**URL:** `https://your-app-url.com/login`  
**What to capture:** Full login screen showing username and password fields

---

### Screenshot 2: Company-Wide Overview
**File:** `02_company_overview.png`  
**URL:** `https://your-app-url.com/` (after login)  
**What to capture:** Dashboard with Quick Access cards visible

---

### Screenshot 3: Management Cards Section
**File:** `03_management_cards.png`  
**URL:** `https://your-app-url.com/` (scroll down)  
**What to capture:** Scroll down to show management cards (Site Management, User Management, etc.)

---

### Screenshot 4: Asset List Page
**File:** `04_asset_list.png`  
**URL:** `https://your-app-url.com/assets/transformer`  
**What to capture:** List of assets with health scores and status

---

### Screenshot 5: Asset Detail Header
**File:** `05_asset_detail_header.png`  
**URL:** `https://your-app-url.com/assets/transformer/ASSET-0001`  
**What to capture:** Asset name, health score, status, and nameplate tiles

---

### Screenshot 6: Asset Quick Actions
**File:** `06_asset_quick_actions.png`  
**URL:** `https://your-app-url.com/assets/transformer/ASSET-0001` (scroll down)  
**What to capture:** Right sidebar with Quick Actions buttons (Conduct Test, View Analytics, etc.)

---

### Screenshot 7: QR Code Dialog
**File:** `07_qr_code_dialog.png`  
**URL:** `https://your-app-url.com/assets/transformer/ASSET-0001`  
**Action:** Click "Asset QR Code" tile  
**What to capture:** Dialog showing the actual QR code with Download/Print/Share buttons

---

### Screenshot 8: Conduct Test Page
**File:** `08_conduct_test_page.png`  
**URL:** `https://your-app-url.com/assets/transformer/ASSET-0001/test`  
**What to capture:** Test form with parameters and equipment sections

---

### Screenshot 9: Parameter Management
**File:** `09_parameter_management.png`  
**URL:** `https://your-app-url.com/parameter-management`  
**What to capture:** Parameter library page showing asset types and parameters list

---

### Screenshot 10: Inactive Parameters View
**File:** `10_inactive_parameters.png`  
**URL:** `https://your-app-url.com/parameter-management`  
**Action:** Check "Show Inactive Parameters" checkbox  
**What to capture:** Parameters list showing inactive parameters with badges

---

### Screenshot 11: Site Management
**File:** `11_site_management.png`  
**URL:** `https://your-app-url.com/site-management`  
**What to capture:** Site cards showing site information and status

---

## 📁 Where to Save Screenshots

Save all screenshots to: `/app/screenshots/`

Or if sharing the documentation:
```
your-project/
├── DMS_Insight_User_Manual.md
├── DMS_Insight_Quick_Start_Guide.md
├── DOCUMENTATION_README.md
└── screenshots/
    ├── 01_login_page.png
    ├── 02_company_overview.png
    ├── 03_management_cards.png
    ├── 04_asset_list.png
    ├── 05_asset_detail_header.png
    ├── 06_asset_quick_actions.png
    ├── 07_qr_code_dialog.png
    ├── 08_conduct_test_page.png
    ├── 09_parameter_management.png
    ├── 10_inactive_parameters.png
    └── 11_site_management.png
```

---

## 🖥️ Capture Methods

### Method 1: Using Browser (Simple)

1. Open your application in browser
2. Navigate to the URL
3. Press `F12` to open Developer Tools
4. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
5. Type "screenshot" and select "Capture screenshot"
6. Save with the correct filename

### Method 2: Using Built-in Screenshot Tool

**Windows:** 
- Press `Windows + Shift + S`
- Select area to capture
- Save from clipboard

**Mac:**
- Press `Cmd + Shift + 4`
- Select area to capture
- Saves automatically to Desktop

**Linux:**
- Press `PrtScn` or use Screenshot tool
- Select area to capture

### Method 3: Using Browser Extensions

Install a screenshot extension like:
- Awesome Screenshot
- Nimbus Screenshot
- FireShot

---

## 📐 Screenshot Settings

**Recommended Settings:**
- **Resolution:** 1920x1080 or higher
- **Format:** PNG (better quality than JPG)
- **Quality:** Medium to High
- **Viewport:** Desktop view (not mobile)

---

## ✅ Verification Checklist

After capturing all screenshots:

- [ ] All 11 screenshots captured
- [ ] Named correctly (01-11)
- [ ] Saved in `/app/screenshots/` directory
- [ ] Images are clear and readable
- [ ] No sensitive data visible (if sharing publicly)
- [ ] All screenshots in PNG format

---

## 🔄 Alternative: Use Without Screenshots

The user manual is written to be useful even without screenshots. Each section has:
- Clear text descriptions
- Step-by-step instructions
- Feature explanations
- Navigation paths

If screenshots aren't available immediately, users can still follow the manual using the text descriptions.

---

## 📝 Updating the Manual

If you capture screenshots with different filenames, update the User Manual:

1. Open `DMS_Insight_User_Manual.md`
2. Search for: `![Screenshot Name](screenshots/filename.png)`
3. Replace with your actual filenames
4. Save and export to PDF

---

## 💡 Pro Tips

✅ **Capture at 1920x1080** - Standard resolution for documentation

✅ **Hide personal data** - Blur or redact sensitive information if sharing publicly

✅ **Consistent style** - Use same zoom level for all screenshots

✅ **Good lighting** - Ensure UI is clearly visible

✅ **Annotate if needed** - Add arrows or highlights to important areas

---

## 🆘 Need Help?

If you need assistance:
1. Follow the URLs in each screenshot section
2. Capture the screen as shown
3. Save with the correct filename
4. Place in screenshots folder
5. The manual will automatically reference them

---

**Created:** December 2025  
**For:** DMS Insight User Manual Documentation
