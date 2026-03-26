# Multi-Tenancy Architecture Guide

## Overview
The DMS Insight application now supports a multi-tenant architecture with three-tiered role-based access control: **Master**, **Admin**, and standard users (Technician, Field Engineer, Viewer).

## Role Hierarchy

### 1. Master User (Global Access)
- **Scope**: Global across all companies
- **Capabilities**:
  - Create and manage companies
  - Create users for any company
  - View and manage all data across all companies
  - Configure global templates and standards
  - No company_id assignment (operates at system level)
  
### 2. Admin User (Company-Scoped)
- **Scope**: Single company only
- **Capabilities**:
  - View users within their company
  - Cannot create new users (only Master can)
  - Manage company-specific resources (sites, assets, tests)
  - Edit company-specific SOPs and standards
  - Generate and share reports within company
  - Assigned to specific company_id

### 3. Standard Users (Company-Scoped)
- **Roles**: Technician, Field Engineer, Viewer
- **Scope**: Single company only
- **Capabilities**: Based on specific role permissions
- **Assigned to specific company_id**

## Database Schema

### Company Model
```javascript
{
  company_id: string (UUID),
  company_name: string,
  company_code: string (unique, e.g., "DMS", "ABC"),
  industry: string,
  contact_email: string,
  contact_phone: string,
  address: string,
  website: string,
  subscription_plan: "basic" | "premium" | "enterprise",
  max_users: number,
  max_assets: number,
  is_active: boolean,
  created_at: datetime,
  updated_at: datetime
}
```

### User Model (Updated)
```javascript
{
  user_id: string (UUID),
  username: string (unique),
  email: string (unique),
  full_name: string,
  role: "master" | "admin" | "technician" | "field_engineer" | "viewer",
  company_id: string (null for master, required for others),
  hashed_password: string,
  must_change_password: boolean,
  is_active: boolean,
  phone: string,
  created_by: string (user_id of creator),
  created_at: datetime,
  updated_at: datetime
}
```

### Site Model (Updated)
```javascript
{
  site_id: string (UUID),
  company_id: string (company ownership),
  site_name: string,
  location: string,
  region: string,
  // ... other fields
}
```

### Asset Model (Updated)
```javascript
{
  asset_id: string (UUID),
  company_id: string (inherited from site),
  site_id: string,
  asset_name: string,
  asset_type: string,
  // ... other fields
}
```

## API Endpoints

### Company Management (Master Only)
```
GET    /api/companies              # List all companies
GET    /api/companies/:id          # Get company details
POST   /api/companies              # Create new company
PUT    /api/companies/:id          # Update company
```

### User Management
```
GET    /api/users                  # List users (filtered by role)
                                   # ?role=admin&company_id=xyz&is_active=true
POST   /api/users                  # Create user (Master only)
PUT    /api/users/:id              # Update user
PUT    /api/users/:id/reset-password  # Reset password (Master only)
PUT    /api/users/:id/toggle-status   # Toggle active status
DELETE /api/users/:id              # Deactivate user
```

### Data Filtering
All data APIs support company_id filtering:
```
GET    /api/sites?company_id=xyz
GET    /api/assets?company_id=xyz
GET    /api/sites/stats/company?company_id=xyz
```

## Frontend Implementation

### Authorization Context
```javascript
// Check if user is master
const isMaster = () => currentUser?.role === 'master';

// Check if user is admin
const isAdmin = () => currentUser?.role === 'admin';

// Get user's company
const getUserCompany = () => currentUser?.company_id || null;

// Check permissions
hasPermission('create_users')  // Master only
hasPermission('view_company_users')  // Admin can view
hasPermission('manage_companies')  // Master only
```

### User Management Page
- **Master View**:
  - Can filter by company (dropdown shows all companies)
  - Company column visible in user list
  - Master users show "Global" badge
  - Can create users for any company or create master users
  - When creating non-master users, company selection is required
  - When creating master users, company field is hidden
  
- **Admin View**:
  - Automatically filtered to their company
  - Company filter hidden (only see their company)
  - Cannot create users (view-only access)
  - Company column still visible but always shows their company

### Company Management Page
- **Accessible by**: Master users only
- **Features**:
  - View all companies with details
  - Create new companies
  - Edit company information
  - View subscription details and limits
  - Track user/asset counts per company

### Navigation
- **Master User Header**:
  - Report Templates button
  - Company Management button (purple, with crown icon)
  - User Management button (blue, with crown icon)
  - Logout button

- **Admin User Header**:
  - Report Templates button (if has permission)
  - View Users button (blue, no crown icon)
  - Logout button

## Data Migration

A migration script (`backend/migrate_multitenant.py`) was created to:
1. Create a default company (DMS Corporation)
2. Update existing sites with company_id
3. Update existing assets with company_id
4. Update existing users with company_id (except master users)

## Master Admin Credentials
```
Username: DMSInsight
Password: Insight@CBM
Role: master
Company: null (global access)
```

## Creating a New Company

1. Login as master user
2. Navigate to Company Management
3. Click "Create Company"
4. Fill in required fields:
   - Company Name *
   - Company Code * (e.g., "ABC", "XYZ")
   - Industry
   - Contact details
   - Subscription plan
   - Max users and assets
5. Save

## Creating Users

### Creating Master User (Master only)
1. Navigate to User Management
2. Click "Create User"
3. Fill user details
4. Select Role: "Master"
5. **Company field disappears** (master users are global)
6. Set preset password
7. Save

### Creating Company User (Master only)
1. Navigate to User Management
2. Click "Create User"
3. Fill user details
4. Select Role: "Admin", "Technician", "Field Engineer", or "Viewer"
5. **Company dropdown appears**
6. Select company from dropdown
7. Set preset password
8. Save

### Password Management
- All new users must change password on first login
- Master can reset any user's password
- Users can change their own password

## Permission Matrix

| Permission | Master | Admin | Technician | Field Engineer | Viewer |
|-----------|--------|-------|------------|----------------|--------|
| Manage Companies | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Users | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Company Users | ✓ | ✓ | ✗ | ✗ | ✗ |
| Cross-Company Access | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Tests | ✓ | ✓ | ✓ | ✓ | ✓ |
| Conduct Tests | ✓ | ✓ | ✓ | ✓ | ✗ |
| Generate Reports | ✓ | ✓ | ✓ | ✗ | ✗ |
| Edit Templates | ✓ | ✓ | ✗ | ✗ | ✗ |

## Best Practices

### For Frontend Development
1. Always check user role before showing UI elements
2. Use `isMaster()` and `isAdmin()` helpers for conditional rendering
3. Pass company_id when fetching data for admin users
4. Show appropriate UI based on user scope (global vs company)

### For Backend Development
1. Always validate company_id relationships when creating resources
2. Filter queries by company_id for non-master users
3. Prevent cross-company data access for non-master users
4. Validate that master users cannot be assigned to companies

### For Database Operations
1. All new resources must include company_id (except master user records)
2. Maintain referential integrity (company must exist)
3. Use MongoDB indexes on company_id for performance

## Future Enhancements

1. **Company-Specific Customization**: Allow admins to customize test parameters, equipment lists, and standards for their company
2. **Company Templates**: Global templates (managed by master) that can be overridden at company level
3. **Usage Analytics**: Track user/asset usage per company for billing/reporting
4. **Company Branding**: Allow companies to customize logo, colors, and branding
5. **Inter-Company Sharing**: Optional sharing of best practices or templates between companies

## Troubleshooting

### Issue: User can't see any data
- **Check**: User's company_id matches the data's company_id
- **Check**: User has appropriate permissions for their role
- **Check**: User account is active

### Issue: Master user sees "Company" field when creating master user
- **Check**: Frontend logic to hide company field when role is "master"
- **Expected**: Company field should disappear when "Master" role is selected

### Issue: Admin user can create users
- **Check**: Backend validation prevents admins from creating users
- **Expected**: Only master users can create users

## Testing

Comprehensive frontend testing has been performed and all features verified:
✅ Master user login and authentication
✅ Company Management page access and CRUD operations
✅ User Management with company assignment
✅ Role-based company dropdown visibility
✅ Company filtering for master users
✅ Company information display in user lists
✅ Global vs company-scoped user distinction

For detailed testing results, see `/app/test_result.md`
