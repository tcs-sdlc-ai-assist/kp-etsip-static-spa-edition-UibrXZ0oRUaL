# Deployment Guide

## Overview

KP ETSIP is a fully client-side single-page application (SPA) with no backend, no database, and no external API calls. All data is stored in the browser's `localStorage`. Deployment consists of serving static files from the `dist/` directory with SPA route rewrites.

---

## Vercel Deployment (Recommended)

### Prerequisites

- A [Vercel](https://vercel.com) account
- The repository hosted on GitHub, GitLab, or Bitbucket

### Steps

1. **Push the repository** to your Git provider (GitHub, GitLab, or Bitbucket).

2. **Import the project in Vercel:**
   - Log in to [vercel.com](https://vercel.com)
   - Click **"Add New Project"**
   - Select your repository from the list
   - Vercel auto-detects the Vite framework

3. **Verify build settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Node.js Version:** 18.x or later

4. **Environment Variables:**
   - **None required.** The application runs entirely in the browser with no external API calls.
   - No secrets, API keys, or environment variables need to be configured.

5. **Deploy:**
   - Click **"Deploy"**
   - Vercel will install dependencies, run the build, and deploy the static output

6. **Verify the deployment:**
   - Visit the generated Vercel URL (e.g., `https://your-project.vercel.app`)
   - Confirm the SSO splash screen appears and the application loads
   - Navigate to different routes (e.g., `/dashboard`, `/portfolios`) and refresh the page to confirm SPA rewrites are working

### SPA Rewrite Configuration

The project includes a `vercel.json` file that configures SPA rewrites for client-side routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures that all routes (e.g., `/dashboard`, `/portfolios/PF-001`, `/admin`) are rewritten to `index.html`, allowing React Router to handle routing on the client side. Without this configuration, direct navigation to any route other than `/` would return a 404 error.

### Automatic Deployments

When connected to a Git repository, Vercel automatically deploys:

- **Production deployments** on every push to the `main` (or `master`) branch
- **Preview deployments** on every push to any other branch or pull request

Each preview deployment gets a unique URL for testing before merging.

---

## GitHub Integration with Vercel (CI/CD)

### Automatic Setup

When you import a GitHub repository into Vercel, the integration is configured automatically:

1. Vercel installs a GitHub App on your repository
2. Every push triggers a new deployment
3. Pull requests receive preview deployment URLs as comments
4. Deployment status checks appear on commits and PRs

### Branch Configuration

- **Production Branch:** `main` (configurable in Vercel project settings)
- **Preview Branches:** All other branches automatically receive preview deployments

### Build Checks

Each deployment runs the following steps:

1. `npm install` — installs all dependencies
2. `npm run build` — runs `vite build` to produce the `dist/` output
3. Static files from `dist/` are deployed to Vercel's CDN

If the build fails (e.g., due to a syntax error or missing dependency), the deployment is blocked and the failure is reported on the GitHub commit or pull request.

### Running Tests in CI

Vercel does not run tests by default during deployment. To add test execution before deployment, you can:

**Option A: Override the build command in Vercel project settings:**

```
npm test -- --run && npm run build
```

This runs the Vitest test suite (with `--run` for non-watch mode) before building. If any test fails, the build is aborted and the deployment is blocked.

**Option B: Use a GitHub Actions workflow:**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm test -- --run
      - run: npm run lint
```

This runs tests and linting on every push and pull request. Vercel handles the actual deployment separately.

---

## Static Hosting (Alternative)

For deployment to any static file server (Nginx, Apache, AWS S3 + CloudFront, Netlify, Cloudflare Pages, etc.):

### Build

```bash
npm install
npm run build
```

This produces a production-optimized build in the `dist/` directory.

### Serve

Serve the contents of `dist/` from your static file server. The critical requirement is that **all routes must be rewritten to `index.html`** for client-side routing to work.

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache Configuration Example

Create a `.htaccess` file in the `dist/` directory:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### AWS S3 + CloudFront

1. Upload the contents of `dist/` to an S3 bucket configured for static website hosting
2. Set the error document to `index.html` with a 200 status code
3. Configure CloudFront to forward all 404 responses to `index.html` with a 200 status code

### Netlify

Create a `netlify.toml` in the project root (or configure in the Netlify dashboard):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Cloudflare Pages

1. Connect your repository to Cloudflare Pages
2. Set the build command to `npm run build`
3. Set the output directory to `dist`
4. Cloudflare Pages handles SPA rewrites automatically

---

## Build Output

The `npm run build` command produces the following in the `dist/` directory:

```
dist/
├── index.html          # Entry point HTML file
├── vite.svg            # Favicon
└── assets/
    ├── index-[hash].js   # Bundled JavaScript (application code + dependencies)
    └── index-[hash].css  # Bundled CSS (Tailwind utilities + custom styles)
```

All assets are content-hashed for cache busting. The `index.html` file references these hashed assets, so browsers will always load the latest version after a deployment.

---

## Environment Variables

**No environment variables are required.** The application runs entirely in the browser using `localStorage` for data persistence. There are no API keys, secrets, database connection strings, or external service configurations needed.

If future extensions require environment variables, Vite uses the `VITE_` prefix convention:

- Define in `.env`, `.env.local`, `.env.production`, etc.
- Access in code via `import.meta.env.VITE_VARIABLE_NAME`
- In Vercel, add environment variables in the project settings dashboard

---

## Troubleshooting

### Routes return 404 on page refresh

The SPA rewrite is not configured. Ensure `vercel.json` is present in the project root with the rewrite rule, or configure your static file server to rewrite all routes to `index.html`.

### Build fails with out-of-memory error

Increase the Node.js memory limit:

```bash
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### localStorage is not available

The application requires `localStorage` to be enabled in the browser. If `localStorage` is disabled (e.g., in private browsing mode on some browsers), the application will display an initialization error with instructions to enable it.

### Application shows stale data after deployment

`localStorage` data persists across deployments since it is stored in the user's browser. Users can clear data from the Administration page (Data Controls tab) or by clearing their browser's site data.

---

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires `localStorage` to be enabled.

---

## Preview Production Build Locally

To preview the production build locally before deploying:

```bash
npm run build
npm run preview
```

This serves the `dist/` directory on `http://localhost:4173` with the same configuration as a production deployment.