from pymongo import MongoClient
from openpyxl import Workbook
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")


def export_team_validation_report():
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]

    teams_collection = db["teams"]

    # Aggregate: populate event + team leader
    pipeline = [
        {
            "$lookup": {
                "from": "events",
                "localField": "eventId",
                "foreignField": "_id",
                "as": "eventData"
            }
        },
        {"$unwind": "$eventData"},
        {
            "$lookup": {
                "from": "users",
                "localField": "teamLeader",
                "foreignField": "_id",
                "as": "leaderData"
            }
        },
        {"$unwind": "$leaderData"},
    ]

    teams = list(teams_collection.aggregate(pipeline))

    wb = Workbook()
    ws = wb.active
    ws.title = "Team Validation Report"

    # Headers
    headers = [
        "Team Code",
        "Team Name",
        "Event Name",
        "Team Leader Name",
        "Total Members",
        "Minimum Required Members",
        "Maximum Allowed Members",
        "Payment Status",
        "Validation Status"
    ]

    ws.append(headers)

    for team in teams:
        team_code = team.get("teamCode", "")
        team_name = team.get("teamName", "")
        event_name = team["eventData"].get("eventName", "")
        leader_name = team["leaderData"].get("name", "Unknown")

        members = team.get("team", [])
        current_count = len(members)

        min_required = team["eventData"].get("minMembersPerTeam", 1)
        max_allowed = team["eventData"].get("maxMembersPerTeam", "")
        payment_status = team.get("paymentStatus", "N/A")

        status = "VALID" if current_count >= min_required else "INCOMPLETE"

        ws.append([
            team_code,
            team_name,
            event_name,
            leader_name,
            current_count,
            min_required,
            max_allowed,
            payment_status,
            status
        ])

    # Auto adjust column width
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            if cell.value:
                max_length = max(max_length, len(str(cell.value)))
        ws.column_dimensions[column_letter].width = max_length + 2

    filename = f"team_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    wb.save(filename)

    client.close()

    print(f"\n✅ Report exported successfully: {filename}")


if __name__ == "__main__":
    export_team_validation_report()