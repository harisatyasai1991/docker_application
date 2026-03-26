# DMS Insight - Test Report System User Guide

## Accessing the Report System

### 1. **Report Templates Management**
**Who can access:** Admin users only

**How to access:**
- **From Site Overview Page:** 
  - Click the "Report Templates" button in the top-right header (next to Logout)
  - OR click "Manage Report Templates" in the blue info banner
- **Direct URL:** `/report-templates`

**What you can do:**
- Create new report templates with drag-drop designer
- Edit existing templates
- Delete templates
- Duplicate templates for quick copying
- View all templates by test type

---

### 2. **Generating Reports from Test Executions**
**Who can access:** Technicians and Admins

**How to access:**
1. Login with role `technician` or `admin`
2. Navigate to any asset → Click "Conduct Test"
3. Select a test from the catalog
4. Scroll down to see **"Completed Test Executions"** section
5. Click **"Generate Report"** button on any completed test

**Steps to generate:**
1. Select a report template from dropdown
2. Edit report title if needed
3. Click "Generate Report"
4. Report opens in viewer automatically

---

### 3. **Viewing Generated Reports**
**Who can access:** All users (field_engineer, technician, admin, viewer)

**How to access:**
1. Navigate to asset → Conduct Test page
2. Select a test from catalog
3. Scroll to **"Completed Test Executions"** section
4. Click **"View Report"** on tests that have reports generated

**What you can do in Report Viewer:**
- View full PDF preview
- Download PDF
- Print report
- Share via Email (mocked for demo)
- Share via WhatsApp
- All sharing actions are logged in database

---

## User Roles & Permissions

### Field Engineer
- ✅ Can conduct tests and submit readings
- ❌ Cannot generate reports
- ❌ Cannot share reports
- ✅ Can view generated reports

### Technician
- ✅ Can conduct tests and submit readings
- ✅ **Can generate reports**
- ✅ **Can share reports**
- ✅ Can view generated reports
- ❌ Cannot create/edit templates

### Admin
- ✅ Can conduct tests and submit readings
- ✅ **Can generate reports**
- ✅ **Can share reports**
- ✅ Can view generated reports
- ✅ **Can create/edit/delete templates**

### Viewer
- ❌ Cannot conduct tests
- ❌ Cannot generate reports
- ❌ Cannot share reports
- ✅ Can view generated reports (read-only)

---

## Quick Start Workflow

### For Admins (First Time Setup):
1. **Login** with role `admin`
2. **Go to Site Overview** → Click "Report Templates" button
3. **Create a template:**
   - Set template name and test type
   - Add elements:
     - Logo (upload company logo)
     - Text blocks (introduction, procedures, conclusions)
     - Dynamic fields (asset name, test date, conductor, etc.)
     - Tables (test readings)
   - Drag to reorder elements
   - Click "Save Template"

### For Technicians (Daily Use):
1. **Login** with role `technician`
2. **Conduct a test** (or use existing completed test)
3. **Navigate to test page** → Select the test
4. **Scroll down** to "Completed Test Executions"
5. **Click "Generate Report"**
6. **Select template** → Generate
7. **Download/Print/Share** the report

---

## Navigation Map

```
Site Overview (/)
├── Report Templates Button (Top-right, Admin only)
│   └── /report-templates
│       ├── Create Template
│       ├── Edit Template
│       ├── View Templates
│       └── Delete Template
│
└── Select Site → Dashboard → Asset Type → Asset
    └── Conduct Test (/assets/:type/:id/test)
        ├── Test Catalog (Left panel)
        ├── Completed Test Executions (Right panel, when test selected)
        │   ├── Generate Report (Technician/Admin only)
        │   └── View Report (All users)
        └── Report Viewer (Full-screen overlay)
            ├── Download PDF
            ├── Print PDF
            ├── Share via Email
            └── Share via WhatsApp
```

---

## Features Summary

### Report Template Designer
- **Drag-drop interface** for easy template building
- **4 element types:**
  - Logo: Upload and display company branding
  - Rich Text: Formatted text with headings, lists, alignment
  - Dynamic Fields: Auto-populate from test/asset data
  - Tables: Display test readings and measurements
- **Reorderable elements** with position indicators
- **Real-time preview** as you build
- **Multiple templates** per test type

### PDF Generation
- **Professional styling** with branded headers/footers
- **Dynamic data merging** from test executions
- **Multi-page support** with page numbers
- **Table rendering** from test readings
- **Handles missing data** gracefully

### Sharing & Collaboration
- **Email sharing:** Enter recipient email (mocked for demo)
- **WhatsApp sharing:** Opens WhatsApp Web with message
- **Share history:** All shares logged in database
- **Download:** Save PDF locally
- **Print:** Browser print dialog

---

## Tips & Best Practices

1. **Create General Templates First:** Start with a "General Test Report" template that works for all test types
2. **Use Dynamic Fields:** Leverage `{{asset_name}}`, `{{test_date}}` etc. to avoid manual entry
3. **Test Templates:** Generate a test report after creating template to verify layout
4. **Organize by Test Type:** Create specific templates for each test type for better relevance
5. **Include Branding:** Always add company logo in templates for professional reports

---

## Troubleshooting

### "No templates available"
- **Solution:** Admin needs to create at least one template for the test type first

### "No permission" message on Generate Report button
- **Solution:** Login with `technician` or `admin` role

### Can't see "Report Templates" button
- **Solution:** Login with `admin` role to access template management

### Report not generating
- **Check:** Ensure test execution is completed (status = 'completed')
- **Check:** Ensure template is selected in dialog
- **Check:** Verify backend is running (should be automatic)

---

## Support

For issues or questions:
- Check backend logs: `sudo supervisorctl tail -f backend`
- Check frontend logs: `sudo supervisorctl tail -f frontend`
- Verify services: `sudo supervisorctl status`
