# Algeria COD Form Builder – Setup

**Date:** February 5, 2026  
**Audience:** Shopify merchant / developer

## Local Dev
1. Install dependencies  
   `npm install`
2. Create `.env` from `.env.example` and fill values:
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_APP_URL` (e.g. `https://<ngrok>.ngrok-free.app`)
   - `SCOPES`
   - `DATABASE_URL` (default `file:./dev.sqlite`)
   - `DATABASE_PROVIDER` (`sqlite` for local, `postgresql` for production)
3. Migrate DB  
   `npm run prisma:migrate`
4. Run dev server  
   `npm run dev`

## Install on Dev Store
1. Create a Shopify app in Partner Dashboard.
2. Set App URL to your dev tunnel URL (ngrok, cloudflared).
3. Set Allowed redirection URLs to:
   - `<APP_URL>/auth/callback`
   - `<APP_URL>/auth/shopify/callback`
   - `<APP_URL>/api/auth/callback`
4. Run the app locally and open:
   `https://<APP_URL>/auth?shop=<your-store>.myshopify.com`
5. Approve permissions.

## App Proxy (Required)
1. In Partner Dashboard, enable App Proxy:
   - Subpath prefix: `apps`
   - Subpath: `cod`
   - Proxy URL: `<APP_URL>/apps/cod`
2. The app serves proxy routes:
   - `/apps/cod/form`
   - `/apps/cod/locations`
   - `/apps/cod/submit`

## Theme App Extension
1. In Shopify admin: **Online Store → Themes → Customize**.
2. Add the block **“Algeria COD Form”** to your product template or any page section.
3. Set `form_slug` to the desired form slug (default: `algeria-cod`).

## Theme Snippet (Optional)
Add the block on a product template:
```
{% render 'app-block', app: 'Algeria COD Form Builder', block: 'cod-form' %}
```

## Admin Usage
1. Go to **Apps → Algeria COD Form Builder**.
2. Create a form via **Create Form**.
3. Adjust shipping prices, discount rules, language and design tokens.
4. Copy the form slug into the theme block.

## Deploy (Render Example)
1. Create a new Web Service on Render.
2. Set `DATABASE_URL` to PostgreSQL URL.
3. Add env vars: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES`.
4. Build command: `npm install && npm run build`
5. Start command: `npm run start`

## Test Checklist
1. Add block to product page.
2. Open product page and submit COD form.
3. Confirm draft order is created with tags:
   - `COD`, `Algeria-COD`, `Wilaya:<name>`, `Baladiya:<name>`
4. Check submission appears in Dashboard table.

## Screenshot Descriptions (Text Only)
1. **Dashboard**: Two cards showing “Orders (7 days)” and “Orders (30 days)”, and a recent submissions table with name, phone, total, status.
2. **Form Builder**: Left panel shows field list; middle settings with shipping prices and discount; right preview with rounded card mock.
3. **Storefront Form**: Beige summary card with 4 price rows and icons; input fields with icons; shipping radio cards; orange full-width CTA with rounded corners; RTL layout for Arabic.
