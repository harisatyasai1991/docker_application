# DMS Insight™ User Manual
## Comprehensive Electrical Asset Monitoring & Predictive Maintenance Platform

**Version:** 1.0  
**Last Updated:** December 2025  
**Target Audience:** Master Admins, Company Admins, Field Engineers, Maintenance Teams

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Getting Started](#3-getting-started)
4. [Company-Wide Overview](#4-company-wide-overview)
5. [Asset Management](#5-asset-management)
6. [Testing & Inspections](#6-testing--inspections)
7. [QR Code Feature](#7-qr-code-feature)
8. [Administrative Features](#8-administrative-features)
9. [Scenario-Based Guides](#9-scenario-based-guides)
10. [Tips & Best Practices](#10-tips--best-practices)
11. [Troubleshooting](#11-troubleshooting)
12. [Support](#12-support)

---

## 1. Introduction

### What is DMS Insight?

DMS Insight is a comprehensive electrical asset monitoring and predictive maintenance platform designed for industrial infrastructure. It provides:

- **Real-Time Diagnostics:** Monitor asset health with live data and instant alerts
- **Predictive Maintenance:** Reduce downtime with intelligent scheduling
- **Enterprise Security:** Bank-grade encryption for your critical data
- **Multi-Site Management:** Manage assets across multiple locations from one platform

### Key Features

✅ **Asset Health Monitoring** - Track health scores, performance metrics, and maintenance history  
✅ **Test Management** - Conduct and track diagnostic tests with customizable templates  
✅ **QR Code Integration** - Quick asset access via smartphone scanning  
✅ **Multi-Site Support** - Manage multiple facilities and locations  
✅ **Role-Based Access** - Secure access control for different user types  
✅ **Standardized Parameters** - Consistent data entry for better analytics  
✅ **Offline Capability** - Continue working even without internet connectivity

---

## 2. User Roles & Permissions

### Master Admin
**Full System Access**

**Capabilities:**
- ✅ Manage all companies, sites, and users
- ✅ Configure system-wide settings
- ✅ Manage parameter library for all asset types
- ✅ Access all reports and analytics
- ✅ Manage asset types and test templates

**Example User:** DMSInsight (System Administrator)

---

### Company Admin
**Company-Level Management**

**Capabilities:**
- ✅ Manage sites within their company
- ✅ Create and manage users
- ✅ Onboard new assets
- ✅ Customize company branding
- ✅ Edit asset details and nameplate information
- ✅ View all company-wide reports

**Example User:** JSWTest (JSW Company Admin)

---

### Field Engineer / Technician
**Operational Level**

**Capabilities:**
- ✅ Conduct tests on assigned assets
- ✅ View asset details and history
- ✅ Add maintenance notes
- ✅ Generate test reports
- ✅ Scan QR codes for quick access
- ❌ Cannot modify asset configurations
- ❌ Cannot access administrative features

---

## 3. Getting Started

### 3.1 Logging In

**Step 1:** Navigate to the DMS Insight login page

![Login Page](screenshots/manual_01_login.png)

**Step 2:** Enter your credentials
- **Username:** Your assigned username (e.g., DMSInsight, JSWTest)
- **Password:** Your secure password

**Step 3:** Click **"Sign In"**

**Security Note:** The platform uses secure authentication. Master Admin credentials are shown for reference only.

---

### 3.2 First Login Experience

After successful login, you'll be directed to the **Company-Wide Overview** page, which serves as your main dashboard.

---

## 4. Company-Wide Overview

The Company-Wide Overview is your central hub for navigating the platform.

![Company Overview](screenshots/manual_02_overview.png)

### Quick Access Cards

The overview page displays management cards organized by access level:

#### Master Admin Access Cards
- 🏢 **Companies** - Manage company accounts
- 🎨 **Company Branding** - Customize logo and brand colors
- 📋 **Report Templates** - Create and manage test report templates
- 📝 **Test Templates** - Manage global test templates
- 🔧 **Asset Types** - Manage asset type definitions
- 📚 **Parameter Library** - Manage standard nameplate parameters (Master Only)

#### Admin Access Cards
- 📍 **Site Management** - Manage your company's sites
- ➕ **Onboard Asset** - Add new assets to your sites
- 👥 **User Management** - Create and manage users
- 🎨 **Customize Templates** - Customize test templates for your company

![Overview Cards](screenshots/manual_03_overview_cards.png)

### Dashboard Metrics

At the bottom of the overview page, you'll find key metrics:

- **Total Sites:** Number of operational sites
- **Total Assets:** Combined assets across all sites
- **Avg Health Score:** Overall health status (/100)
- **Active Alerts:** Number of warnings requiring attention

---

## 5. Asset Management

### 5.1 Viewing Asset List

**Navigation:** Company Overview → Click on an asset type (e.g., "Transformer Equipment")

![Asset List](screenshots/manual_04_asset_list.png)

The asset list shows:
- Asset ID and Name
- Health Score (color-coded: Green = Healthy, Yellow = Warning, Red = Critical)
- Last Test Date
- Status (Operational, Maintenance, Critical)
- Location details

**Tip:** Use the search bar to quickly find specific assets.

---

### 5.2 Asset Detail Page

Click on any asset to view its detailed information.

![Asset Detail - Top](screenshots/manual_05_asset_detail_top.png)

#### Key Sections:

**1. Asset Header**
- Asset Name and ID
- Status Badge (Healthy, Warning, Critical)
- Asset Type
- Edit Photo button (Admin only)

**2. Health Score Card**
- Current health score out of 100
- Visual progress indicator
- Next test due date
- Last test date

**3. Quick Information Grid**
- View Nameplate details
- Access Asset QR Code
- Key specifications at a glance

**4. DMS Insight Assistant (Beta)**
- AI-powered assistant for asset queries
- Ask questions about asset health, maintenance, or diagnostics

---

### 5.3 Quick Actions

![Asset Detail - Actions](screenshots/manual_06_asset_detail_actions.png)

The right sidebar provides quick actions:

**Primary Actions:**
- 📋 **Conduct Test** - Start a new diagnostic test
- 📊 **View Analytics** - See performance trends and charts
- 📄 **View Reports** - Access historical test reports
- ⚠️ **View Alerts** - Check active warnings
- 🔧 **Schedule Maintenance** - Plan upcoming maintenance

**Additional Features:**
- 💬 **Quick Notes** - Add observations or maintenance notes
- 📝 **Maintenance History** - View all past maintenance activities

---

### 5.4 Performance Metrics

The asset detail page displays real-time performance metrics:

- **Efficiency:** Current operational efficiency percentage
- **Temperature:** Operating temperature with threshold indicator
- **Load Factor:** Current load vs rated capacity
- **Vibration Level:** Vibration measurements (important for rotating equipment)

---

## 6. Testing & Inspections

### 6.1 Conducting a Test

**Navigation:** Asset Detail Page → Click **"Conduct Test"**

![Conduct Test Page](screenshots/manual_08_conduct_test.png)

### Test Form Sections:

**1. Test Information**
- Test Date (auto-filled with current date)
- Test Type selection
- Tester Name (auto-filled from logged-in user)

**2. Test Parameters**
Configure test-specific parameters:
- Visual Inspection results
- Electrical measurements
- Performance readings
- Equipment used

**3. Test Equipment**
Record equipment used during testing:
- Equipment type
- Serial numbers
- Calibration status

**4. Observations & Notes**
- Document findings
- Record anomalies
- Add recommendations

**5. Submit Test**
Click **"Submit Test"** to save the test results. The system will:
- Calculate health score
- Generate alerts if thresholds are exceeded
- Update asset status
- Create test report

---

### 6.2 Asset-Specific Test Customization (Admin Feature)

Admins can customize test parameters for specific assets:
- Click the **customize icon** (⚙️) next to test parameters
- Modify parameters specific to that asset
- Customizations apply only to that asset instance
- Original template remains unchanged

**Use Case:** A transformer at a high-altitude location may need different test parameters than one at sea level.

---

## 7. QR Code Feature

### 7.1 Accessing Asset QR Code

**Navigation:** Asset Detail Page → Click **"Asset QR Code"** tile

![QR Code Dialog](screenshots/manual_07_qr_code_dialog.png)

### QR Code Dialog Features:

**Display Information:**
- Asset Name (e.g., "Transformer Unit 1")
- Scannable QR code
- Asset ID
- Instructions: "Scan to access asset details"

**Action Buttons:**
1. **Download** - Save QR code as PNG image for digital use
2. **Print** - Print formatted label with asset details
3. **Share** - Share via WhatsApp

**Helpful Tip:** 💡 Print and attach this QR code to the physical asset for quick access during inspections

---

### 7.2 Using QR Codes in the Field

**Field Engineer Workflow:**

1. **Find Asset:** Locate the physical asset with QR code sticker
2. **Scan QR Code:** Use smartphone camera (no special app needed)
3. **Instant Access:** Browser opens directly to asset detail page
4. **Take Action:** Conduct test, view history, or add notes

**Benefits:**
- ✅ No manual searching or typing
- ✅ Works with any smartphone camera
- ✅ Reduces data entry errors
- ✅ Faster response times

---

### 7.3 Printing QR Labels

**Steps to Print:**

1. Click **"Asset QR Code"** on asset detail page
2. Click **"Print"** button
3. Print dialog opens with formatted label containing:
   - Asset name
   - Asset ID
   - Asset type
   - QR code (optimized for scanning)
   - Instructions

4. Print on label paper or regular paper
5. Attach to physical asset using durable method

**Recommended:** Use weatherproof label material for outdoor assets.

---

## 8. Administrative Features

### 8.1 Parameter Library Management (Master Admin Only)

**Navigation:** Company Overview → **Parameter Library**

![Parameter Management](screenshots/manual_09_parameter_mgmt.png)

### Purpose:
Manage standardized nameplate parameters for all asset types to ensure data consistency across the organization.

**Why Manage Standard Parameters?**
Standard parameters ensure consistency across all assets, enabling powerful analytics, reporting, and comparisons. When users add nameplate details, they'll see these as recommendations.

---

### 8.2 Managing Parameters

**Select Asset Type:**
Choose from available asset types (Transformer, Switchgear, Motors, Generators, Cables, UPS)

**Parameter Information:**
- **Label:** Display name (e.g., "Primary Voltage")
- **Key:** Database field name (e.g., "primary_voltage")
- **Example:** Sample value (e.g., "66 kV")
- **Category:** Parameter grouping (Electrical, Mechanical, General)

**Actions:**
- ✏️ **Edit** - Modify parameter details
- 🗑️ **Delete (Deactivate)** - Soft-delete parameter (preserves historical data)

---

### 8.3 Inactive Parameters

![Parameter Management - Inactive](screenshots/manual_10_inactive_params.png)

**Show Inactive Parameters** checkbox allows viewing deactivated parameters.

**Inactive Parameters:**
- Displayed with reduced opacity
- Marked with red "Inactive" badge
- Hidden from nameplate recommendations
- Can be reactivated if needed

**Reactivate:** Click **"Reactivate"** button to restore an inactive parameter.

**Note:** Deleting (deactivating) a parameter does NOT remove it from existing assets - it only hides it from future recommendations.

---

### 8.4 Site Management

**Navigation:** Company Overview → **Site Management**

![Site Management](screenshots/manual_11_site_management.png)

### Site Cards Display:

Each site card shows:
- **Site Name** and location
- **Status Badge** (Healthy, Warning, Critical)
- **Total Assets** count
- **Site Incharge** contact information
- **Edit** and **Delete** actions

**Create New Site:**
Click **"+ Create New Site"** button to add a new facility.

**Required Information:**
- Site name
- Location
- Site incharge details
- Contact information

---

### 8.5 User Management

**Navigation:** Company Overview → **User Management**

**Capabilities:**
- Create new users
- Assign roles (Master Admin, Company Admin, Engineer)
- Assign site access
- Deactivate users
- Reset passwords

**Best Practice:** Assign users only the permissions they need for their role.

---

## 9. Scenario-Based Guides

### Scenario 1: Field Engineer Conducting Routine Test

**Context:** Engineer needs to perform monthly transformer testing

**Steps:**

1. **Arrive at Asset Location**
   - Scan QR code on transformer (instant access to asset page)

2. **Review Asset Status**
   - Check current health score
   - Review last test results
   - Note any active alerts

3. **Conduct Test**
   - Click **"Conduct Test"**
   - Fill in test parameters
   - Record measurements
   - Add observations

4. **Submit Results**
   - Click **"Submit Test"**
   - System calculates new health score
   - Alerts generated if needed

5. **Add Notes**
   - Use **Quick Notes** section
   - Document any observations

**Time Saved:** 5-10 minutes per asset using QR code direct access

---

### Scenario 2: Admin Onboarding New Assets

**Context:** New transformers installed at Manufacturing Plant A

**Steps:**

1. **Navigate to Site Overview**
   - Go to Company Overview
   - Click **"Onboard Asset"**

2. **Enter Asset Details**
   - Fill in basic information (Name, ID, Type)
   - Select site location
   - Upload asset photo

3. **Add Nameplate Details**
   - Click **"Edit Nameplate"** after creation
   - Use recommended parameters (from Parameter Library)
   - Fill in manufacturer specifications

4. **Generate QR Code**
   - Click **"Asset QR Code"**
   - Click **"Print"**
   - Print labels for physical assets

5. **Assign Access**
   - Update user permissions if needed
   - Notify field engineers of new assets

---

### Scenario 3: Master Admin Standardizing Parameters

**Context:** Organization wants consistent data entry for transformers

**Steps:**

1. **Access Parameter Library**
   - Go to Company Overview
   - Click **"Parameter Library"**

2. **Select Asset Type**
   - Click **"Transformer"** button

3. **Review Existing Parameters**
   - Check current standard parameters
   - Identify missing or inconsistent ones

4. **Add New Parameter**
   - Click **"+ Add Parameter"**
   - Enter Label: "Cooling Type"
   - Enter Key: "cooling_type"
   - Enter Example: "ONAN"
   - Select Category: "Mechanical"
   - Click **"Save"**

5. **Test Recommendation**
   - Go to any asset detail page
   - Click **"Edit Nameplate"**
   - Verify new parameter appears in recommendations

---

### Scenario 4: Handling Critical Alert

**Context:** Asset health score drops below threshold

**Steps:**

1. **Receive Alert Notification**
   - System flags asset as "Critical"
   - Alert appears on dashboard

2. **Navigate to Asset**
   - Click on alert or search for asset
   - View asset detail page

3. **Review Recent Changes**
   - Check last test results
   - Compare with historical data
   - Review performance metrics

4. **Take Action**
   - Click **"Schedule Maintenance"**
   - Select urgency level
   - Add notes about issue

5. **Notify Stakeholders**
   - Use notes to document findings
   - Coordinate with maintenance team

6. **Follow Up**
   - Conduct re-test after maintenance
   - Update asset status
   - Close alert when resolved

---

## 10. Tips & Best Practices

### For All Users

✅ **Regular Testing:** Conduct tests according to schedule to maintain accurate health scores

✅ **Use QR Codes:** Scan QR codes instead of manually searching for assets

✅ **Add Notes:** Document observations during inspections for better historical tracking

✅ **Check Alerts:** Review active alerts daily to catch issues early

✅ **Update Information:** Keep asset details and nameplate information current

---

### For Admins

✅ **Standardize Parameters:** Use Parameter Library to ensure consistent data entry

✅ **Regular Audits:** Review asset information quarterly for accuracy

✅ **User Training:** Ensure all users understand their roles and features available to them

✅ **QR Code Labels:** Print QR codes for all assets during onboarding

✅ **Site Organization:** Keep site information updated (incharge, contact details)

---

### For Field Engineers

✅ **Offline Preparation:** Download asset data before going to field locations with poor connectivity

✅ **Accurate Measurements:** Take time to record precise measurements for better analytics

✅ **Photo Documentation:** Upload photos of issues found during inspections

✅ **Timely Reporting:** Submit test results promptly after completion

✅ **Safety First:** Always follow safety protocols during testing

---

## 11. Troubleshooting

### Issue: Cannot Login

**Solutions:**
- Verify username and password
- Check CAPS LOCK is off
- Contact your administrator for password reset

---

### Issue: QR Code Not Scanning

**Solutions:**
- Ensure good lighting when scanning
- Clean camera lens
- Hold phone steady 6-8 inches from QR code
- Try different camera apps if needed

---

### Issue: Cannot Submit Test Results

**Solutions:**
- Check all required fields are filled
- Verify internet connectivity
- Try refreshing the page
- Contact support if issue persists

---

### Issue: Asset Not Appearing in List

**Solutions:**
- Verify you have access to the asset's site
- Check filters and search terms
- Clear browser cache
- Contact admin to verify asset assignment

---

## 12. Support

### Getting Help

**For Technical Issues:**
- Contact your system administrator
- Check this manual for guidance
- Review in-app tooltips and help text

**For Account Issues:**
- Contact Master Admin: DMSInsight
- Request password reset
- Verify access permissions

**For Feature Requests:**
- Submit feedback through your organization
- Discuss with Master Admin
- Document use cases for consideration

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + /` | Open search |
| `Esc` | Close dialog/modal |
| `Alt + H` | Go to home/overview |
| `Ctrl + S` | Save form (when applicable) |

---

## Appendix B: Glossary

**Asset:** Physical equipment being monitored (transformer, motor, generator, etc.)

**Health Score:** Calculated metric (0-100) representing asset condition

**Nameplate Details:** Manufacturer specifications and technical parameters

**Parameter Library:** Centralized database of standard parameters for consistency

**QR Code:** Quick Response code for instant asset access via smartphone

**Soft Delete:** Deactivation that preserves historical data

**Test Template:** Pre-configured test parameters for specific asset types

**Site:** Physical location or facility containing assets

---

## Document Information

**Version:** 1.0  
**Created:** December 2025  
**Platform:** DMS Insight™  
**Format:** User Manual with Screenshots  

**Copyright © 2025 DMS Insight. All rights reserved.**

---

**End of User Manual**

For the latest updates and additional resources, please contact your system administrator or visit your organization's internal documentation portal.
