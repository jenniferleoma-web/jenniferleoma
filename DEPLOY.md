# Deploy BitPay to GitHub Pages & Create APK

## 1. Host on GitHub Pages

### Option A: Deploy from your repo

1. Create a GitHub account if you don't have one: https://github.com
2. Create a new repository named `bitpay` (or any name)
3. Push your project files to the repo:
   ```bash
   cd crypto-wallet
   git init
   git add .
   git commit -m "BitPay crypto wallet"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bitpay.git
   git push -u origin main
   ```
4. Go to **Settings → Pages** in your repo
5. Under **Source**, select **Deploy from a branch**
6. Choose branch `main`, folder **/ (root)**, then Save
7. Your site will be live at: `https://YOUR_USERNAME.github.io/bitpay/`

### Option B: Netlify (Free alternative)

1. Go to https://www.netlify.com
2. Drag & drop your `crypto-wallet` folder
3. Get a URL like `https://your-site.netlify.app`

---

## 2. Create APK (Bit Pay app) for Android

### Using PWA Builder (Easiest – no coding)

1. Deploy your site first (GitHub Pages or Netlify)
2. Go to https://www.pwabuilder.com
3. Enter your site URL (e.g. `https://YOUR_USERNAME.github.io/bitpay/`)
4. Click **Start** → **Package For Stores**
5. Download the **Android (APK)** package
6. Rename the APK to `bitpay.apk` if needed

### Using Bubblewrap (Google TWA)

1. Install: `npm install -g @bubblewrap/cli`
2. Initialize: `bubblewrap init --manifest=https://YOUR_SITE_URL/manifest.json`
3. Build: `bubblewrap build`
4. Find the APK in the output folder

### Host your APK for the Download button

1. Create a **Release** in your GitHub repo
2. Upload `bitpay.apk` as an asset
3. Update `APK_DOWNLOAD_URL` in `app.js`:
   ```js
   const APK_DOWNLOAD_URL = 'https://github.com/YOUR_USERNAME/bitpay/releases/latest/download/bitpay.apk';
   ```

---

## 3. Connect Stripe for Purchase

1. Create a Stripe account: https://dashboard.stripe.com
2. Go to **Payment Links** in the dashboard
3. Create a new Payment Link (product, price, etc.)
4. Copy the URL (e.g. `https://buy.stripe.com/xxxxx`)
5. Update `app.js`:
   ```js
   const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/YOUR_LINK';
   ```

---

## Quick Checklist

- [ ] Push code to GitHub
- [ ] Enable GitHub Pages
- [ ] Generate APK with PWA Builder
- [ ] Upload APK to GitHub Releases
- [ ] Update `APK_DOWNLOAD_URL` in app.js
- [ ] Create Stripe Payment Link
- [ ] Update `STRIPE_PAYMENT_LINK` in app.js
