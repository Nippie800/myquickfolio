import json
from pathlib import Path
from xml.sax.saxutils import escape

from flask import Flask, Response, abort, render_template, send_from_directory, url_for

app = Flask(
    __name__,
    static_folder="public/static",
    static_url_path="/static",
)

PROJECTS_FILE = Path(app.root_path) / "data" / "projects.json"
PUBLIC_FOLDER = Path(app.root_path) / "public"
RESUME_FOLDER = PUBLIC_FOLDER / "resume"
RESUME_FILENAME = "Annele_Ndlovu_Resume.pdf"
OG_IMAGE_FILENAME = "og-image.png"


def load_projects():
    """Load all portfolio projects from the JSON data file."""
    with PROJECTS_FILE.open(encoding="utf-8") as file:
        return json.load(file)


@app.context_processor
def portfolio_assets():
    """Expose portfolio asset URLs and optional social imagery."""
    og_image_path = PUBLIC_FOLDER / OG_IMAGE_FILENAME
    return {
        "resume_url": url_for("resume_download"),
        "og_image_available": og_image_path.is_file(),
        "og_image_url": url_for("og_image", _external=True),
    }


@app.after_request
def add_security_headers(response):
    """Apply conservative browser protections without changing site behaviour."""
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    response.headers.setdefault(
        "Content-Security-Policy",
        "default-src 'self'; img-src 'self' data:; style-src 'self'; "
        "script-src 'self'; font-src 'self'; connect-src 'self'; "
        "base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    )
    return response


@app.get("/")
def home():
    projects = load_projects()
    return render_template("index.html", projects=projects)


@app.get("/projects/<string:slug>")
def project_detail(slug):
    projects = load_projects()

    project_index = next(
        (index for index, item in enumerate(projects) if item["slug"] == slug),
        None,
    )

    if project_index is None:
        abort(404)

    project = projects[project_index]
    previous_project = projects[(project_index - 1) % len(projects)]
    next_project = projects[(project_index + 1) % len(projects)]

    return render_template(
        "project.html",
        project=project,
        previous_project=previous_project,
        next_project=next_project,
        page_image_url=(
            url_for("static", filename=project["cover_image"], _external=True)
            if project.get("cover_image")
            else None
        ),
    )


@app.get("/resume/Annele_Ndlovu_Resume.pdf")
def resume_download():
    """Serve the résumé at a stable, recruiter-friendly URL when supplied."""
    resume_path = RESUME_FOLDER / RESUME_FILENAME
    if not resume_path.is_file():
        abort(404)

    return send_from_directory(
        RESUME_FOLDER,
        RESUME_FILENAME,
        as_attachment=True,
        download_name=RESUME_FILENAME,
    )


@app.get("/og-image.png")
def og_image():
    """Serve the optional production social preview from the public root."""
    image_path = PUBLIC_FOLDER / OG_IMAGE_FILENAME
    if not image_path.is_file():
        abort(404)
    return send_from_directory(PUBLIC_FOLDER, OG_IMAGE_FILENAME)


@app.get("/robots.txt")
def robots():
    sitemap_url = url_for("sitemap", _external=True)
    return Response(
        f"User-agent: *\nAllow: /\nSitemap: {sitemap_url}\n",
        mimetype="text/plain",
    )


@app.get("/sitemap.xml")
def sitemap():
    project_urls = [
        url_for("project_detail", slug=project["slug"], _external=True)
        for project in load_projects()
    ]
    urls = [url_for("home", _external=True), *project_urls]
    entries = "".join(f"<url><loc>{escape(url)}</loc></url>" for url in urls)
    return Response(
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{entries}</urlset>',
        mimetype="application/xml",
    )


@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
