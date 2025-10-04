# Portfolio Site with Firebase Backend

A modern, responsive portfolio/agency website built with HTML, CSS, and vanilla JavaScript. Features a full admin dashboard for managing content, works, skills, and notifications. All data is stored in Firebase Firestore, and images are hosted on Firebase Storage.

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
- Image uploads to Firebase Storage

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable the following services:
   - **Authentication**: Email/Password provider
   - **Firestore Database**: Create in production mode
   - **Storage**: Create a default bucket

### 2. Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Under "Your apps", click the web icon (</>)
3. Register your app and copy the Firebase configuration
4. Open `js/firebase-config.js` and replace the placeholder values:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firestore Security Rules

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

### 4. Storage Security Rules

Set up Storage security rules in Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null &&
             firestore.get(/databases/(default)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }

    match /{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### 5. Create Admin User

You need to manually create your first admin user:

1. In Firebase Console, go to Authentication
2. Create a new user with email/password
3. Copy the user's UID
4. Go to Firestore Database
5. Create a collection called `admins`
6. Create a document with the UID as the document ID
7. Add the following fields:
   - `role` (string): "admin"
   - `email` (string): the user's email
   - `displayName` (string): your name

### 6. Initialize Site Data

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

### 7. Install Dependencies and Run

```bash
npm install
npm run dev
```

The site will be available at `http://localhost:5173`
The admin panel will be at `http://localhost:5173/admin.html`

### 8. Deploy to Firebase Hosting (Optional)

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
