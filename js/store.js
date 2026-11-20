// Menu storage with two interchangeable backends:
//   "firebase": shared Firestore database (used when firebase-config.js is filled in)
//   "local":    this browser's localStorage (works immediately, no accounts needed)
// The site (menu.js) and the admin page (admin.js) only talk to this file.
import { isConfigured, loadFirebase } from "./db.js";

export const mode = isConfigured ? "firebase" : "local";

export const STARTER_MENU = [
  { name: "Flat White", price: 4.2, description: "Double ristretto with silky steamed milk." },
  { name: "Filter of the Day", price: 3.5, description: "Ask us what is on the brewer today." },
  { name: "Cold Brew", price: 4.8, description: "Steeped for 16 hours, served over ice." },
  { name: "Almond Croissant", price: 3.9, description: "Baked at 7 a.m., usually gone by 11." },
  { name: "Cinnamon Roll", price: 3.6, description: "Soft, sticky and bigger than it looks." },
  { name: "Hot Chocolate", price: 4.0, description: "Real dark chocolate, no powder." },
];

// Same limits as the Firestore rules, so both modes behave the same.
export function validateItem(input) {
  const name = String(input.name ?? "").trim();
  const description = String(input.description ?? "").trim();
  const price = Number(input.price);
  if (!name || name.length > 60) throw new Error("Name is required (up to 60 characters).");
  if (!Number.isFinite(price) || price < 0 || price > 999) {
    throw new Error("Price must be a number between 0 and 999.");
  }
  if (description.length > 200) throw new Error("Description is too long (up to 200 characters).");
  return { name, price: Math.round(price * 100) / 100, description };
}

// ---------- local backend ----------

const LOCAL_KEY = "cornerbean.menu.v1";
const LOCAL_EVENT = "cornerbean-menu-change";

const starterWithIds = () => STARTER_MENU.map((item, index) => ({ id: "starter-" + index, ...item }));
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw === null) return starterWithIds(); // nothing saved yet: show the starter menu
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : starterWithIds();
  } catch {
    return starterWithIds();
  }
}

function writeLocal(items) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  } catch {
    throw new Error("This browser blocks local storage, so the menu cannot be saved.");
  }
  window.dispatchEvent(new Event(LOCAL_EVENT)); // updates other parts of this tab
}

function subscribeLocal(onItems) {
  const emit = () => onItems(readLocal());
  const onStorage = (event) => {
    if (event.key === LOCAL_KEY || event.key === null) emit(); // changes made in another tab
  };
  emit();
  window.addEventListener("storage", onStorage);
  window.addEventListener(LOCAL_EVENT, emit);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LOCAL_EVENT, emit);
  };
}

// ---------- firebase backend ----------

function subscribeFirebase(onItems, onError) {
  let unsubscribe = () => {};
  let cancelled = false;
  loadFirebase()
    .then(({ db, fs }) => {
      if (cancelled) return;
      const menuQuery = fs.query(fs.collection(db, "menu"), fs.orderBy("createdAt"));
      unsubscribe = fs.onSnapshot(
        menuQuery,
        (snapshot) => onItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (error) => onError && onError(error)
      );
    })
    .catch((error) => onError && onError(error));
  return () => {
    cancelled = true;
    unsubscribe();
  };
}

// ---------- public API ----------

// Calls onItems(array) now and on every change. Returns a function that stops listening.
export function subscribe(onItems, onError) {
  return mode === "firebase" ? subscribeFirebase(onItems, onError) : subscribeLocal(onItems);
}

export async function addItem(input) {
  const item = validateItem(input);
  if (mode === "local") {
    writeLocal([...readLocal(), { id: newId(), ...item }]);
    return;
  }
  const { db, fs } = await loadFirebase();
  await fs.addDoc(fs.collection(db, "menu"), { ...item, createdAt: fs.serverTimestamp() });
}

export async function removeItem(id) {
  if (mode === "local") {
    writeLocal(readLocal().filter((item) => item.id !== id));
    return;
  }
  const { db, fs } = await loadFirebase();
  await fs.deleteDoc(fs.doc(db, "menu", id));
}

// Local mode replaces the whole menu with the starter items.
// Firebase mode adds the starter items to the shared database.
export async function seedStarter() {
  if (mode === "local") {
    writeLocal(starterWithIds());
    return;
  }
  const { db, fs } = await loadFirebase();
  const batch = fs.writeBatch(db);
  STARTER_MENU.forEach((item, index) => {
    batch.set(fs.doc(fs.collection(db, "menu")), {
      ...item,
      createdAt: new Date(Date.now() + index), // keeps the original order
    });
  });
  await batch.commit();
}
