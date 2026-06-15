# lolosposaro.github.io

Personal portfolio site for Lorenzo Sposaro — Senior DevOps & Platform Engineer. Deployed as a static site on GitHub Pages and self-hostable via Docker.

Live at: **[lolosposaro.github.io](https://lolosposaro.github.io)**

---

## What it is

A single-page portfolio with five sections:

| Section | What's there |
|---|---|
| **Hero** | Name, rotating typed title, CV download, links |
| **About** | Bio, animated stat counters (years, Helm charts, etc.) |
| **Experience** | Timeline of roles at Globant across British Airways, LaLiga, Oportun, and others |
| **Skills** | Categorised skill grid with Devicon icons (Cloud, K8s, IaC, CI/CD, Observability…) |
| **Work** | Featured project cards: self-service-cli, multicluster-mesh, cdn-platform, helm-platform |
| **Contact** | Email, LinkedIn, GitHub links |

---

## How it works

Everything is plain HTML, CSS, and vanilla JavaScript — no build step, no framework.

**`index.html`** — the entire page. All sections live here.

**`assets/css/styles.css`** — all styles (compiled from `assets/scss/`). Responsive layout via CSS custom properties and media queries.

**`assets/js/main.js`** — four runtime behaviours:
- **Mobile nav** — hamburger toggle with icon swap
- **Active nav highlight** — `IntersectionObserver` marks the current section's nav link
- **Scroll reveal** — `.reveal` elements fade/slide in with staggered `transitionDelay`
- **Typed effect** — cycles through role titles (Senior DevOps Engineer → Platform Engineer → Cloud Architect → SRE) character by character
- **Counter animation** — stat numbers count up with an ease-out curve when the stats block scrolls into view

**`assets/public/`** — CV PDF served directly from the nav and hero CTA.

---

## Running locally

### Option 1 — any static file server

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080`.

### Option 2 — Docker

```bash
docker build -t portfolio .
docker run -p 8080:80 portfolio
```

The image is `nginx:alpine` serving the static files. Custom Nginx config lives in `config/nginx/nginx.conf`.

### Option 3 — GitHub Pages

Push to the `master` branch. GitHub Pages serves `index.html` from the repo root automatically.

---

## Project structure

```
.
├── index.html              # Full single-page app
├── Dockerfile              # nginx:alpine static server
├── config/
│   └── nginx/nginx.conf    # Nginx config for Docker
├── terraform/
│   └── k8s/                # Kubernetes manifests (WIP)
└── assets/
    ├── css/styles.css      # Compiled styles
    ├── scss/               # Source styles
    ├── js/main.js          # All interactivity
    └── public/             # CV PDF and static assets
```

---

## Tech used

- **Fonts**: Inter + JetBrains Mono (Google Fonts)
- **Icons**: [Devicon](https://devicon.dev/) · [Boxicons](https://boxicons.com/)
- **Hosting**: GitHub Pages
- **Container**: nginx:alpine via Docker
