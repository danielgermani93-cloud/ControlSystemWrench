# CLAUDE.md — Control System Wrench

This file provides context for AI assistants working on this codebase.

## Project Overview

**Control System Wrench** is a single-page web application (PWA) for managing equipment loans and returns. It is primarily used in Italian-language operational environments. The app allows operators to log equipment pickups, record returns with photo documentation, and gives administrators real-time alerts for overdue items.

- **Author**: Germani Daniel
- **Language**: Italian (UI labels, comments, variable names)
- **Type**: Progressive Web App (PWA), no build step required
- **Firebase Project**: `control-wrench`

## Repository Structure

```
ControlSystemWrench/
├── index.html                  # Entire application: HTML + CSS + JS (~1762 lines)
├── manifest.json               # PWA manifest (app name, icons, theme colors)
├── firebase-messaging-sw.js    # Service worker for Firebase background push notifications
└── CLAUDE.md                   # This file
```

All application logic, styling, and markup live in a single `index.html` file. There is no build system, no package manager, and no separate source files.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 |
| Styling | CSS3 (custom, no framework) |
| Logic | Vanilla JavaScript (ES6+) |
| Database | Firebase Firestore |
| File Storage | Firebase Storage (return photos) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Email | EmailJS (free tier, 200 emails/month) |
| Firebase SDK | v9.22.0 (compat mode, loaded via CDN) |
| EmailJS SDK | v3 (loaded via CDN) |

## index.html Architecture

The file is organized into three sections:

### 1. CSS (lines 1–605)
- Global resets and base styles
- Header, navigation, card, and form components
- Tab system (active/inactive states)
- Status badges: `in-uso`, `restituita`, `scaduta`
- Animation keyframes: `fadeIn`, `pulse`, `slideDown`, `slideIn`
- Responsive/mobile-first layout using flexbox and grid
- PWA fullscreen styles and iOS safe-area handling

### 2. HTML Markup (lines 607–843)
Sections wrapped in `<div id="...">`:

| Section | ID | Description |
|---------|----|-------------|
| Login gate | `loginSection` | Password form shown before app loads |
| Main app | `mainApp` | Hidden until login, contains all tabs |
| New loan tab | `tab-nuovo` | Form to register equipment pickup |
| Return tab | `tab-riconsegna` | Card list + photo capture for returns |
| Equipment list tab | `tab-lista` | Filterable list of all equipment |
| Admin tab | `tab-admin` | Business hours, email config, alerts |
| Notification panel | `notificationPanel` | Slide-in panel with notification history |
| Alert banner | `alertBanner` | Transient in-app notification bar |

### 3. JavaScript (lines 858–1760)

#### Global State Variables
```javascript
let currentFilter = 'tutti';    // Active list filter
let selectedItemId = null;      // ID of equipment selected for return
let capturedPhoto = null;       // Base64 photo from camera
let isAdmin = false;            // Admin mode flag
let notifications = [];         // In-memory notification list
let settings = { ... };        // Loaded from Firestore on login
const isIOS = ...;              // Platform detection
const isSafari = ...;           // Browser detection
```

#### Key Functions

| Function | Purpose |
|----------|---------|
| `login()` | Password check, sets `isAdmin`, bootstraps app |
| `switchTab(tabName)` | Tab navigation, triggers data reload per tab |
| `loadAttrezzature()` | Loads equipment list from Firestore with filter |
| `loadAttrezzaturaSelect()` | Loads in-use items for return selection |
| `selezionaAttrezzatura(id)` | Selects equipment card for return |
| `completaRiconsegna()` | Processes return: upload photo, update Firestore, notify |
| `annullaRiconsegna()` | Cancels pending return |
| `inviaNotifica(tipo, data)` | Dispatches notification via all channels |
| `inviaEmail(tipo, data)` | Sends email via EmailJS |
| `checkAlerts()` | Scans for overdue equipment, shows admin alerts |
| `checkIfScaduto(item)` | Returns true if item is past return time |
| `loadSettings()` | Reads settings document from Firestore |
| `salvaImpostazioniOrari()` | Persists business hours to Firestore |
| `salvaImpostazioniEmail()` | Persists email config to Firestore |
| `resetDatabase()` | Deletes all equipment and notification documents |
| `listenToChanges()` | Sets up real-time Firestore listeners |
| `formatDate(ts)` | Italian date formatting |
| `formatDateTime(ts)` | Italian date+time formatting |
| `richiediPermessoNotifiche()` | Requests browser push permission |
| `updateBadgeScaduti()` | Updates overdue item count badge |
| `updateNotificationBadge()` | Updates notification count badge |
| `updateNotificationPanel()` | Re-renders notification list HTML |
| `showAlertBanner(msg, ms)` | Shows transient top-of-screen alert |
| `toggleNotifications()` | Opens/closes notification panel |

## Firebase Firestore Collections

| Collection | Documents | Key Fields |
|------------|-----------|-----------|
| `attrezzature` | One per equipment item | `nomeAttrezzatura`, `luogo`, `operatore`, `dataPrelievo`, `dataRiconsegna`, `note`, `stato` (`in-uso`/`restituita`), `fotoRiconsegna` (Storage URL), `timestampRiconsegna` |
| `notifiche` | One per notification event | `tipo`, `titolo`, `messaggio`, `timestamp`, `data` |
| `settings` | Single document `impostazioni` | `orarioInizio`, `orarioFine`, `emailAdmin`, `emailAbilitato` |

## Notification System

Notifications are sent through up to four channels simultaneously:

1. **Firestore** — persisted to `notifiche` collection (all devices)
2. **In-app banner** — `showAlertBanner()` (all devices)
3. **Email** — via EmailJS (all devices, including iOS)
4. **Push notification** — `new Notification(...)` only on non-iOS devices where `Notification.permission === 'granted'`

Background push (when app is closed) is handled by `firebase-messaging-sw.js`.

## Authentication

- Single hardcoded admin password: `admin123` (line 903)
- No server-side auth; `isAdmin` is a client-side boolean
- Admin mode reveals the Admin tab and enables push notification requests
- All users (admin or not) can register loans and returns after entering the password

> **Security note**: The password check is entirely client-side. Do not store sensitive data or credentials in this application without adding proper server-side authentication.

## Configuration

### Firebase Credentials
Credentials are embedded directly in `index.html` (lines 860–867) and `firebase-messaging-sw.js` (lines 6–13). The current values in the repo are **placeholders**. Replace them with real Firebase project credentials before deployment:

```javascript
const firebaseConfig = {
    apiKey: "...",
    authDomain: "control-wrench.firebaseapp.com",
    projectId: "control-wrench",
    storageBucket: "control-wrench.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};
```

Both files must use the **same** `firebaseConfig` object.

### EmailJS
Replace the placeholder in `index.html` line 898:
```javascript
emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");
```
EmailJS service ID and template IDs are referenced inside `inviaEmail()`.

### Default Settings
On first load (before saving via Admin panel), the app uses:
```javascript
orarioInizio: '08:00'   // Business hours start
orarioFine: '18:00'     // Business hours end
emailAdmin: ''           // Admin email for alerts
emailAbilitato: true    // Email notifications on
```
Settings are persisted to Firestore under `settings/impostazioni`.

## Running the Application

No build step is needed. Serve the directory over HTTP:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx http-server . -p 8080
```

Then open `http://localhost:8080` in a browser.

**PWA and push notifications require HTTPS** in production. Use a hosting provider that serves over HTTPS (Firebase Hosting, Netlify, Vercel, etc.) or configure a local SSL proxy for development.

## Platform Behavior

| Feature | Android/Desktop | iOS (Safari) |
|---------|----------------|--------------|
| Push notifications | Yes | No (Safari restriction) |
| Email notifications | Yes | Yes |
| In-app banner | Yes | Yes |
| Camera capture | Yes | Yes |
| PWA install | Yes | Yes (Add to Home Screen) |

## Code Conventions

- **Language**: All user-facing strings, comments, and most identifiers are in **Italian**.
- **No framework**: Pure DOM manipulation with `document.getElementById()` and `innerHTML`.
- **Async pattern**: `async/await` with `try/catch` blocks for Firebase and EmailJS calls.
- **Inline HTML generation**: Dynamic content is built by concatenating template literal strings into `.innerHTML`.
- **No modules**: Everything is in global scope inside a `<script>` tag.
- **CSS class toggling**: State changes use `classList.add/remove/toggle` (e.g., `.show`, `.active`, `.admin-mode`).

## Development Workflow

### Making Changes
Since the entire app is in `index.html`, all feature work happens in that single file. The logical sections are clearly separated by comments in Italian (e.g., `// Login`, `// Switch tra tabs`, `// Invia notifica`).

### Testing
There is no automated test suite. Test changes manually in a browser with the browser DevTools console open. Key things to verify:
- Firestore reads/writes (check the Network tab or Firebase console)
- Notification delivery across channels
- Mobile layout on iOS and Android (use DevTools device emulation)
- Camera capture flow on mobile

### Git Branch
Development for AI-assisted changes should happen on:
```
claude/add-claude-documentation-cy9Ge
```

### Deployment Checklist
1. Replace placeholder Firebase credentials in both `index.html` and `firebase-messaging-sw.js`
2. Set `emailjs.init(...)` with the real EmailJS public key
3. Update EmailJS service/template IDs in `inviaEmail()`
4. Change the admin password from `admin123` to something secure (or implement proper auth)
5. Serve over HTTPS

## Key Constraints and Gotchas

- **Single file**: All changes to UI, logic, or styles are in `index.html`. Keep sections organized using the existing comment structure.
- **No transpilation**: Code must be compatible with the target browsers without a build step. Avoid syntax that requires transpilation (e.g., do not introduce TypeScript or JSX).
- **Firebase SDK version**: The app uses Firebase SDK **9.22.0 in compat mode**. Do not mix with the modular (v9 tree-shakeable) API — the compat API uses `firebase.firestore()` style calls, not `import { getFirestore }`.
- **iOS push limitations**: Push notifications via `new Notification()` are deliberately skipped on iOS. Email is the fallback for iOS users.
- **`resetDatabase()`**: This function deletes all equipment and notification data. It is behind the Admin tab but has no secondary confirmation beyond a `window.confirm()` dialog. Be cautious when testing near this function.
- **Photo storage**: Return photos are uploaded to Firebase Storage as base64 data URLs. Large photos can be expensive on the free tier — advise users to use lower camera resolution if storage costs are a concern.
