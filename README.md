# Corner Bean Coffee: landing page with an editable menu

A responsive landing page for a fictional coffee shop. The menu is stored in a small Google Firebase (Firestore) database, and the owner edits it from an admin page. Add or delete an item and it shows up on the site immediately, with no code changes and no redeploy.

No frameworks and no build step. Plain HTML, CSS and JavaScript modules.

## What's inside

- Sticky header with smooth-scroll navigation
- Hero section, menu, about, opening hours and address
- Live menu loaded from Firestore (updates in real time)
- `admin.html`: password-protected page to add and delete menu items
- Contact form with client-side validation (demo, sends nothing)
- Layout works from phone width up to desktop

## Photos

The page expects three stock photos in the `images/` folder (`hero.jpg`, `pastry.jpg`, `interior.jpg`). See `images/README.md` for where to get them. Without them the page still works and shows plain colored blocks.

## Two storage modes

| | Demo mode (default) | Firebase mode |
|---|---|---|
| Setup | none | 7 steps below |
| Where the menu lives | this browser's localStorage | shared Firestore database |
| Who sees changes | only you, in this browser (other tabs update live) | every visitor |
| Admin login | none | owner account |

The mode is chosen automatically: it switches to Firebase as soon as `firebase-config.js` contains real keys. `index.html` and `admin.html` do not change.

**Try demo mode now:** serve the folder (for example `python -m http.server`, then open `http://localhost:8000/admin.html`), add and delete items, and keep `http://localhost:8000/` open in another tab to watch the menu update.

JavaScript modules do not load from `file://` in most browsers, so double-clicking the files will not work. Use a local server (VS Code Live Server also works) or GitHub Pages.

Note: on GitHub Pages without Firebase, each visitor would only see the starter menu, because demo-mode edits live in the editor's own browser. Set up Firebase to publish menu changes to everyone.

## Set up the editable menu (free, no card needed)

1. **Create a project** at https://console.firebase.google.com (Spark plan is free).
2. **Register a web app**: Project settings → Your apps → Web (`</>`). Copy the config values into `firebase-config.js`.
3. **Create the database**: Build → Firestore Database → Create database (production mode, any region).
4. **Turn on login**: Build → Authentication → Sign-in method → Email/Password → Enable.
5. **Create the owner account**: Authentication → Users → Add user (your email and a strong password). Copy the **User UID** shown in the table.
6. **Set the rules**: Firestore Database → Rules. Paste the contents of `firestore.rules`, replace `PASTE_OWNER_UID` with your User UID, and publish.
7. Open `admin.html`, log in, click **Load starter menu** once, then add or delete items.

### Why the rules check the UID

The Firebase config in `firebase-config.js` is public by design, so anyone could create their own account with it. The rules therefore allow writes only from the owner's UID, not from "any logged-in user". Reading the menu is public.

## Deploy for free

Push the repo to GitHub, then enable **Settings → Pages → Deploy from branch → main**. The site will be live at `https://<your-username>.github.io/<repo-name>/`.

In Firebase, add `<your-username>.github.io` under Authentication → Settings → Authorized domains so login works on the live site.

## Notes

The business, address and prices are made up. The contact form is a demo and does not send data anywhere. To make it real, connect it to a service such as Formspree or Netlify Forms.
