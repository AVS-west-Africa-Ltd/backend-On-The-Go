# Backend On-The-Go API - Full Postman Collection

This Postman collection gathers all API endpoints for the Backend On-The-Go project into a single, organized file.

## Collection Overview

The collection is divided into modules corresponding to the application's architecture:

1.  **Auth**: Authentication endpoints (Register, Login, Password Reset, etc.).
2.  **Profile**: User and Business profile management.
3.  **App**: Main application features like Posts, Chats, Feeds.
4.  **Community**: Community creation and management.
5.  **Branch**: Business branch management.
6.  **Product**: Product catalog management.
7.  **Orders**: Ordering system endpoints.
8.  **Bookmarks**: User bookmarking features.
9.  **Amenities**: Amenity listing and management.
10. **Admin**: Administrative management (requires Admin privileges).

## Getting Started

### 1. Import
Import `Backend_On_The_Go_Full_Collection.postman_collection.json` into Postman.

### 2. Configure Variables
The collection uses the following variables (Collection Variables):

-   **baseUrl**: The base URL of your API (default: `http://localhost:3000/api`).
-   **token**: The JWT token for standard user/profile operations.
-   **adminToken**: The JWT token for admin-specific operations.

### 3. Authentication Flow

**For Regular Users/Businesses:**
1.  Run `Auth / Register` to create a new account.
2.  Run `Auth / Login` with your credentials.
3.  Copy the `token` from the login response.
4.  Update the `token` variable in the Collection Variables settings.

**For Admins:**
1.  Login as an admin user (via `Auth / Login` or a specific admin login if implemented separately, though typically admin users use the same auth flow but have admin rights).
2.  Copy the token.
3.  Update the `adminToken` variable.

## Module Details

### Auth
-   Standard public endpoints.
-   `verify-email` and `reset-password` require tokens received via email (simulated or retrieved from logs/db in dev).

### Profile
-   Most endpoints require `Authorization: Bearer {{token}}`.
-   `Create Profile` and `Update Profile` use `multipart/form-data` for image uploads.

### App
-   Features for social interaction (Posts, Comments, Reactions).
-   `Create Post` supports media uploads.

### Branch, Product, Orders
-   Business-centric features.
-   Use `Create Branch` to set up a location.
-   Use `Create Product` to add items to a branch.

### Admin
-   Protected routes for managing the system/staff.
-   See `ADMIN_API_README.md` for specific Admin API details.

## Troubleshooting

-   **401 Unauthorized**: Ensure your `token` variable is set and valid.
-   **403 Forbidden**: You might not have the correct profile type or permissions (e.g., trying to create a branch without a business profile).
-   **400 Bad Request**: Check the Body tab. Many endpoints require specific JSON structures or Form Data fields.
