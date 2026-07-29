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
