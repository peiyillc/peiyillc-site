// Netlify Function: creates a Stripe Checkout Session for the $98.80 consultation.
// Required environment variable (Netlify > Site configuration > Environment variables):
//   STRIPE_SECRET_KEY   sk_live_... (or sk_test_... while testing)
// Optional:
//   STRIPE_PRICE_ID     price_... (use a Price you created in Stripe; otherwise $98.80 is set inline)
//   SITE_URL            defaults to https://peiyillc.com
// No npm packages needed: it calls the Stripe API directly with fetch (Node 18+).

const PRODUCT_NAME = "Coffee Consulting Session"; // only used if STRIPE_PRICE_ID is not set
const PRODUCT_DESC = "Live video session on coffee bean selection and brewing technique, plus a written brew guide within 48 hours.";
const AMOUNT_CENTS = "9880"; // USD 98.80

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Payments are not configured yet." }) };
  }
  const site = (process.env.SITE_URL || "https://peiyillc.com").replace(/\/$/, "");

  const p = new URLSearchParams();
  p.append("mode", "payment");
  p.append("locale", "en"); // keep checkout English-only
  if (process.env.STRIPE_PRICE_ID) {
    p.append("line_items[0][price]", process.env.STRIPE_PRICE_ID);
  } else {
    p.append("line_items[0][price_data][currency]", "usd");
    p.append("line_items[0][price_data][unit_amount]", AMOUNT_CENTS);
    p.append("line_items[0][price_data][product_data][name]", PRODUCT_NAME);
    p.append("line_items[0][price_data][product_data][description]", PRODUCT_DESC);
  }
  p.append("line_items[0][quantity]", "1");
  p.append("success_url", `${site}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  p.append("cancel_url", `${site}/book.html?canceled=1`);
  p.append("billing_address_collection", "auto");

  p.append(
    "custom_text[submit][message]",
    "We'll email you from info@peiyillc.com within 1 business day to confirm your session time. By paying you agree to our Terms & Refund Policy at peiyillc.com/terms.html."
  );

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: p.toString(),
    });
    const data = await res.json();
    if (!res.ok) {
      const msg = (data.error && data.error.message) || "";
      console.error("Stripe error:", msg);
      if (/No such price/i.test(msg)) {
        console.error("Hint: STRIPE_PRICE_ID must come from the same mode (test/sandbox vs live) as STRIPE_SECRET_KEY.");
      }
      return { statusCode: 502, headers, body: JSON.stringify({ error: "Could not start checkout." }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ url: data.url }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Could not start checkout." }) };
  }
};
