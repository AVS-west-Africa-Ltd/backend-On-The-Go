# Staff Invitation Acceptance Form

## 📍 Location

`/Users/kachie/Desktop/backend-On-The-Go/public/staff-invite.html`

## 🎨 Features

### Beautiful Modern Design

- **Gradient Background**: Purple gradient (667eea → 764ba2)
- **Card-based Layout**: White container with rounded corners and shadow
- **Responsive Design**: Works perfectly on mobile and desktop
- **Smooth Animations**: Slide-up entrance animation

### User Experience

- **Auto-populated Information**: Displays email, branch name, and role from JWT token
- **Password Validation**: Real-time validation with visual feedback
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **Password Toggle**: Eye icon to show/hide password
- **Loading States**: Spinner and disabled button during submission
- **Error Handling**: Beautiful error messages with shake animation
- **Success Feedback**: Green success message on completion

### Form Fields

1. **First Name** (input)
2. **Last Name** (input)
3. **Password** (input with validation)

### Read-Only Display

- User Email (from token)
- Branch Name (from token)
- Role (from token)

## 🔧 How It Works

### 1. Token Decoding

The form automatically decodes the JWT token from the URL query parameter:

```
?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Display Information

Extracts and displays:

- `invite.email` → User Email
- `branch` → Branch ID
- `invite.role` → User Role

### 3. Form Submission

Sends POST request to:

```
POST http://localhost:5006/api/v1/auth/complete-invite
```

**Request Body:**

```json
{
  "token": "JWT_TOKEN_FROM_URL",
  "password": "UserPassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 4. Success Handling

- Stores auth token in localStorage
- Shows success message
- Redirects to dashboard after 2 seconds

## 🚀 Usage

### For Development

1. Open the file in a browser:

```bash
open /Users/kachie/Desktop/backend-On-The-Go/public/staff-invite.html?token=YOUR_JWT_TOKEN
```

### For Production

Update the `API_BASE_URL` in the script section:

```javascript
const API_BASE_URL = "https://api.onthego.africa/api/v1";
```

And update the redirect URL:

```javascript
window.location.href = "https://app.onthego.africa/dashboard";
```

## 🎯 Integration with Email

The invite link in your email should be:

```
http://localhost:3000/complete-invite?token=${inviteToken}
```

Or for production:

```
https://app.onthego.africa/complete-invite?token=${inviteToken}
```

## 📱 Responsive Breakpoints

- **Desktop**: Full width up to 480px
- **Mobile**: Removes border radius, adjusts padding

## 🎨 Color Scheme

- **Primary Blue**: #1C46FF
- **Primary Dark**: #0F3AD6
- **Background Gradient**: #667eea → #764ba2
- **Text Dark**: #0F172A
- **Text Medium**: #334155
- **Text Light**: #64748B
- **Success**: #10B981
- **Error**: #DC2626

## ⚙️ Configuration

### API Endpoint

```javascript
const API_BASE_URL = "http://localhost:5006/api/v1";
```

### Redirect URL

```javascript
window.location.href = "/dashboard";
```

## 🔒 Security Features

- JWT token validation
- Password strength requirements
- HTTPS ready (update URLs for production)
- No sensitive data in URL (only token)

## 📝 Notes

- The form is completely standalone (no dependencies)
- Works with your existing `/api/v1/auth/complete-invite` endpoint
- Matches the OnTheGo brand colors and design language
- Mobile-first responsive design
- Accessible with proper labels and ARIA attributes

## 🎬 Demo

To test the form:

1. Create a test invite via your API
2. Copy the generated token
3. Open: `public/staff-invite.html?token=YOUR_TOKEN`
4. Fill in the form and submit

The form will call your backend API and complete the registration!
