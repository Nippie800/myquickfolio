# Quickfolio

A responsive, project-focused portfolio for Annele Ndlovu, built with Python and Flask.

## Development

Create and activate a virtual environment, then install the dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

## Content and public assets

- Project content lives in `data/projects.json`.
- Vercel-served assets live in `public/`; Flask exposes `public/static/` locally at `/static/`.
- Add the real résumé at `public/resume/Annele_Ndlovu_Resume.pdf`. The site hides the download links until this file exists.
- Add a 1200 × 630 social preview at `public/og-image.png`. Open Graph and Twitter image metadata is enabled automatically when this file exists.

## Verification

```powershell
python -m compileall -q app.py
python -m flask --app app routes
python -m pip check
```

## Vercel deployment

Vercel detects the root-level Flask `app` in `app.py` automatically. No build command, output directory, environment variables, or `vercel.json` are required.

With Vercel CLI 48.2.10 or newer installed and authenticated:

```powershell
vercel --prod
```
