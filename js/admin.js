// Admin page: add and delete menu items.
//  - Without Firebase (default): works immediately, items are saved in this browser.
//  - With Firebase configured: log in with the owner account, items go to the shared database.
// Security in Firebase mode does not depend on this page: the Firestore rules
// (firestore.rules) only allow writes from the owner's account.
import { isConfigured, loadFirebase } from "./db.js";
import { mode, subscribe, addItem, removeItem, seedStarter } from "./store.js";

const $ = (id) => document.getElementById(id);

let unsubscribeList = null;

function show(view) {
  $("loading").classList.add("hidden");
  for (const id of ["login-view", "panel-view"]) {
    $(id).classList.toggle("hidden", id !== view);
  }
}

function renderList(items) {
  const list = $("list");
  list.replaceChildren();
  if (items.length === 0) {
    list.textContent = "The menu is empty.";
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "row";

    const text = document.createElement("div");
    text.textContent = `${item.name} · $${Number(item.price).toFixed(2)}`;
    const small = document.createElement("small");
    small.textContent = item.description || "";
    text.append(small);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!confirm(`Delete "${item.name}"?`)) return;
      try {
        await removeItem(item.id);
      } catch (error) {
        alert("Could not delete: " + error.message);
      }
    });

    row.append(text, remove);
    list.append(row);
  });
}

function startPanel() {
  stopPanel();
  unsubscribeList = subscribe(renderList, (error) => {
    $("list").textContent = "Could not load the menu: " + error.message;
  });
}

function stopPanel() {
  if (unsubscribeList) {
    unsubscribeList();
    unsubscribeList = null;
  }
}

// ----- forms shared by both modes -----

$("add-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = $("add-msg");
  message.textContent = "";
  try {
    await addItem({
      name: $("name").value,
      price: $("price").value,
      description: $("description").value,
    });
    event.target.reset();
    $("name").focus();
  } catch (error) {
    message.textContent = error.message;
  }
});

$("seed").addEventListener("click", async () => {
  const question =
    mode === "local"
      ? "Replace the whole menu with the 6 starter items?"
      : "Add the 6 starter items to the shared menu?";
  if (!confirm(question)) return;
  try {
    await seedStarter();
  } catch (error) {
    alert("Could not load the starter menu: " + error.message);
  }
});

// ----- mode setup -----

if (mode === "local") {
  $("mode-note").textContent =
    "Demo mode: Firebase is not set up, so the menu is saved in this browser only. " +
    "Open the site in another tab and it updates live. To share one menu with every visitor, set up Firebase (see README).";
  $("mode-note").classList.remove("hidden");
  $("logout").classList.add("hidden");
  show("panel-view");
  startPanel();
} else {
  show("login-view");
  loadFirebase()
    .then(({ auth, authMod }) => {
      authMod.onAuthStateChanged(auth, (user) => {
        stopPanel();
        if (!user) {
          show("login-view");
          return;
        }
        $("who").textContent = "Logged in as " + user.email;
        show("panel-view");
        startPanel();
      });

      $("login-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        $("login-msg").textContent = "";
        try {
          await authMod.signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
          $("password").value = "";
        } catch {
          $("login-msg").textContent = "Login failed. Check your email and password.";
        }
      });

      $("logout").addEventListener("click", () => authMod.signOut(auth));
    })
    .catch((error) => {
      $("login-msg").textContent = "Could not reach Firebase: " + error.message;
    });
}
