export interface Announcement {
    id: string;
    event_name: string;
    club_name: string;
    messages: string[];
}

export const announcements: Announcement[] = [
    {
        id: "1",
        event_name: "Code Wars",
        club_name: "ByteForce Club",
        messages: [
            "Round 1 qualifiers start on March 14th at 10:00 AM.",
            "Teams of up to 3 members allowed. Register before March 12th!",
        ],
    },
    {
        id: "2",
        event_name: "RoboRumble",
        club_name: "Mechnauts Society",
        messages: [
            "Bot weigh-in and inspection will be held on March 13th, 4:00 PM at Lab 3.",
        ],
    },
    {
        id: "3",
        event_name: "UI/UX Showdown",
        club_name: "Design Den",
        messages: [
            "Theme reveal at 11:00 AM on March 14th. Bring your own laptops.",
            "Figma and Adobe XD both accepted.",
        ],
    },
    {
        id: "4",
        event_name: "Capture The Flag",
        club_name: "CyberSec Alliance",
        messages: [
            "CTF portal goes live on March 13th at 6:00 PM.",
            "Solo participation only. Prizes for top 5 scorers!",
        ],
    },
    {
        id: "5",
        event_name: "Pitch Perfect",
        club_name: "E-Cell",
        messages: [
            "Submit your business pitch deck by March 12th, 11:59 PM.",
            "Shortlisted teams will present live on March 15th.",
        ],
    },
    {
        id: "6",
        event_name: "AI Art Gallery",
        club_name: "Neural Nexus",
        messages: [
            "Submit AI-generated artworks before March 13th.",
            "Voting opens to all attendees on festival day!",
        ],
    },
    {
        id: "7",
        event_name: "Circuit Breaker",
        club_name: "Electronix Club",
        messages: [
            "Components will be provided on-site. Event starts at 2:00 PM, March 14th.",
        ],
    },
    {
        id: "8",
        event_name: "Data Dash",
        club_name: "Analytics Hub",
        messages: [
            "Kaggle-style data challenge. Dataset drops on March 14th at 9:00 AM.",
            "Leaderboard updates every hour. Final submission by 5:00 PM.",
        ],
    },
    {
        id: "9",
        event_name: "Game Jam",
        club_name: "Pixel Pirates",
        messages: [
            "48-hour game development marathon begins March 13th, 8:00 PM.",
            "All engines welcome — Unity, Godot, Unreal, and more.",
            "Snacks and energy drinks provided!",
        ],
    },

];
