// Shows the menu on the site and keeps it live: when an item is added or removed
// in the admin page, it appears here without reloading.
import { subscribe } from "./store.js";

const grid = document.getElementById("menu-grid");

function formatPrice(value) {
  const number = Number(value);
  return Number.isFinite(number) ? "$" + number.toFixed(2) : "";
}

function buildItem(data) {
  const item = document.createElement("div");
  item.className = "item";

  const title = document.createElement("h3");
  title.append(document.createTextNode(data.name || ""));
  const price = document.createElement("span");
  price.textContent = formatPrice(data.price);
  title.append(price);

  const description = document.createElement("p");
  description.textContent = data.description || "";

  item.append(title, description);
  return item;
}

function render(items) {
  grid.replaceChildren();
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "The menu is being updated. Please check back soon.";
    grid.append(empty);
    return;
  }
  // textContent is used everywhere, so nothing typed in the admin page can inject HTML.
  items.forEach((data) => grid.append(buildItem(data)));
}

if (grid) {
  subscribe(render, (error) => {
    // On any error keep the starter menu that is already written in the HTML.
    console.error("Could not load the menu:", error);
  });
}
