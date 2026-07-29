import json
from pathlib import Path

from flask import Flask, abort, render_template

app = Flask(__name__)

PROJECTS_FILE = Path(app.root_path) / "data" / "projects.json"
RESUME_FILENAME = "documents/annele-ndlovu-resume.pdf"


def load_projects():
    """Load all portfolio projects from the JSON data file."""
    with PROJECTS_FILE.open(encoding="utf-8") as file:
        return json.load(file)


@app.context_processor
def portfolio_assets():
    """Expose optional portfolio assets without creating broken download links."""
    resume_path = Path(app.static_folder) / RESUME_FILENAME
    return {
        "resume_available": resume_path.is_file(),
        "resume_filename": RESUME_FILENAME,
    }


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
    )


@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)
