# gBigRelease 🚀

gBigRelease is a sleek, high-fidelity web application built with Python Flask and plain vanilla web technologies (HTML, CSS, JavaScript) that allows developers to explore, search, filter, and share Google Cloud BigQuery release notes.

## ✨ Features

- **Live Feeds Ingestion**: Fetches updates directly from the official Google Cloud BigQuery Atom feed.
- **Decomposed Card Feed**: Automatically parses entries containing multiple updates (e.g. mixed Features, Changes, and Deprecations) and splits them into distinct visual cards.
- **Dynamic Search & Filtering**: Instant frontend search with category filters (Features, Changes, and Deprecations).
- **Tweet Composer Modal**: Customize and preview your update draft before sharing it on X (formerly Twitter), automatically verified against the 280-character limit.
- **Premium Glassmorphic Design**: Curated HSL color palette, dark mode support, and smooth micro-animations.

## 📁 Repository Structure

```text
gBigRelease/
├── app.py                  # Flask Application Server (Backend)
├── .gitignore              # Git ignore configuration
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Dashboard & Modal layout (Frontend)
└── static/
    ├── css/
    │   └── style.css       # Premium custom styling
    └── js/
        └── app.js          # Core dynamic parser & events
```

## 🛠️ Getting Started

### Prerequisites

- Python 3.8 or higher installed on your machine.
- Pip (Python Package Installer).

### Installation

1. Clone this repository (if not already done):
   ```bash
   git clone https://github.com/subinsam22/Agent-event-talks-app.git
   cd Agent-event-talks-app
   ```

2. Install dependencies:
   ```bash
   pip install Flask
   ```

### Running Locally

1. Start the Flask application server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```text
   http://127.0.0.1:5000
   ```

## 🔗 How It Works (Request / Response Flow)

1. The Flask server serves `index.html` at the `/` route.
2. The browser loads the custom frontend styling ([style.css](static/css/style.css)) and logic ([app.js](static/js/app.js)).
3. The client calls `/api/releases`, triggering `app.py` to fetch Google's BigQuery RSS feed, bypass CORS, and structure the XML response into a clean JSON array.
4. The client engine processes each entry, breaks down multiple updates using a local HTML parser, and renders them to the user.
