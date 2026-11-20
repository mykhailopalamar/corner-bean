// Contact form: sends the message to the owner's email through Web3Forms.
import { contactConfig } from "../firebase-config.js";

const form = document.getElementById("contact-form");
const status = document.getElementById("status");
const button = form.querySelector("button[type=submit]");
const ready = !!contactConfig.accessKey && !contactConfig.accessKey.startsWith("PASTE");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  if (!name || !message) return (status.textContent = "Please fill in your name and a message.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (status.textContent = "That email address does not look right.");
  if (form.botcheck.checked) return; // honeypot: real people never tick this hidden box
  if (!ready) return (status.textContent = "The form is not connected to email yet (see README).");

  button.disabled = true;
  status.textContent = "Sending...";
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: contactConfig.accessKey,
        subject: "New message from the Corner Bean site",
        from_name: name,
        name,
        email,
        message,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || "Request failed");
    status.textContent = "Thanks, " + name + "! Your message was sent.";
    form.reset();
  } catch (error) {
    console.error(error);
    status.textContent = "Could not send the message. Please try again or email us directly.";
  } finally {
    button.disabled = false;
  }
});
