import json
from pathlib import Path

from flask import Flask, abort, render_template

app = Flask(__name__)

PROJECTS_FILE = Path(app.root_path) / "data" / "projects.json"


def load_projects():
    """Load all portfolio projects from the JSON data file."""
    with PROJECTS_FILE.open(encoding="utf-8") as file:
        return json.load(file)


@app.get("/")
def home():
    projects = load_projects()
    return render_template("index.html", projects=projects)


@app.get("/projects/<string:slug>")
def project_detail(slug):
    projects = load_projects()

    project = next(
        (item for item in projects if item["slug"] == slug),
        None,
    )

    if project is None:
        abort(404)

    return render_template("project.html", project=project)


@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(debug=True)