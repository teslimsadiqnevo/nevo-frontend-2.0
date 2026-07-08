# lib/gemini — intentionally empty

**Gemini is never called from the frontend.** All AI processing goes through the
backend's Gemini gateway (FE Architecture §9): the frontend sends data to FastAPI
endpoints, FastAPI calls Gemini where needed, and the frontend receives processed
results.

This keeps API keys secure, enables cost tracking, and enforces Zero-Tag
compliance at the backend level before anything reaches the client.

This folder exists only to make that boundary explicit in the project structure.
