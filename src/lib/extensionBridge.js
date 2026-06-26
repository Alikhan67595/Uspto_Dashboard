// src/lib/extensionBridge.js
//
// Yeh file standalone React website ko extension ke chrome.storage.local
// data se connect karti hai. Website apne aap chrome.storage access nahi
// kar sakti (woh sirf extension context mein available hota hai), is liye
// hum chrome.runtime.connect() ke zariye extension ke background.js se
// ek long-lived "port" banate hain — background.js us port par har baar
// data push kar deta hai jab chrome.storage.onChanged fire ho.
//
// SETUP (ek baar karna hai):
// 1. Extension load karo (chrome://extensions → Developer mode ON) aur
//    uska Extension ID copy karo (card ke neeche likha hota hai).
// 2. Neeche EXTENSION_ID variable mein wo ID paste karo.
// 3. Extension ke manifest.json mein "externally_connectable" add karo:
//
//      "externally_connectable": {
//        "matches": ["http://localhost:5173/*", "https://aap-ka-domain.com/*"]
//      }
//
//    (yeh us origin/URL ko whitelist karta hai jahan se React app chalegi)
// 4. Extension reload karo. Bas — ab website background.js se connect ho sakegi.

const EXTENSION_ID = 'agfenneigmlafkkjagglmogmkcnbklek';

let port = null;
let latestSnapshot = {};
const listeners = new Set();
// 'connecting' | 'connected' | 'disconnected' | 'unsupported'
let connectionStatus = 'connecting';

function notify() {
  listeners.forEach((cb) => cb(latestSnapshot, connectionStatus));
}

function connect() {
  const hasChromeRuntime =
    typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.connect;

  if (!hasChromeRuntime) {
    // Normal browsers/users without the extension installed (or non-Chromium
    // browsers) simply won't have window.chrome.runtime — dashboard should
    // still render, just with an "extension not connected" state.
    connectionStatus = 'unsupported';
    notify();
    return;
  }

  if (EXTENSION_ID === 'agfenneigmlafkkjagglmogmkcnbklek') {
    console.warn(
      '[extensionBridge] EXTENSION_ID set nahi kiya gaya — src/lib/extensionBridge.js mein apna extension ID daalein.'
    );
  }

  try {
    port = chrome.runtime.connect(EXTENSION_ID, { name: 'tm-leads-dashboard' });
  } catch (err) {
    connectionStatus = 'disconnected';
    notify();
    scheduleReconnect();
    return;
  }

  port.onMessage.addListener((msg) => {
    if (msg?.type === 'LEADS_SNAPSHOT') {
      latestSnapshot = msg.data || {};
      connectionStatus = 'connected';
      notify();
    }
  });

  port.onDisconnect.addListener(() => {
    // Chrome external ports disconnect agar extension ID galat ho, extension
    // uninstall/disabled ho, ya origin whitelist na ho — har case mein hum
    // silently retry karte rehte hain taake jab user extension theek kar de
    // to dashboard khud-ba-khud reconnect ho jaye.
    connectionStatus = 'disconnected';
    port = null;
    notify();
    scheduleReconnect();
  });

  port.postMessage({ type: 'REQUEST_SNAPSHOT' });
}

let reconnectTimer = null;
function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 3000);
}

connect();

export function subscribe(callback) {
  listeners.add(callback);
  callback(latestSnapshot, connectionStatus);
  return () => listeners.delete(callback);
}

export function getStatus() {
  return connectionStatus;
}

export function deleteLeads(type, subType, serials) {
  if (!port) return;
  port.postMessage({ type: 'DELETE_LEADS', payload: { type, subType, serials } });
}
