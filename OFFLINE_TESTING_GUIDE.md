# Offline Testing Feature - Complete Guide
## Download Asset Data for Field Work Without Internet

---

## 📱 Overview

The **Offline Testing** feature allows field engineers to download asset data and test templates to their device, enabling them to conduct tests even without internet connectivity. All data is stored locally on the device and can be synced back when internet is restored.

### Key Benefits:
✅ Work in remote locations without internet  
✅ Continue testing during connectivity issues  
✅ Data stored securely in browser storage  
✅ Automatic sync when back online  
✅ Complete test workflows offline  

---

## 📍 Where to Find It

### Location: Asset Detail Page

**Navigation Path:**
```
1. Login to DMS Insight
2. Go to Company Overview / Dashboard
3. Click on any Asset Type (e.g., Transformers)
4. Click on a specific asset
5. Scroll down in the right sidebar
6. Look for "Download for Offline Testing" button
```

**Button Location:**
- **Right Sidebar** of Asset Detail page
- Below "Schedule Maintenance" button
- Above "Quick Notes" section
- Icon: Download symbol (⬇️)
- Text: "Download for Offline Testing"

---

## 🚀 Step-by-Step Guide

### Step 1: Navigate to Asset

1. **Login** to DMS Insight
   - Use your credentials (Master Admin, Company Admin, or Engineer)

2. **Select Asset Type**
   - From dashboard, click on asset category (Transformers, Motors, etc.)

3. **Open Asset Detail**
   - Click on the specific asset you need to test offline
   - Example: "Transformer Unit 1" (ASSET-0001)

---

### Step 2: Open Offline Download Dialog

1. **Scroll down** in the right sidebar
2. **Click** the button: **"Download for Offline Testing"**
3. A dialog will open with the title: **"Download for Offline Testing"**
4. Subtitle: "Download asset data and tests for offline field work"

---

### Step 3: Configure Download

The dialog shows three main sections:

#### **A. Asset Information** (Auto-filled)
- **Name:** Asset name (e.g., "Transformer Unit 1")
- **ID:** Asset identifier (e.g., "ASSET-0001")
- **Type:** Asset type (e.g., "transformer")
- **Location:** Where the asset is located

**→ This is read-only, automatically populated**

---

#### **B. Sales Orders** (Required) ⚠️

**Purpose:** Link your offline tests to specific sales orders/projects

**How to Select:**
1. Click on the **"Select Sales Orders (required)"** dropdown
2. A list of available sales orders appears
3. Click checkboxes to select one or more sales orders
4. Selected orders show as blue badges with shopping cart icons
5. Click 'X' on any badge to deselect

**Example:**
```
☑ SO-2024-001 - ABC Corporation
☑ SO-2024-015 - XYZ Industries
```

**Important:** You MUST select at least one sales order to proceed.

---

#### **C. Test Templates** (Required) ⚠️

**Purpose:** Choose which test types you'll conduct offline

**How to Select:**
1. Scroll through the list of available tests
2. Click checkboxes for tests you plan to run
3. Selected tests show checkmarks

**Example Tests for Transformers:**
```
☑ Insulation Resistance Test
☑ Transformer Ratio Test
☑ Winding Resistance Test
☐ Vector Group Test
☐ Load Loss Test
```

**Note:** The dialog shows "No tests available for this asset type" if no templates exist. Contact admin to create test templates first.

**Important:** You MUST select at least one test template to proceed.

---

#### **D. Storage Estimate**

At the bottom, you'll see estimated storage size:

```
💾 Storage Estimate
Asset data: ~0.05 MB
Tests: ~0.06 MB (3 tests)
Total: ~0.11 MB
```

This shows how much space will be used on your device.

**Device Info:**
```
📱 Device: Linux x86_64 • Online
```
Shows your device type and current connection status.

---

### Step 4: Download for Offline

1. **Review your selections:**
   - Sales orders selected? ✅
   - Tests selected? ✅
   - Storage OK? ✅

2. **Click the blue button:** **"Download for Offline"**
   - Button shows download icon (⬇️)
   - Located at bottom-right of dialog

3. **Wait for download:**
   - Progress indicator appears
   - Takes a few seconds
   - Data is saved to browser storage (IndexedDB)

4. **Success message appears:**
   ```
   ✅ Downloaded for Offline Testing
   Session ID: SESS-20251216-143025
   ```

5. **Page automatically refreshes**
   - Shows "locked" indicator on asset
   - Asset is now available for offline testing

---

## 🔒 What Happens After Download?

### Data Stored Locally:

**1. Asset Information**
- Full asset details (name, ID, specifications)
- Nameplate information
- Asset photo (if available)
- Current health score

**2. Test Templates**
- Complete test procedures
- All parameters and steps
- Equipment requirements
- Photo requirements

**3. Sales Order Data**
- SO numbers and customer info
- Project details
- Linked information

**4. Session Metadata**
- Session ID for tracking
- Download timestamp
- User information
- Device details

---

### Browser Storage Location:

**Technology:** IndexedDB (built into browser)

**Database Name:** `DMS_Insight_Offline`

**Tables:**
- `sessions` - Offline session data
- `assets` - Downloaded asset information
- `tests` - Test templates
- `test_executions` - Completed tests pending sync

**Storage Capacity:**
- Modern browsers: 50MB - 1GB+
- Depends on device and browser
- Plenty of space for multiple assets

---

## 📴 Working Offline

### Once Downloaded:

**1. Asset Shows "Locked" Status**
- Lock icon (🔒) appears on asset card
- Indicates asset has offline data
- Click asset to access offline mode

**2. Conduct Tests Offline**
- Navigate to asset detail page (works offline)
- Click "Conduct Test" button
- Select from downloaded test templates
- Complete all test steps
- Take photos (stored locally)
- Submit test (saved to local storage)

**3. Multiple Tests**
- Can conduct multiple tests on same asset
- Each test saved locally
- All awaiting sync when online

**4. Offline Indicator**
- Banner at top: "You are in Offline Mode"
- Shows sync status
- Lists pending test results

---

## 🔄 Syncing Back Online

### Automatic Sync:

**When Internet Returns:**

1. **Banner Changes:**
   ```
   🔄 Syncing offline data...
   2 test results pending sync
   ```

2. **Automatic Upload:**
   - System detects internet connection
   - Uploads all pending test results
   - Uploads photos taken offline
   - Updates asset status

3. **Sync Complete:**
   ```
   ✅ Sync Complete!
   All offline data has been uploaded
   ```

4. **Unlock Asset:**
   - Lock indicator removed
   - Asset back to normal mode
   - Test results visible in history

---

### Manual Sync:

If automatic sync doesn't work:

1. **Click "Sync Now" button** in offline banner
2. Wait for upload to complete
3. Check for success message
4. Verify test results appear in asset history

---

## ⚠️ Important Notes & Limitations

### Requirements:

✅ **Supported Browsers:**
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

✅ **Storage Space:**
- At least 10MB free space
- More for multiple assets

✅ **Initial Download:**
- Requires internet connection
- One-time download per asset

❌ **Limitations:**

- **Cannot download multiple assets** - One at a time
- **Cannot modify test templates offline** - Use downloaded versions
- **Cannot onboard new assets offline** - Only test existing ones
- **Limited to selected tests** - Must redownload for new tests
- **Browser data clearing** - Clears offline data
- **Device change** - Data doesn't transfer between devices

---

## 🛠️ Troubleshooting

### Issue: "No tests available for this asset type"

**Solution:**
1. Go back online
2. Contact admin to create test templates
3. Admin: Go to Test Templates page
4. Create templates for this asset type
5. Retry offline download

---

### Issue: Download button not visible

**Solutions:**
- Check if you're on Asset Detail page (not list page)
- Scroll down in right sidebar
- Check permissions (may be admin-only)
- Verify asset isn't already locked by another offline session

---

### Issue: "Failed to download for offline"

**Solutions:**
- Check internet connection (needed for initial download)
- Clear browser cache and try again
- Check storage space (Settings → Storage)
- Try different browser
- Contact admin for backend issues

---

### Issue: Tests not syncing after coming online

**Solutions:**
1. **Manual Sync:**
   - Click "Sync Now" in offline banner
   - Wait for completion

2. **Check Connection:**
   - Verify internet is actually restored
   - Try opening another website

3. **Force Sync:**
   - Refresh the page
   - Navigate to asset detail page
   - Check for sync prompt

4. **Last Resort:**
   - Export test data before clearing
   - Contact admin for manual data entry

---

### Issue: Offline data lost

**Causes:**
- Browser cache cleared
- Private/Incognito mode (doesn't persist)
- Browser data reset
- Different browser/device

**Prevention:**
- Use regular browser mode (not private)
- Don't clear browser data during field work
- Sync frequently when possible
- Keep device powered

---

## 💡 Best Practices

### Before Going to Field:

1. ✅ **Test internet connection** while still online
2. ✅ **Download asset data** in advance
3. ✅ **Verify tests downloaded** - Check in asset detail
4. ✅ **Select all relevant tests** - Download everything you might need
5. ✅ **Charge device fully** - Offline testing uses battery
6. ✅ **Test offline mode** - Try accessing while connected, then disconnect
7. ✅ **Bookmark asset page** - Easy access in field

---

### During Field Work:

1. ✅ **Save frequently** - Complete and save tests as you go
2. ✅ **Take photos liberally** - Stored locally, no data usage
3. ✅ **Add detailed notes** - Context helps later review
4. ✅ **Keep device protected** - Don't lose the device!
5. ✅ **Monitor battery** - Preserve power for all tests
6. ✅ **Complete tests fully** - All required fields before saving

---

### After Returning Online:

1. ✅ **Connect to stable internet** - Don't use mobile hotspot if possible
2. ✅ **Wait for automatic sync** - Give it 30 seconds
3. ✅ **Verify sync completion** - Check for success message
4. ✅ **Review uploaded tests** - Confirm they appear in history
5. ✅ **Unlock asset** - Check lock indicator is removed
6. ✅ **Download fresh data** - If returning to field again

---

## 📊 Offline Storage Summary

### What's Stored:

| Data Type | Size | Location |
|-----------|------|----------|
| Asset Info | ~50 KB | IndexedDB |
| Test Template | ~20 KB each | IndexedDB |
| Session Metadata | ~5 KB | IndexedDB |
| Test Results | ~30 KB each | IndexedDB |
| Photos | 50-500 KB each | IndexedDB |

**Example Calculation:**
```
Asset + 3 Tests + 5 Photos:
= 50KB + (20KB × 3) + (200KB × 5)
= 50KB + 60KB + 1000KB
= 1.1 MB total
```

Modern browsers handle this easily!

---

## 🔐 Security & Privacy

### Data Protection:

✅ **Browser Encryption:**
- IndexedDB is encrypted at rest
- Protected by browser security

✅ **Session Tracking:**
- Each offline session has unique ID
- Traceable for audit purposes

✅ **User Attribution:**
- All tests tagged with user info
- Cannot be manipulated

✅ **Device Binding:**
- Data tied to specific browser/device
- Cannot be transferred maliciously

---

## 📞 Need Help?

### Common Questions:

**Q: Can I download multiple assets?**
A: One asset at a time. Download again for each asset.

**Q: How long can I work offline?**
A: Indefinitely! Data persists until synced or cleared.

**Q: What if my device dies?**
A: Data is saved in browser. Will be there when device restarts (unless browser data is cleared).

**Q: Can I use on mobile?**
A: Yes! Works on mobile browsers (Chrome, Safari).

**Q: Does offline testing use data?**
A: Only for initial download and final sync. No data used during offline work.

---

### Contact Support:

**For Technical Issues:**
- Contact your system administrator
- Check browser console for errors (F12)
- Note Session ID from success message

**For Feature Requests:**
- Discuss with Master Admin
- Submit feedback through support channels

---

## ✨ Summary

### Quick Checklist:

**Before Field Work:**
- [ ] Navigate to Asset Detail page
- [ ] Click "Download for Offline Testing"
- [ ] Select Sales Orders
- [ ] Select Test Templates
- [ ] Click "Download for Offline"
- [ ] Wait for success message
- [ ] Verify lock indicator appears

**During Field Work:**
- [ ] Work offline with confidence
- [ ] Complete all test steps
- [ ] Take required photos
- [ ] Add detailed observations
- [ ] Save completed tests

**After Field Work:**
- [ ] Connect to internet
- [ ] Wait for automatic sync
- [ ] Verify sync completion
- [ ] Check test results in history
- [ ] Confirm asset unlocked

---

**Congratulations! You're ready to use offline testing!** 🎉

**Version:** 1.0  
**Last Updated:** December 2025  
**For:** DMS Insight Platform
