#!/usr/bin/env python3
"""
Upload a structured workout JSON to Garmin Connect via garth.
Reads workout JSON from stdin.

Environment variables required:
    GARMIN_EMAIL     - Garmin Connect email
    GARMIN_PASSWORD  - Garmin Connect password
"""

import sys
import json
import os


def main():
    email    = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")

    if not email or not password:
        print(json.dumps({"success": False, "error": "GARMIN_EMAIL and GARMIN_PASSWORD are required"}))
        sys.exit(1)

    try:
        workout_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid workout JSON: {e}"}))
        sys.exit(1)

    try:
        import garth
    except ImportError:
        print(json.dumps({"success": False, "error": "garth not installed — run: pip install garth"}))
        sys.exit(1)

    try:
        garth.login(email, password)
        response = garth.connectapi(
            "/workout-service/workout",
            method="POST",
            json=workout_data,
        )
        workout_id = response.get("workoutId") if isinstance(response, dict) else None
        print(json.dumps({"success": True, "workoutId": workout_id}))

    except Exception as e:
        msg = str(e)
        if "401" in msg or "credentials" in msg.lower() or "password" in msg.lower():
            msg = "Invalid Garmin credentials — check GARMIN_EMAIL and GARMIN_PASSWORD."
        print(json.dumps({"success": False, "error": msg}))
        sys.exit(1)


if __name__ == "__main__":
    main()
