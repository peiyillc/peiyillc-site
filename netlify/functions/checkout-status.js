// Setup check: open https://peiyillc.com/.netlify/functions/checkout-status
// Shows whether the Stripe environment variables are present and which mode the key is in.
// It never reveals the key or the Price ID itself.
exports.handler = async () => {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const price = process.env.STRIPE_PRICE_ID || "";
  let keyMode = "missing";
  if (/^(sk|rk)_test_/.test(key)) keyMode = "test";
  else if (/^(sk|rk)_live_/.test(key)) keyMode = "live";
  else if (key) keyMode = "unrecognized (should start with sk_test_ or sk_live_)";
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      stripeKeyMode: keyMode,
      priceIdSet: price.startsWith("price_"),
      priceIdLooksWrong: Boolean(price) && !price.startsWith("price_"),
      siteUrl: process.env.SITE_URL || "(not set, defaults to https://peiyillc.com)",
    }, null, 2),
  };
};
