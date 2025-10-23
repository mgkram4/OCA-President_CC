// Firebase initializer (safer/demo)
// Recommended approaches to provide config (choose one):
// 1) Add a script before firebase-init.js that sets `window.__OCA_FIREBASE_CONFIG = { ... }` using your project's config.
// 2) Create a `pages/firebase-config.json` file containing the config object (not recommended for public repos).
// 3) For production, inject config via server-side environment variables into a runtime-only file.
//
// This helper will try the above sources in order. It will NOT hard-code secret values in this file.

async function _loadRuntimeConfig(){
  if(window && window.__OCA_FIREBASE_CONFIG){
    return window.__OCA_FIREBASE_CONFIG
  }
  // try global FIREBASE_CONFIG
  if(window && window.FIREBASE_CONFIG){
    return window.FIREBASE_CONFIG
  }
  // try fetching a local JSON file (useful for local dev only)
  try{
    const res = await fetch('./firebase-config.json', {cache:'no-store'})
    if(res.ok){
      const cfg = await res.json()
      return cfg
    }
  }catch(e){ /* ignore */ }
  return null
}

async function initFirebase(){
  if(typeof firebase === 'undefined'){
    console.warn('Firebase SDK not loaded. Add the CDN scripts before calling initFirebase().')
    return null
  }
  try{
    if(!firebase.apps || firebase.apps.length === 0){
      const cfg = await _loadRuntimeConfig()
      if(!cfg){
        console.warn('No Firebase config found. To enable Firebase, set window.__OCA_FIREBASE_CONFIG or add pages/firebase-config.json')
        return firebase
      }
      firebase.initializeApp(cfg)
      console.log('Firebase initialized from runtime config')
    }
    return firebase
  }catch(e){
    console.error('Failed to init Firebase', e)
    return null
  }
}

// Small helper: ensure Firebase is initialized and return {auth, db}
async function getFirebaseServices(){
  const fb = await initFirebase()
  if(!fb) return null
  const auth = fb.auth()
  const db = fb.firestore()
  return {auth, db}
}
