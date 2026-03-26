# DMS Insight - User Management System Guide

## 🎯 Overview

The DMS Insight application now has a complete production-ready user management system with secure authentication, role-based access control, and forced password changes on first login.

---

## 🔐 Master Admin Account

**Your master admin credentials:**
- **Username:** `DMSInsight`
- **Email:** `vgoli@dmscbm.com`
- **Password:** `Insight@CBM`
- **Role:** admin (full access to all features)

**Important:** This account does not require password change on login.

---

## 📋 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | • Manage all users<br>• Create/edit report templates<br>• Full access to all features |
| **Technician** | • Conduct tests<br>• Generate and share reports<br>• Submit test readings |
| **Field Engineer** | • Conduct tests<br>• Submit test readings only<br>• Cannot generate reports |
| **Viewer** | • Read-only access<br>• View all data but cannot modify |

---

## 🚀 Getting Started

### 1. Login as Master Admin

1. Go to: `http://your-domain.com/login` or `http://localhost:3000/login`
2. Enter username: `DMSInsight`
3. Enter password: `Insight@CBM`
4. Click **Sign In**

### 2. Access User Management

After logging in:
1. You'll see the **Site Overview** page
2. Click the **User Management** button in the top navigation
3. Or navigate to: `http://your-domain.com/users`

---

## 👥 Managing Users

### Create a New User

1. Click **Create User** button
2. Fill in the form:
   - **Username:** Unique username (cannot be changed later)
   - **Full Name:** User's full name
   - **Email:** Valid email address
   - **Phone:** Optional phone number
   - **Role:** Select from dropdown (Admin/Technician/Field Engineer/Viewer)
   - **Preset Password:** Set initial password (min 6 characters)
3. Click **Create User**

**Important:** The user will be **forced to change this password on first login**.

### Edit User Details

1. In the users table, click the **Edit** icon (pencil) next to a user
2. Update any of the following:
   - Full Name
   - Email
   - Phone
   - Role
3. Click **Update User**

**Note:** Username cannot be changed once created.

### Reset User Password

1. Click the **Key** icon next to a user
2. Enter a new password (min 6 characters)
3. Click **Reset Password**

**Important:** User will be required to change this password on their next login.

### Activate/Deactivate User

1. Click the **Toggle** icon next to a user
2. Green toggle = Active user
3. Gray toggle = Inactive user
4. Inactive users cannot log in

### Delete (Deactivate) User

1. Click the **Trash** icon next to an active user
2. Confirm the action
3. User will be deactivated (soft delete)

**Note:** Users are never permanently deleted from the database, only deactivated.

---

## 🔑 User Login Flow

### For New Users (First Login)

1. User receives username and preset password from admin
2. User goes to login page and enters credentials
3. System authenticates user
4. **Mandatory Password Change Dialog appears**
5. User MUST enter:
   - Current password (preset password)
   - New password
   - Confirm new password
6. User clicks **Change Password**
7. After successful change, user can access the application

**The dialog cannot be closed until password is changed.**

### For Existing Users

1. User enters username and password
2. System authenticates user
3. If password was reset by admin:
   - Mandatory password change dialog appears
   - User must change password before continuing
4. If password is already changed:
   - User logs in directly

### Change Password Anytime

Users can change their password at any time:
1. Navigate to profile/settings (if implemented)
2. Enter current password
3. Enter new password
4. Confirm new password
5. Click **Change Password**

---

## 🔍 Filtering Users

The User Management page includes filters:

1. **Filter by Role:**
   - All Roles
   - Admin
   - Technician
   - Field Engineer
   - Viewer

2. **Filter by Status:**
   - All Status
   - Active
   - Inactive

---

## 🎨 User Table Information

The users table displays:

| Column | Description |
|--------|-------------|
| Username | User's login username |
| Full Name | User's full name |
| Email | User's email address |
| Role | User's assigned role (with color-coded badge) |
| Status | Active/Inactive badge |
| Password Status | "Must Change" (orange) or "Changed" (green) |
| Actions | Edit, Reset Password, Toggle Status, Delete buttons |

---

## 🔒 Security Features

### ✅ Implemented Security

1. **Password Hashing:** All passwords stored using bcrypt (industry standard)
2. **No Plain Text:** Passwords never stored as plain text
3. **Forced Password Change:** New users must change password on first login
4. **Admin Password Reset:** Admin can reset any user's password
5. **Soft Delete:** Users deactivated, not deleted from database
6. **Role-Based Access:** Proper permission checking throughout app
7. **Secure Authentication:** Real backend authentication (not demo mode)

### 🔐 Best Practices

1. **Use Strong Passwords:**
   - Minimum 6 characters (enforced)
   - Recommend 12+ characters with mixed case, numbers, symbols

2. **Regular Password Changes:**
   - Encourage users to change passwords periodically
   - Admin can force password reset when needed

3. **Monitor Active Users:**
   - Deactivate accounts of former employees immediately
   - Review user list regularly

4. **Least Privilege Principle:**
   - Assign minimum role needed for job function
   - Field Engineers only need test submission access
   - Only give admin role to trusted personnel

---

## 🛠️ API Endpoints (for developers)

### Authentication

```bash
# Login
POST /api/auth/login
Body: {"username": "DMSInsight", "password": "Insight@CBM"}

# Change Password
POST /api/auth/change-password?user_id={user_id}
Body: {"old_password": "current", "new_password": "new"}
```

### User Management (Admin Only)

```bash
# List all users
GET /api/users
GET /api/users?role=admin
GET /api/users?is_active=true

# Get specific user
GET /api/users/{user_id}

# Create user
POST /api/users
Body: {
  "username": "newuser",
  "email": "user@example.com",
  "full_name": "New User",
  "role": "field_engineer",
  "phone": "1234567890",
  "password": "preset123"
}

# Update user
PUT /api/users/{user_id}
Body: {
  "email": "newemail@example.com",
  "full_name": "Updated Name",
  "role": "technician",
  "phone": "9876543210"
}

# Reset password
PUT /api/users/{user_id}/reset-password
Body: {"new_password": "newpassword123"}

# Toggle user status
PUT /api/users/{user_id}/toggle-status

# Delete (deactivate) user
DELETE /api/users/{user_id}
```

---

## 📊 Database Structure

Users are stored in the `users` collection with this structure:

```json
{
  "user_id": "uuid",
  "username": "DMSInsight",
  "email": "vgoli@dmscbm.com",
  "full_name": "DMS Insight Master Admin",
  "role": "admin",
  "phone": null,
  "hashed_password": "bcrypt_hash_here",
  "must_change_password": false,
  "is_active": true,
  "created_by": null,
  "created_at": "2025-12-12T...",
  "updated_at": "2025-12-12T..."
}
```

---

## 🐛 Troubleshooting

### Login Issues

**Problem:** Cannot login with master admin credentials
**Solution:**
1. Verify username is exactly: `DMSInsight` (case-sensitive)
2. Verify password is exactly: `Insight@CBM`
3. Check backend is running: `curl http://localhost:8001/health`
4. Check browser console for errors

**Problem:** User Management page not visible
**Solution:**
1. Ensure logged in as admin role
2. Only admin users can see User Management button
3. Try navigating directly to `/users`

### Password Change Issues

**Problem:** Password change fails
**Solution:**
1. Ensure old password is correct
2. New password must be at least 6 characters
3. New password must be different from old password
4. Confirm passwords match

### User Creation Issues

**Problem:** Cannot create user - "Username already exists"
**Solution:**
1. Choose a different username
2. Usernames must be unique across all users

**Problem:** Cannot create user - "Email already exists"
**Solution:**
1. Use a different email address
2. Check if user already exists with that email

---

## 📝 Common Tasks

### Task 1: Create Multiple Users

For onboarding multiple users:

1. Prepare a list of users with:
   - Username
   - Full Name
   - Email
   - Role
   - Preset Password

2. Login as admin

3. For each user:
   - Click **Create User**
   - Fill in details
   - Use same preset password for all (e.g., "Welcome123")
   - They'll change it on first login

4. Share credentials with users via secure channel

### Task 2: Offboard User

When an employee leaves:

1. Login as admin
2. Go to User Management
3. Find the user
4. Click **Deactivate** (trash icon)
5. Confirm action

User cannot login but their data remains in database.

### Task 3: Reset Forgotten Password

When user forgets password:

1. Login as admin
2. Go to User Management
3. Find the user
4. Click **Reset Password** (key icon)
5. Enter new temporary password
6. Share with user via secure channel
7. User must change it on next login

### Task 4: Change User Role

To promote/demote a user:

1. Login as admin
2. Go to User Management
3. Find the user
4. Click **Edit** (pencil icon)
5. Select new role from dropdown
6. Click **Update User**

---

## 🎓 Training New Admins

When training new administrators:

1. **Create admin account** for them with preset password
2. **Have them login** and change password
3. **Show User Management page** and explain features
4. **Demonstrate:**
   - Creating test user
   - Editing user
   - Resetting password
   - Deactivating user
5. **Explain roles and permissions**
6. **Review security best practices**

---

## 📞 Support

For issues or questions:
- **Email:** vgoli@dmscbm.com
- **Master Admin:** DMSInsight

---

## 🔄 Next Steps (Optional Enhancements)

Future improvements you might want to consider:

1. **Password Expiry:** Force password change every 90 days
2. **Password Complexity:** Require numbers, special characters
3. **Login Attempts:** Lock account after failed attempts
4. **Session Timeout:** Auto-logout after inactivity
5. **Audit Log:** Track all user management actions
6. **Email Notifications:** Send welcome emails to new users
7. **Two-Factor Authentication:** Additional security layer
8. **Password Recovery:** Self-service password reset via email
9. **User Profile Page:** Let users update their own info
10. **Activity Tracking:** Show last login time for each user

---

## ✅ Quick Reference

**Master Admin Login:**
- Username: `DMSInsight`
- Password: `Insight@CBM`

**Access User Management:**
- Click **User Management** button on Site Overview page
- Or go to: `/users`

**Create User:**
- User Management → **Create User** button

**First Login:**
- User MUST change password before accessing app

**Reset Password:**
- Click **Key icon** → Enter new password → User must change on next login

**Security Note:**
- All passwords stored as bcrypt hashes
- Never share passwords via insecure channels
- Change master admin password in production

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Application:** DMS Insight  
**Master Admin:** DMSInsight
