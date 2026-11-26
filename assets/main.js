// PEIYI LLC — checkout handler.
// Buttons with [data-checkout] start Stripe Checkout.
// Option A (default): calls the Netlify Function, which creates a Checkout Session.
// Option B (no server): set PAYMENT_LINK below to your Stripe Payment Link URL
//   (e.g. "https://buy.stripe.com/xxxx") and the button will go straight there.
const PAYMENT_LINK = ""; // leave empty to use the Checkout Session function

document.addEventListener("DOMContentLoaded", () => {
  // Show "payment canceled" notice on book.html?canceled=1
  const params = new URLSearchParams(location.search);
  if (params.get("canceled") === "1") {
    const n = document.getElementById("canceled-notice");
    if (n) n.classList.remove("hidden");
  }

  document.querySelectorAll("[data-checkout]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (PAYMENT_LINK) { location.href = PAYMENT_LINK; return; }
      const label = btn.textContent;
      const err = document.getElementById("checkout-error");
      btn.disabled = true;
      btn.textContent = "Redirecting to secure checkout…";
      try {
        const res = await fetch("/.netlify/functions/create-checkout-session", { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || "Checkout unavailable");
        location.href = data.url;
      } catch (ex) {
        btn.disabled = false;
        btn.textContent = label;
        if (err) {
          err.textContent = "Sorry, we couldn't open checkout just now. Please try again in a moment, or email info@peiyillc.com and we'll help you book.";
          err.classList.remove("hidden");
        }
      }
    });
  });
});
