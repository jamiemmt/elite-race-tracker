#!/usr/bin/env python3
"""
Upload a Garmin workout JSON to Garmin Connect.

Usage:
    echo '<workout_json>' | python3 upload_workout.py

Environment variables required:
    GARMIN_EMAIL     - Your Garmin Connect email
    GARMIN_PASSWORD  - Your Garmin Connect password

Install dependency:
    pip install garminconnect
"""

import sys
import json
import os


def main():
    email = os.environ.get("GARMIN_EMAIL")
    password = os.environ.get("GARMIN_PASSWORD")

    if not email or not password:
        error = {"success": False, "error": "GARMIN_EMAIL and GARMIN_PASSWORD environment variables are required"}
        print(json.dumps(error))
        sys.exit(1)

    try:
        from garminconnect import Garmin
    except ImportError:
        error = {"success": False, "error": "garminconnect not installed. Run: pip install garminconnect"}
        print(json.dumps(error))
        sys.exit(1)

    try:
        workout_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        error = {"success": False, "error": f"Invalid workout JSON: {e}"}
        print(json.dumps(error))
        sys.exit(1)

    try:
        client = Garmin(email, password)
        client.login()
        result = client.add_workout(workout_data)
        workout_id = result.get("workoutId") if isinstance(result, dict) else None
        print(json.dumps({"success": True, "workoutId": workout_id}))
    except Exception as e:
        error_msg = str(e)
        if "Invalid credentials" in error_msg or "401" in error_msg:
            error_msg = "Invalid Garmin credentials. Check GARMIN_EMAIL and GARMIN_PASSWORD."
        print(json.dumps({"success": False, "error": error_msg}))
        sys.exit(1)


if __name__ == "__main__":
    main()
