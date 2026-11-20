// Opening hours and announcements, with the same two backends as store.js
// (Firestore when firebase-config.js is filled in, localStorage otherwise).
import { isConfigured, loadFirebase } from "./db.js";

export const DEFAULT_HOURS = ["Mon–Fri: 7:00 – 18:00", "Sat–Sun: 8:00 – 16:00"];

const HOURS_KEY = "cornerbean.hours.v1";
const ANN_KEY = "cornerbean.announcements.v1";
const EVENT = "cornerbean-content-change";
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function validateHours(input) {
  const lines = (Array.isArray(input) ? input : String(input).split("\n"))
    .map((line) => String(line).trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("Add at least one line.");
  if (lines.length > 7) throw new Error("Up to 7 lines.");
  if (lines.some((line) => line.length > 60)) throw new Error("Each line can be up to 60 characters.");
  return lines;
}

export function validateAnnouncement(input) {
  const text = String(input ?? "").trim();
  if (!text) throw new Error("Write the announcement text.");
  if (text.length > 200) throw new Error("Announcement is too long (up to 200 characters).");
  return text;
}

// ---------- local backend ----------
function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("This browser blocks local storage, so changes cannot be saved.");
  }
  window.dispatchEvent(new Event(EVENT));
}
function watchLocal(key, fallback, onValue) {
  const emit = () => onValue(readLocal(key, fallback));
  const onStorage = (e) => {
    if (e.key === key || e.key === null) emit();
  };
  emit();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, emit);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, emit);
  };
}

// ---------- firebase backend ----------
function watchFirebase(makeRef, map, onValue, onError) {
  let unsubscribe = () => {};
  let cancelled = false;
  loadFirebase()
    .then(({ db, fs }) => {
      if (cancelled) return;
      unsubscribe = fs.onSnapshot(makeRef(db, fs), (snap) => onValue(map(snap)), (e) => onError && onError(e));
    })
    .catch((e) => onError && onError(e));
  return () => {
    cancelled = true;
    unsubscribe();
  };
}

// ---------- hours ----------
export function subscribeHours(onValue, onError) {
  if (!isConfigured) return watchLocal(HOURS_KEY, DEFAULT_HOURS, onValue);
  return watchFirebase(
    (db, fs) => fs.doc(db, "settings", "hours"),
    (snap) => (snap.exists() && Array.isArray(snap.data().lines) ? snap.data().lines : DEFAULT_HOURS),
    onValue,
    onError
  );
}

export async function saveHours(input) {
  const lines = validateHours(input);
  if (!isConfigured) return writeLocal(HOURS_KEY, lines);
  const { db, fs } = await loadFirebase();
  await fs.setDoc(fs.doc(db, "settings", "hours"), { lines });
}

// ---------- announcements (newest first) ----------
export function subscribeAnnouncements(onValue, onError) {
  if (!isConfigured) return watchLocal(ANN_KEY, [], onValue);
  return watchFirebase(
    (db, fs) => fs.query(fs.collection(db, "announcements"), fs.orderBy("createdAt", "desc")),
    (snap) => snap.docs.map((d) => ({ id: d.id, text: d.data().text })),
    onValue,
    onError
  );
}

export async function addAnnouncement(input) {
  const text = validateAnnouncement(input);
  if (!isConfigured) return writeLocal(ANN_KEY, [{ id: newId(), text }, ...readLocal(ANN_KEY, [])]);
  const { db, fs } = await loadFirebase();
  await fs.addDoc(fs.collection(db, "announcements"), { text, createdAt: fs.serverTimestamp() });
}

export async function removeAnnouncement(id) {
  if (!isConfigured) return writeLocal(ANN_KEY, readLocal(ANN_KEY, []).filter((a) => a.id !== id));
  const { db, fs } = await loadFirebase();
  await fs.deleteDoc(fs.doc(db, "announcements", id));
}
