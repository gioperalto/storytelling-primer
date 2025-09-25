# Storytelling Tactics

The "Storyteller Tactics" framework is a structured, card-based system developed to address a fundamental challenge in modern professional communication: the ineffectiveness of data-heavy, jargon-filled presentations and business conversations.

By providing a curated toolkit of 54 "storytelling recipes" in a tactile, card-deck format, the system offers a step-by-step guide to building powerful stories.

## Prereqs
1. Docker (needed to run docker containers)
2. NodeJS (Vite frontend)
3. Python (Flask backend)

## Setup

1. Populate an `.env` file at the root of your project with:
    - `DD_ENV` (`dev|prod`)
    - `DD_API_KEY` (can be obtained from Datadog website)
2. Populate an `.env` file in the `frontend` project with:
    - `VITE_API_BASE_URL` (URL to your API)

## Startup

1. `docker compose up -d` (will spin up the frontend, datadog agent sidecar, api server)
