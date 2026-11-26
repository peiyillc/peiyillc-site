# peiyillc.com: deployment and Stripe setup guide

Follow the steps in order. Button names may differ slightly as Netlify, Stripe and Northwest update their dashboards.

Values used throughout:
- Domain: `peiyillc.com` and `www.peiyillc.com`
- Email: `info@peiyillc.com`
- Product: `Coffee Consulting Session`, USD 98.80, one-time
- Netlify environment variables: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `SITE_URL=https://peiyillc.com`

---

## STEP 0: Check before you change any DNS

1. **Save a copy of the current DNS records.** Northwest → log in → your domain `peiyillc.com` → DNS settings.
   Screenshot or write down every record: Type, Host/Name, Value, Priority (for MX), TTL.
2. **Find out where info@peiyillc.com is hosted.**
   - Check your Northwest account for a "Business Email" service on peiyillc.com.
   - Or open https://toolbox.googleapps.com/apps/dig/#MX/peiyillc.com and read the MX answer:
     - MX contains `northwest` or a Northwest mail host → **Northwest email**
     - `smtp.google.com` or `aspmx.l.google.com` → **Google Workspace**
     - `...mail.protection.outlook.com` → **Microsoft 365**
     - No MX record → **no email set up yet**
   - Also look up TXT records (same tool, TXT tab) for the SPF record (`v=spf1 ...`) and DKIM.
3. **DNSSEC:** if Northwest shows DNSSEC as enabled, turn it off before changing nameservers.
   Turn it back on later in Netlify only if you want it.
4. **CAA records:** if any exist, they must allow `letsencrypt.org`, otherwise HTTPS will fail.
5. **Deploy and test the site on its netlify.app address first** (Steps 1–2 and Part 2) before touching DNS.

---

## PART 1: Deployment

### Step 1: Put the site on Netlify (Git method, needed for the checkout function)
1. Create a GitHub repository, e.g. `peiyillc-site`, and upload the **contents** of this folder.
   `index.html` and `netlify.toml` must be at the top level, not inside a subfolder.
2. Netlify → **Add new project** → **Import an existing project** → GitHub → choose the repo.
3. Build settings: Build command = *(leave empty)*. Publish directory = `.`. Functions directory = `netlify/functions`.
   `netlify.toml` already sets these.
4. Click **Deploy**. When it finishes you get an address like `https://peiyi-llc.netlify.app`.
   You can rename it under Project configuration → General → Change project name.
5. Open the netlify.app address and check that all pages load.

(CLI alternative: `npx netlify-cli login`, then `npx netlify-cli deploy --prod` from inside the folder.)

### Step 2: Contact form email
Netlify → your project → **Forms** → **Enable form detection** → redeploy (Deploys → Trigger deploy).
Then Forms → Form notifications → **Add notification** → Email notification → `info@peiyillc.com`.

### Step 3: Choose your DNS path

| | Path B: nameservers to Netlify (what you asked for) | Path A: keep Northwest DNS |
|---|---|---|
| Who manages DNS | Netlify | Northwest |
| Email records | **You must re-create them in Netlify first** | Untouched |
| Risk to email | Medium (if you forget a record, email stops) | Very low |
| Website setup | Automatic | 2 records |

Either works. Path B is below. Path A is at the end of Part 1.

### Step 4 (Path B): Add the domain and set up Netlify DNS
1. Netlify → project → **Domain management** → **Add a domain** → enter `peiyillc.com` → **Verify** → **Add domain**.
   Netlify also adds `www.peiyillc.com` automatically.
2. Next to `peiyillc.com`, click **Set up Netlify DNS** (or **Options → Set up Netlify DNS**) → **Verify** → **Continue**.
3. If Netlify offers to import or shows existing records, review them against your Step 0 list.
4. **Add your email records** (Netlify → Domains → peiyillc.com → DNS records → **Add new record**).
   Copy every MX, SPF (TXT `v=spf1...`), DKIM (TXT or CNAME) and verification TXT record from your Step 0 list **exactly**.
   See the email table below.
5. Add DMARC:
   - Type `TXT`, Name `_dmarc`, Value `v=DMARC1; p=none; rua=mailto:info@peiyillc.com`
6. Do **not** add A/CNAME records for `@` or `www`. Netlify creates special `NETLIFY` records for them automatically.
7. Netlify shows **4 nameservers**, like `dns1.p0X.nsone.net` … `dns4.p0X.nsone.net`.
   **Copy the exact 4 shown in YOUR account.** They differ per account, so never use example values.

### Email records by provider (add these in Netlify DNS for Path B)

| Email host | What to add |
|---|---|
| **Northwest Business Email** | The exact MX / SPF / DKIM records currently in your Northwest DNS (Step 0 list). If you're unsure which ones, ask Northwest support: "I'm moving DNS for peiyillc.com to external nameservers. Please list every DNS record my Business Email needs (MX, SPF, DKIM, autodiscover)." |
| **Google Workspace** | MX `@` → `smtp.google.com`, priority 1. TXT `@` → `v=spf1 include:_spf.google.com ~all`. DKIM TXT `google._domainkey` → value from Google Admin → Apps → Gmail → Authenticate email. |
| **Microsoft 365** | MX `@` → `peiyillc-com.mail.protection.outlook.com`, priority 0 (confirm in M365 admin → Settings → Domains). TXT `@` → `v=spf1 include:spf.protection.outlook.com -all`. CNAMEs `autodiscover`, `selector1._domainkey`, `selector2._domainkey` from the M365 admin. |
| **No email yet** | Set up email first (or right after), then add the records that provider gives you, in Netlify DNS. |

Only one SPF record (`v=spf1...`) may exist on `@`. If you use two mail services, merge them into one record.

### Step 5 (Path B): Change nameservers at Northwest
1. Northwest → domain `peiyillc.com` → **Nameservers** (sometimes under DNS / Domain settings).
2. Choose **custom nameservers** and replace the existing ones with the 4 Netlify nameservers from Step 4.7.
3. Save. If Northwest doesn't let you edit nameservers, contact Northwest support, or use Path A instead.
4. Wait 1–24 hours (sometimes up to 48). Check https://toolbox.googleapps.com/apps/dig/#NS/peiyillc.com until it shows the `nsone.net` servers.

### Step 6: SSL / HTTPS
- Netlify provisions a free Let's Encrypt certificate automatically once DNS points to Netlify.
- Check: Domain management → **HTTPS**. It should say the certificate covers `peiyillc.com` and `www.peiyillc.com`.
- If it says "waiting on DNS", wait a few hours, then click **Verify DNS configuration** → **Provision certificate**.
- Primary domain: set `peiyillc.com` as **Primary domain**; `www.peiyillc.com` then "redirects automatically to primary domain".
  `netlify.toml` no longer contains its own www redirect, so this setting is the only one in control.
- Test: `http://peiyillc.com`, `https://peiyillc.com`, `http://www.peiyillc.com` and `https://www.peiyillc.com` should all end at `https://peiyillc.com/`.

### Step 7: Test email after the nameserver change
Send an email from Gmail to `info@peiyillc.com`, reply from `info@peiyillc.com`, and check the reply isn't in spam.
If mail stops arriving, compare Netlify's DNS records against your Step 0 list.

### Path A (alternative): keep Northwest DNS, leave email untouched
At Northwest DNS (do not change nameservers):

| Type | Host | Value |
|---|---|---|
| A | `@` | `75.2.60.5` |
| CNAME | `www` | `YOUR-PROJECT.netlify.app` (your Netlify address, no https://) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@peiyillc.com` (only if it doesn't exist) |

Delete any other A/AAAA/CNAME records on `@` and `www`, such as a parking page. Keep all MX/TXT email records.
In Netlify → Domain management → Add a domain → `peiyillc.com` → Add (do **not** click "Set up Netlify DNS").
Netlify recommends `www.peiyillc.com` as the primary domain with external DNS. If you choose that, also change `SITE_URL` to `https://www.peiyillc.com`.

---

## PART 2: Stripe

### Test mode vs sandbox vs live
- **Live mode** charges real cards. Keys start with `sk_live_`.
- **Testing:** older accounts have **Test mode**. Newer accounts use **Sandboxes** (account picker → Switch to sandbox).
  Either works. Test keys start with `sk_test_`.
- **Everything is separate per mode.** A product or Price created in test/sandbox does **not** exist in live mode.
  You will create the product twice and get two different `price_...` IDs.
- The test and live values of `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` **must come from the same mode**.
  Otherwise checkout fails with "No such price".

### Step 8: Create the product (do it in test/sandbox first, then again in live)
1. Stripe Dashboard → switch to **Test mode / your sandbox** (account picker, top-left).
2. **Product catalog** → **+ Add product** (or Create product).
3. Fill in:
   - Name: `Coffee Consulting Session`
   - Description: `60-minute one-on-one online coffee consultation on bean selection and brewing technique, plus a written brew guide within 48 hours.`
   - Pricing: **One-off** (not Recurring)
   - Amount: `98.80`, currency **USD**
   - Tax behavior: leave the default unless you've set up Stripe Tax
4. **Add product / Save**.
5. Open the product → in the **Pricing** section click the USD 98.80 price → copy the **Price ID** (`price_...`).
   Or use the ⋯ menu → Copy price ID.
   → This is your **test** `STRIPE_PRICE_ID`.

### Step 9: Get the secret key
1. **Developers** → **API keys** (still in test/sandbox).
2. Under **Secret key**, click **Reveal test key** → copy `sk_test_...`.
   → This is your **test** `STRIPE_SECRET_KEY`.
3. Never put the secret key in any HTML/JS file, GitHub, email or chat. It only goes into Netlify environment variables.
   The publishable key (`pk_...`) is **not** needed for this site.

### Step 10: Add the environment variables to Netlify
Netlify → project → **Project configuration** → **Environment variables** → **Add a variable** → **Add a single variable**:

| Key | Value | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (later `sk_live_...`) | Use "Same value for all deploy contexts" |
| `STRIPE_PRICE_ID` | `price_...` from the same mode | |
| `SITE_URL` | `https://peiyillc.com` | `https://www.peiyillc.com` if www is your primary domain |

- **Scopes:** leave **All scopes**. It must include Functions.
- **"Contains secret values":** optional. Some free-plan users have reported such variables arriving empty in functions.
  If the status check below shows `"missing"`, edit the variable, untick it and redeploy.
- **Redeploy after every change:** Deploys → **Trigger deploy** → **Deploy project**. Variables are applied at deploy time.

### Step 11: Check the setup
Open `https://YOUR-PROJECT.netlify.app/.netlify/functions/checkout-status` (later `https://peiyillc.com/...`). You should see:
```
"stripeKeyMode": "test",
"priceIdSet": true
```
It never shows the key itself.

### Step 12: Test checkout (test mode)
1. Go to `/book.html` → **Continue to secure checkout**. The Stripe page should show **Coffee Consulting Session, US$98.80**.
2. Use these test card details:
   - Card `4242 4242 4242 4242`, any future expiry (e.g. `12/34`), any 3-digit CVC, any name, any ZIP/postal code
   - Declined-card test: `4000 0000 0000 0002`
   - Authentication (3D Secure) test: `4000 0025 0000 3155`
3. Fill in the 3 booking fields → **Pay**. You should land on `/success.html`.
4. Stripe (test mode) → **Payments**: the payment appears. Open it to see the preferred times, focus and equipment fields.
5. Click "Back" on the Stripe page instead of paying: you should land on `/book.html` with the "checkout was canceled" notice.

### Step 13: Go live
1. Stripe → leave the sandbox / switch off Test mode → **complete account activation**:
   - Business type LLC, legal name PEIYI LLC, EIN, business address
   - Website `https://peiyillc.com`, product description "Online coffee consulting sessions"
   - Bank account for payouts, and verify the representative's identity
2. Settings → Public details:
   - Support email `info@peiyillc.com`
   - Statement descriptor e.g. `PEIYI COFFEE`
   - Terms URL `https://peiyillc.com/terms.html`
   - Privacy URL `https://peiyillc.com/privacy.html`
3. Settings → Customer emails: enable **Successful payments** receipts.
   Your notification settings: enable email alerts for successful payments, so you know when to schedule a session.
4. **Live mode:** create the product again (Step 8) → copy the **live** `price_...`.
   (If the test product page offers **Copy to live mode**, you can use that, then copy the new live Price ID.)
5. Developers → API keys (live) → copy the live **Secret key** `sk_live_...`. Store it somewhere safe.
6. Netlify → replace `STRIPE_SECRET_KEY` with `sk_live_...` and `STRIPE_PRICE_ID` with the live `price_...` → **Trigger deploy**.
7. Check `/.netlify/functions/checkout-status` → `"stripeKeyMode": "live"`.
8. Make one real $98.80 purchase with your own card, check the success page and receipt,
   then refund it in Stripe (Payments → the payment → Refund).

Done: the site is live at https://peiyillc.com with working checkout.
