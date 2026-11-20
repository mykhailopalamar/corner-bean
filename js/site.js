// Public site: shows announcements and opening hours, both live.
import { subscribeAnnouncements, subscribeHours } from "./content.js";

const bar = document.getElementById("announcements");
const hours = document.getElementById("hours");

subscribeAnnouncements(
  (items) => {
    bar.replaceChildren();
    bar.hidden = items.length === 0;
    items.forEach((item) => {
      const p = document.createElement("p");
      p.textContent = item.text; // textContent: nothing typed in admin can inject HTML
      bar.append(p);
    });
  },
  (error) => console.error("Could not load announcements:", error)
);

subscribeHours(
  (lines) => {
    hours.querySelectorAll("dd").forEach((dd) => dd.remove());
    lines.forEach((line) => {
      const dd = document.createElement("dd");
      dd.textContent = line;
      hours.append(dd);
    });
  },
  (error) => console.error("Could not load hours:", error) // the static hours in the HTML stay
);
