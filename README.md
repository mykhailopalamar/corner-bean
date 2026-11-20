# Corner Bean Coffee

A responsive landing page for a fictional coffee shop, with an admin panel where the owner edits the site without touching code. Menu items, announcements and opening hours are stored in a Firebase database and update live for every visitor. The contact form delivers messages straight to the owner's email.

**Live demo:** https://mykhailopalamar.github.io/corner-bean/

> Portfolio project. The business, address and prices are made up.

## Features

**Public site**
- Sticky header with smooth-scroll navigation, hero, menu, about and visit sections
- Menu, opening hours and announcement banner load from the database and update in real time, with no page reload
- Contact form with client-side validation that sends messages to the owner's email
- Responsive layout, from phone width up to desktop

**Admin panel** (`admin.html`, owner login)
- Add and delete menu items
- Publish and delete announcements shown at the top of the site
- Edit opening hours (up to 7 lines of free text)
- Email and password sign-in through Firebase Authentication

## Tech stack

- HTML, CSS and vanilla JavaScript (ES modules), with no frameworks and no build step
- Firebase Firestore (database) and Firebase Authentication
- Web3Forms (contact form to email, no backend needed)
- GitHub Pages (hosting)

## How it works

- `index.html` reads the `menu`, `announcements` and `settings` collections from Firestore and re-renders when they change.
- `admin.html` lets the signed-in owner write to those collections.
- **Security does not depend on hiding the admin page.** The Firebase config in `firebase-config.js` is public by design. Writes are protected by Firestore security rules (`firestore.rules`) that allow only the owner's account UID, and validate field types and lengths. Everyone else has read-only access.
- All user-entered text is inserted with `textContent`, so nothing typed in the admin panel or the contact form can inject HTML.
- If Firebase is not configured, the project falls back to a local demo mode that stores data in the browser's `localStorage`, so it can be tried with no setup.

## Project structure

```
index.html          public site
admin.html          owner admin panel
firebase-config.js  Firebase and Web3Forms keys (public by design)
firestore.rules     database security rules
js/
  db.js             loads Firebase
  store.js          menu storage (Firestore or local)
  content.js        announcements and opening hours storage
  menu.js           renders the menu on the site
  site.js           renders announcements and hours on the site
  contact.js        contact form -> email
  admin.js          admin: login and menu management
  admin-extra.js    admin: announcements and opening hours
images/             photos used on the site
```

## Run it locally

JavaScript modules do not load from `file://`, so serve the folder:

1. Open the folder in VS Code and use the **Live Server** extension (Open with Live Server on `index.html`), or run `python -m http.server` and open `http://localhost:8000`.
2. Without Firebase keys the site runs in demo mode. To use your own backend, follow the setup below.

## Set up your own backend (free)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (Spark plan is free).
2. Register a web app and copy its config into `firebase-config.js`.
3. Create a Firestore database and enable **Authentication → Email/Password**.
4. Add the owner user and copy their **User UID**.
5. Paste `firestore.rules` into Firestore → Rules, replace `PASTE_OWNER_UID` with the UID, and publish.
6. For the contact form, get a free access key at [web3forms.com](https://web3forms.com) and put it in `contactConfig.accessKey` in `firebase-config.js`.
7. Deploy: push to GitHub and enable **Settings → Pages → Deploy from branch → main**. Add `<your-username>.github.io` to **Authentication → Settings → Authorized domains** so login works on the live site.
