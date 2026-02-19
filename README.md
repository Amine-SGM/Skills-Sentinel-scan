# Skill Sentinel Scan

A Dockerized security scanner for AI skills and agents. Detects malicious patterns, supply chain risks, and permission overreach.

## Architecture

- **Scanner Service**: Python FastAPI backend performing 11 security checks (Static Analysis + Dynamic Sandboxing).
    - Uses `bandit` and `semgrep` for static analysis.
    - Uses Docker-in-Docker to sandbox and inspect execution/installation risks.
- **Frontend Service**: React/Next.js UI for uploading skills and viewing reports.

## Prerequisites

- Docker Desktop (or Docker Engine) installed and running.
- Git.

## Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/skill-sentinel-scan.git
    cd skill-sentinel-scan
    ```

2.  **Start the services:**
    ```bash
    docker-compose up --build
    ```

3.  **Access the UI:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

4.  **Scan a Skill:**
    Upload a `.zip` file containing your skill code, or individual `.py` / `.js` files.

## Development

- **Scanner**: Located in `scanner/`. Run locally with `uvicorn main:app --reload` (requires local pip dependencies).
- **Frontend**: Located in `frontend/`. Run locally with `npm run dev` (requires Node.js).
