// Firebase initializer (ES module, CDN, no npm required)
// Use by adding a small runtime config script then importing this module
// Example in HTML:
// <script>
//   window.__OCA_FIREBASE_CONFIG = { apiKey: '...', authDomain: '...', projectId: '...', storageBucket: '...', messagingSenderId: '...', appId: '...' };
// </script>
// <script type="module" src="/pages/firebase-init.module.js"></script>

const CDN_BASE = 'https://www.gstatic.com/firebasejs/12.4.0';
let _initialized = false;
let _app = null;
let _auth = null;
let _db = null;
let _modules = null;

async function _loadRuntimeConfig(){
  if(typeof window !== 'undefined'){
    if(window && window.__OCA_FIREBASE_CONFIG) return window.__OCA_FIREBASE_CONFIG;
    if(window && window.FIREBASE_CONFIG) return window.FIREBASE_CONFIG;
  }
  try{
    const res = await fetch('./pages/firebase-config.json', {cache:'no-store'});
    if(res.ok){
      return await res.json();
    }
  }catch(e){ /* ignore */ }
  try{
    const res2 = await fetch('./firebase-config.json', {cache:'no-store'});
    if(res2.ok) return await res2.json();
  }catch(e){ /* ignore */ }
  return null;
}

export async function isFirebaseConfigured(){
  const cfg = await _loadRuntimeConfig();
  return !!cfg;
}

// Initialize Firebase using modular SDK from CDN. Returns {app, auth, db, modules}
export async function initFirebaseModule(){
  if(_initialized) return {app:_app, auth:_auth, db:_db, modules:_modules};

  const cfg = await _loadRuntimeConfig();
  if(!cfg){
    console.warn('No Firebase config found. Set window.__OCA_FIREBASE_CONFIG or create pages/firebase-config.json');
    return null;
  }

  try{
    // Dynamic imports of modular SDKs
    const appMod = await import(`${CDN_BASE}/firebase-app.js`);
    const authMod = await import(`${CDN_BASE}/firebase-auth.js`);
    const firestoreMod = await import(`${CDN_BASE}/firebase-firestore.js`);
    console.log('Firebase config loaded:', cfg);

    _app = appMod.initializeApp(cfg);
    _auth = authMod.getAuth(_app);
    _db = firestoreMod.getFirestore(_app);
    _modules = { app: appMod, auth: authMod, firestore: firestoreMod };
    _initialized = true;
    console.log('Firebase (modular) initialized from runtime config');
    return {app:_app, auth:_auth, db:_db, modules:_modules};
  }catch(err){
    console.error('Failed to initialize Firebase (modular):', err);
    return null;
  }
}

export async function getFirebaseServicesModule(){
  return await initFirebaseModule();
}

// Attach to window for non-module callers (optional)
if(typeof window !== 'undefined'){
  window.initFirebaseModule = initFirebaseModule;
  window.getFirebaseServicesModule = getFirebaseServicesModule;
}
