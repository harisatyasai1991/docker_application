# DMS Insight - Quick Start Guide

## 🚀 Get Started in 5 Minutes

---

## Step 1: Login as Master Admin

**Go to:** `http://localhost:3000/login` (or your deployed URL)

**Enter Credentials:**
- **Username:** `DMSInsight`
- **Password:** `Insight@CBM`

**Click:** Sign In

✅ You should see the Site Overview page with a "User Management" button

---

## Step 2: Access User Management

**Two ways to access:**

1. Click the **"User Management"** button in the top navigation
2. Or navigate directly to: `http://localhost:3000/users`

✅ You should see the User Management page with a table showing existing users

---

## Step 3: Create Your First User

1. Click the **"Create User"** button (top right)

2. Fill in the form:
   ```
   Username: john_doe
   Full Name: John Doe
   Email: john@example.com
   Phone: (optional)
   Role: Field Engineer
   Preset Password: Welcome123
   ```

3. Click **"Create User"**

✅ User created! They will be forced to change password on first login.

---

## Step 4: Test User Login Flow

1. **Logout** from admin account (click Logout button)

2. **Login** with new user:
   - Username: `john_doe`
   - Password: `Welcome123`

3. **Password Change Dialog** appears automatically
   - Cannot be closed
   - Enter current password: `Welcome123`
   - Enter new password: `NewPassword123`
   - Confirm new password: `NewPassword123`
   - Click "Change Password"

✅ User can now access the application!

---

## Common Tasks

### Create Multiple Users

Repeat Step 3 for each user. Suggested roles:

- **Admin:** Full access (use sparingly)
- **Technician:** Can generate reports
- **Field Engineer:** Can conduct tests
- **Viewer:** Read-only access

### Edit User Details

1. Find user in table
2. Click **Edit** icon (pencil)
3. Update details
4. Click "Update User"

### Reset User Password

1. Find user in table
2. Click **Key** icon
3. Enter new password
4. Click "Reset Password"
5. User must change it on next login

### Deactivate User

1. Find user in table
2. Click **Trash** icon
3. Confirm action
4. User cannot login anymore

---

## Troubleshooting

### "Failed to execute clone on response"

**Fixed!** If you still see this:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Or use incognito mode

### Cannot see User Management button

- Only **admin** users can see this button
- Make sure you're logged in as DMSInsight

### Login not working

1. Check username/password (case-sensitive)
2. Verify backend is running: `curl http://localhost:8001/health`
3. Check browser console for errors

---

## Security Reminders

✅ **DO:**
- Change master admin password before production
- Use strong passwords
- Deactivate users who leave
- Assign minimum required role

❌ **DON'T:**
- Share master admin credentials
- Use weak passwords
- Leave inactive users enabled
- Give admin access unnecessarily

---

## What's Next?

After creating users:

1. **Test the application** - Login as different roles
2. **Review permissions** - Ensure each role has correct access
3. **Deploy to production** - Follow DEPLOYMENT.md
4. **Train users** - Share USER_MANAGEMENT_GUIDE.md

---

## Need Help?

📖 **Full Documentation:**
- `/app/USER_MANAGEMENT_GUIDE.md` - Complete user management guide
- `/app/DEPLOYMENT.md` - Docker deployment instructions
- `/app/DATABASE_CONFIG.md` - Database configuration

🔧 **API Documentation:**
- Visit: `http://localhost:8001/docs`
- Interactive API documentation

📧 **Support:**
- Master Admin: vgoli@dmscbm.com

---

## Summary

✅ **Master Admin:** DMSInsight / Insight@CBM  
✅ **User Management:** Click button on Site Overview  
✅ **Create Users:** Set preset password, they change on first login  
✅ **Security:** Bcrypt hashing, forced password changes, role-based access  
✅ **Production Ready:** Deploy with confidence!

---

**Congratulations! Your DMS Insight application is ready to launch! 🎉**
