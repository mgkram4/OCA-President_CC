Firebase setup and deployment (PowerShell)

Follow these steps on your machine — I cannot run them for you.

1) Install Node.js (LTS) if you don't have it: https://nodejs.org/en/download/

2) Install Firebase CLI globally (PowerShell):

```powershell
# Install or update the Firebase CLI
npm install -g firebase-tools
# Verify
firebase --version
```

3) Login to Firebase (will open browser for OAuth):

```powershell
firebase login
```

4) Initialize your project in the repository root (choose Firestore and Hosting if desired):

```powershell
cd "c:\Users\papay\Downloads\OCA-President_CC-main"
firebase init
```

- Select features: Firestore, Hosting (optional), Functions (optional)
- For Firestore choose the correct project when prompted
- For Hosting choose `public` folder or `.` and set as SPA if needed

5) Add your config to the app so `pages/firebase-init.js` finds it.

Option A (recommended for local/dev): create `pages/firebase-config.json` by copying `pages/firebase-config.json.example` and filling values.

Option B (runtime injection on your hosting): add a small script tag in your Hosting index that sets window.__OCA_FIREBASE_CONFIG to the object (safer than committing the file).

6) Deploy Firestore rules and Hosting (optional):

```powershell
# preview deploy
firebase deploy --only firestore:rules
# deploy hosting
firebase deploy --only hosting
# or everything
firebase deploy
```

7) Admin claims (server trusted operation)

To securely set a user's admin claim, use the Firebase Admin SDK on a trusted server. Example Node script. Create `set-admin.js` and run it with service account credentials.

`set-admin.js`:

```js
// Usage: node set-admin.js <uid>
const admin = require('firebase-admin');
const fs = require('fs');
const svc = JSON.parse(fs.readFileSync('./service-account.json','utf8'));
admin.initializeApp({ credential: admin.credential.cert(svc) });
const uid = process.argv[2];
if(!uid) { console.error('Usage: node set-admin.js <uid>'); process.exit(1); }
admin.auth().setCustomUserClaims(uid, { role: 'admin' }).then(()=>{
  console.log('Set admin claim for', uid);
  process.exit(0);
}).catch(err=>{ console.error(err); process.exit(1); });
```

- Create a service account in Firebase Console → Project Settings → Service accounts → Generate new private key and save as `service-account.json`.
- Run:
```powershell
node set-admin.js <uid>
```

8) Firestore rules suggestion (production)

Start with strict rules and use the Admin SDK on server-side to assign role claims. Example rule snippet:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        (request.auth.uid == uid && !(request.resource.data.role is string && request.resource.data.role != resource.data.role))
        || (request.auth.token.role == 'admin')
      );
      allow delete: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

If you'd like, I can create the `set-admin.js` file and a `pages/firebase-config.json.example` (already added) in the repo so you can run them locally. Let me know and I’ll add them.

9) Use the Firebase modular SDK from the CDN (no npm)

If you prefer not to use npm or a bundler, you can use the modular Firebase SDK directly from the Google CDN via ESM modules. This is fine for development and quick prototypes (not recommended for high-traffic production without optimization).

Steps:

- Add a small runtime config script before importing the module initializer. For example, in `index.html` just before the module script add:

```html
<script> 
  window.__OCA_FIREBASE_CONFIG = {
    apiKey: "AIzaSyBAlQb0coMcxhYU8LbiOCMs1NkhzbjMONI",
    authDomain: "oca67-af820.firebaseapp.com",
    projectId: "oca67-af820",
    storageBucket: "oca67-af820.firebasestorage.app",
    messagingSenderId: "1073280170075",
    appId: "1:1073280170075:web:5ffaa36865fbe662a7277e"
  };
</script>
```

- Then include the module initializer we added at `pages/firebase-init.module.js` (it will import the necessary SDK modules from the CDN and initialize Firebase):

```html
<script type="module">
  import { initFirebaseModule } from '/pages/firebase-init.module.js';
  // Optionally wait for initialization and access services
  initFirebaseModule().then(services => {
    if(!services) return;
    const { auth, db, modules } = services;
    // auth and db are ready to use
    console.log('Firebase services ready', auth, db);
  });
</script>
```

Notes:

- The module file uses the 12.4.0 CDN path and dynamic imports for `firebase-app`, `firebase-auth`, and `firebase-firestore`. If you need other SDKs (storage, functions), you can import their CDN modules in `pages/firebase-init.module.js` similarly.
- For older non-module pages you can still include the SDK via classic <script> tags (CDN) and use `pages/firebase-init.js` which expects the namespaced `firebase` global.
