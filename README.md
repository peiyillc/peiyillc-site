# peiyillc.com — launch guide

**Full step-by-step deployment and Stripe instructions: see DEPLOY.md (it supersedes the short steps below).**

Static site (HTML/CSS/JS) + one Netlify Function that creates a Stripe Checkout Session for USD 98.80.

## Files
- `index.html, about.html, services.html, pricing.html, book.html, contact.html`: main pages
- `success.html`: page shown after payment. `thanks.html`: page shown after the contact form
- `terms.html` (includes the Refund Policy) and `privacy.html`: required by Stripe for account review
- `assets/style.css, assets/main.js`: styling and the checkout button
- `netlify/functions/create-checkout-session.js`: creates the Stripe Checkout Session (no npm packages)
- `netlify.toml`: Netlify config (security headers; www/apex redirect is set via Netlify's Primary domain)
- `netlify/functions/checkout-status.js`: setup check at /.netlify/functions/checkout-status
- Before launch, replace `[DATE OF LAUNCH]` in terms.html and privacy.html.

## 1. Stripe
1. Dashboard → Settings → Business: legal name **PEIYI LLC**, website **https://peiyillc.com**, support email **info@peiyillc.com**,
   statement descriptor e.g. `PEIYI COFFEE`. Add Terms/Refund URL (`https://peiyillc.com/terms.html`) and Privacy URL.
2. Settings → Customer emails: turn on **Successful payments** receipts.
3. Settings → Team & security / Communication preferences: turn on email alerts for successful payments, so you know to schedule each booking.
4. Developers → API keys: copy the **Secret key** (`sk_test_...` first, `sk_live_...` at launch).
5. (Optional) Product catalog → create a product "1:1 Coffee Consultation", one-time price USD 98.80, and copy its `price_...` ID.

## 2. Netlify (hosting, free tier)
1. Push this folder to a GitHub repo, then Netlify → Add new project → Import from GitHub. No build command; publish directory `.`.
   (Or use the Netlify CLI: `npx netlify-cli deploy --prod`.) Functions are deployed from Git/CLI; drag-and-drop deploys do not build functions.
2. Site configuration → Environment variables:
   - `STRIPE_SECRET_KEY` = your secret key
   - `SITE_URL` = `https://peiyillc.com`
   - optional `STRIPE_PRICE_ID` = `price_...`
3. Redeploy. Test checkout with Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
4. Forms → enable form detection so the contact form saves submissions; add an email notification to info@peiyillc.com.
5. Domain management → Add domain `peiyillc.com` (and `www.peiyillc.com`). HTTPS is issued automatically once DNS resolves.

## 3. DNS at Northwest Registered Agent (keep Northwest nameservers)
| Type | Host | Value |
|---|---|---|
| A | @ | 75.2.60.5 |
| CNAME | www | YOUR-SITE.netlify.app |
| MX / TXT (SPF, DKIM) | (as given by your email provider) | keep / add exactly as provided |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:info@peiyillc.com` |

Delete any old A/AAAA/CNAME records on `@` or `www` that point to a parking page. Do NOT delete MX records.
Propagation can take up to 24 hours.

## No-server alternative (Payment Link)
Stripe → Payment Links → create one for the USD 98.80 product, add the same 3 custom fields
(preferred times, focus, equipment), set "After payment" → redirect to `https://peiyillc.com/success.html`.
Paste the link into `PAYMENT_LINK` at the top of `assets/main.js`. The function is then unused.
