// Admin: announcements and opening hours.
import { subscribeAnnouncements, subscribeHours, addAnnouncement, removeAnnouncement, saveHours } from "./content.js";

const $ = (id) => document.getElementById(id);
const flash = (el, text, ok) => {
  el.textContent = text;
  el.style.color = ok ? "#2d7a3e" : "#a12626";
};

subscribeAnnouncements(
  (items) => {
    const list = $("ann-list");
    list.replaceChildren();
    if (items.length === 0) return (list.textContent = "No announcements.");
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "row";
      const text = document.createElement("div");
      text.textContent = item.text;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        if (!confirm("Delete this announcement?")) return;
        try {
          await removeAnnouncement(item.id);
        } catch (error) {
          alert("Could not delete: " + error.message);
        }
      });
      row.append(text, remove);
      list.append(row);
    });
  },
  (error) => ($("ann-list").textContent = "Could not load announcements: " + error.message)
);

$("ann-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await addAnnouncement($("ann-text").value);
    event.target.reset();
    flash($("ann-msg"), "Published.", true);
  } catch (error) {
    flash($("ann-msg"), error.message, false);
  }
});

let hoursEdited = false;
$("hours-text").addEventListener("input", () => (hoursEdited = true));
subscribeHours((lines) => {
  if (!hoursEdited) $("hours-text").value = lines.join("\n"); // don't overwrite what is being typed
});

$("hours-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await saveHours($("hours-text").value);
    hoursEdited = false;
    flash($("hours-msg"), "Saved. The site is updated.", true);
  } catch (error) {
    flash($("hours-msg"), error.message, false);
  }
});
