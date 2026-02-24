# Admin Management API - Postman Collection

This Postman collection provides complete documentation and testing capabilities for the Admin Management API.

## Overview

The Admin Management API allows Super Admins to manage administrative users within their business profile. It includes endpoints for:
- Creating and managing admin users
- Assigning roles and permissions
- Retrieving admin information
- Managing access control

## Collection Structure

### 1. Public Endpoints (No Authentication Required)
- **GET /admins/permissions** - Get all available permissions
- **GET /admins/roles** - Get all available roles

### 2. Admin CRUD Operations (Requires Authentication + MANAGE_STAFF Permission)
- **POST /admins/create** - Create a new admin user
- **GET /admins** - Get all admins (with optional branchId filter)
- **GET /admins/:id** - Get a specific admin by ID
- **PATCH /admins/:id** - Update admin details
- **DELETE /admins/:id** - Delete an admin (cannot delete SUPER_ADMIN)

### 3. Role & Permission Management (Requires Authentication + MANAGE_STAFF Permission)
- **PATCH /admins/:id/role** - Update an admin's role
- **PATCH /admins/:id/permissions** - Update an admin's permissions

### 4. Platform Admin Operations (Requires SUPER_ADMIN Role)
These endpoints allow global data retrieval across the platform and are mounted under `/platform-admin`.
- **GET /platform-admin/users** - Global user list
- **GET /platform-admin/businesses** - Global business list
- **GET /platform-admin/branches** - Global branch list
- **GET /platform-admin/products** - Global product list
- **GET /platform-admin/orders** - Global order list
- **GET /platform-admin/reviews** - Global review list
- **GET /platform-admin/posts** - Global post list
- **GET /platform-admin/communities** - Global community list
- **GET /platform-admin/insights** - Global insights list
- **GET /platform-admin/rewards** - Global rewards list
- **GET /platform-admin/vouchers** - Global vouchers list
- **GET /platform-admin/wifi-profiles** - Global wifi profiles
- **GET /platform-admin/wifi-tickets** - Global wifi tickets
- **GET /platform-admin/wifi-vouchers** - Global wifi vouchers
- **GET /platform-admin/settings** - Platform settings

## Setup Instructions

### 1. Import the Collection
1. Open Postman
2. Click "Import" button
3. Select `Admin_Management_API.postman_collection.json`
4. The collection will be imported with all endpoints and examples

### 2. Configure Variables
The collection uses the following variables:

- **baseUrl**: Base API URL (default: `http://localhost:3000/api`)
- **adminToken**: JWT token for authenticated requests

To set these:
1. Click on the collection name
2. Go to "Variables" tab
3. Update the "Current Value" for each variable

### 3. Authentication Flow

#### Step 1: Login as Admin
First, you need to authenticate and get a token with admin privileges. Use your existing auth endpoints:

```
POST {{baseUrl}}/auth/login
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

#### Step 2: Set Admin Token
Copy the token from the login response and set it as the `adminToken` variable.

**Note**: The token must contain admin information in its payload for protected routes to work.

## Available Roles

- **super_admin**: Full access to all features, bypasses permission checks
- **admin**: Standard admin with specific permissions

## Available Permissions

- **manage_staff**: Create, update, delete, and manage other admins
- **manage_products**: Manage product catalog
- **manage_orders**: Handle order processing
- **manage_branch**: Manage branch settings
- **view_insights**: Access analytics and insights
- **manage_amenities**: Manage branch amenities
- **manage_community**: Manage community features

## Request Examples

### Create Admin
```json
POST /admins/create
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "admin",
  "branchId": 1,
  "permissions": [
    "manage_products",
    "manage_orders"
  ]
}
```

### Update Permissions
```json
PATCH /admins/:id/permissions
{
  "permissions": [
    "manage_staff",
    "manage_products",
    "view_insights"
  ]
}
```

### Update Role
```json
PATCH /admins/:id/role
{
  "role": "super_admin"
}
```

## Response Format

All endpoints follow a consistent response format:

### Success Response
```json
{
  "message": "Operation successful message",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error description"
}
```

## Common Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data or business logic error
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions

## Security Notes

1. **Authentication Required**: All endpoints except `/permissions` and `/roles` require a valid JWT token
2. **Profile Context**: Admin operations are scoped to the authenticated user's profile
3. **Permission Checks**: Most operations require `MANAGE_STAFF` permission
4. **Super Admin Bypass**: Users with `SUPER_ADMIN` role bypass all permission checks
5. **Password Security**: Passwords are hashed using bcrypt before storage
6. **Protected Deletion**: Cannot delete SUPER_ADMIN users

## Testing Workflow

1. **Get Available Options**
   - Call `GET /admins/permissions` to see available permissions
   - Call `GET /admins/roles` to see available roles

2. **Create Test Admin**
   - Use `POST /admins/create` with sample data
   - Save the returned admin ID for subsequent tests

3. **Retrieve Admins**
   - Test `GET /admins` to list all admins
   - Test `GET /admins/:id` with the created admin ID

4. **Update Admin**
   - Test `PATCH /admins/:id` to update details
   - Test `PATCH /admins/:id/role` to change role
   - Test `PATCH /admins/:id/permissions` to modify permissions

5. **Delete Admin**
   - Test `DELETE /admins/:id` to remove the test admin

## Validation Rules

### Create Admin
- **name**: Required, string
- **email**: Required, valid email format, must be unique
- **password**: Required, minimum 6 characters
- **role**: Required, must be 'super_admin' or 'admin'
- **branchId**: Required, valid branch ID
- **permissions**: Optional, array of valid permission strings

### Update Admin
- **name**: Optional, string
- **email**: Optional, valid email format
- **password**: Optional, minimum 6 characters
- **branchId**: Optional, valid branch ID

### Update Role
- **role**: Required, must be 'super_admin' or 'admin'

### Update Permissions
- **permissions**: Required, array of valid permission strings

## Troubleshooting

### "Access denied. Admin only."
- Ensure your JWT token includes admin information
- The token should have been generated after admin creation

### "Access denied. Missing required permission: manage_staff"
- Your admin account needs the `MANAGE_STAFF` permission
- Or upgrade to `SUPER_ADMIN` role which bypasses all checks

### "Admin email already exists!"
- The email is already registered for another admin
- Use a different email address

### "Cannot delete a Super Admin!"
- Super Admin users cannot be deleted for security
- Change the role first, then delete

## Additional Resources

- Main API Documentation: `/docs`
- Authentication Guide: See auth endpoints
- Profile Management: See profile endpoints

## Support

For issues or questions:
1. Check the example responses in the collection
2. Review the validation rules above
3. Ensure proper authentication setup
4. Verify permission assignments
