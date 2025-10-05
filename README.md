# Portfolio Site with Firebase Backend

A modern, responsive portfolio/agency website built with HTML, CSS, and vanilla JavaScript. Features a full admin dashboard for managing content, works, skills, and notifications. All data is stored in Firebase Firestore, and images are linked via URLs.

## Features

### Public Site (index.html)
- Landing section with profile image, name, role, and description
- Works/Portfolio section with category filtering
- Skills section with animated progress bars
- Contact section with social links
- Real-time notification popup system
- Fully responsive design

### Admin Dashboard (admin.html)
- Secure email/password authentication
- Site settings management
- Works/portfolio CRUD operations
- Skills management
- Notification system with scheduling
- Footer and contact information management
- Image management via URL links

## Quick Setup (Easiest Method)

### Step 1: Enable Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.com/project/dagicreative-graphics/authentication)
2. Click on "Get Started" if not already enabled
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider

### Step 2: Set Up Firestore Database
1. Go to [Firestore Database](https://console.firebase.google.com/project/dagicreative-graphics/firestore)
2. Click "Create database"
3. Start in **production mode**
4. Choose your preferred location
5. Once created, go to "Rules" tab and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }

    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
  }
}
```

Click "Publish" to save the rules.

### Step 3: Create Your Admin Account
1. Run `npm install` and `npm run dev`
2. Open your browser and go to: `http://localhost:5173/setup-admin.html`
3. Enter your email, password, and name
4. Click "Create Admin Account"
5. After successful setup, **delete the setup-admin.html file** for security

### Step 4: Login to Admin Panel
1. Go to `http://localhost:5173/admin.html`
2. Login with your email and password
3. Start managing your portfolio!

## Detailed Setup Instructions

### 1. Firebase Project Setup

Your Firebase project is already configured with these credentials:
- Project: dagicreative-graphics
- Configuration is already set in `js/firebase-config.js`

You need to enable:
1. **Authentication**: Email/Password provider
2. **Firestore Database**: Create in production mode

### 2. Firestore Security Rules

Set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }

    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin();
    }
  }
}
```

### 3. Initialize Site Data (Optional)

Create a document in the `siteSettings` collection:

1. In Firestore, create a collection called `siteSettings`
2. Create a document with ID `main`
3. Add the following fields (all optional, can be updated via admin panel):
   - `name` (string): Your name
   - `roleText` (string): e.g., "I am a Graphics Designer"
   - `description` (string): Your bio
   - `profileImageUrl` (string): URL to profile image
   - `contact` (map):
     - `email` (string)
     - `phone` (string)
     - `address` (string)
   - `footerLinks` (array)
   - `socialLinks` (array)

### 4. Deploy to Firebase Hosting (Optional)

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

4. Build the project:
```bash
npm run build
```

5. Deploy:
```bash
firebase deploy --only hosting
```

## Firestore Collections Structure

### siteSettings (collection)
- **main** (document)
  - name, roleText, description
  - profileImageUrl
  - contact (map): email, phone, address
  - footerLinks (array): [{label, url}]
  - socialLinks (array): [{platform, url}]

### works (collection)
- **{workId}** (documents)
  - title, category, description
  - imageUrls (array)
  - projectUrl, visible, order

### skills (collection)
- **{skillId}** (documents)
  - name, percent, order

### notifications (collection)
- **{notificationId}** (documents)
  - message, ctaLabel, ctaUrl
  - active, startAt, endAt, createdAt

### admins (collection)
- **{uid}** (documents)
  - role, email, displayName

## Usage

### Admin Panel

1. Go to `/admin.html`
2. Login with your admin credentials
3. Use the sidebar to navigate between sections:
   - **Site Settings**: Update profile, name, role, description
   - **Works Manager**: Add/edit/delete portfolio items
   - **Skills Manager**: Add/edit/delete skills
   - **Notifications**: Create popup notifications
   - **Footer & Contact**: Manage contact info and links

### Notifications

Notifications appear as popup toasts on the main site:
- Admin can schedule start/end dates
- Users can dismiss notifications
- Dismissed state is stored in localStorage
- Real-time updates via Firestore listeners

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Firebase v9 (modular SDK)
  - Authentication
  - Firestore
  - Storage
- Vite (build tool)

## Browser Support

Modern browsers with ES6 support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Security Notes

- Admin access is controlled via the `admins` collection
- All writes require authentication and admin role
- Public reads are allowed for display purposes
- Images are uploaded to Firebase Storage with admin-only write access
- Never commit your Firebase config with real credentials to public repositories

## Troubleshooting

### Admin login not working
- Verify the user exists in Firebase Authentication
- Check that the user's UID exists in the `admins` collection with `role: "admin"`
- Review Firestore security rules

### Images not uploading
- Check Storage security rules
- Verify the Storage bucket is configured correctly
- Check browser console for errors

### Notifications not appearing
- Verify the notification is set to `active: true`
- Check that start/end dates (if set) are valid
- Clear localStorage if you dismissed the notification previously

## License

MIT License - feel free to use this project for personal or commercial purposes.
