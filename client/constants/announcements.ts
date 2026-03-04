export interface Announcement {
    id: string;
    event_name: string;
    club_name: string;
    messages: string[];
}

export const announcements: Announcement[] = [
    {
        id: "1",
        event_name: "Dakshh 2026 Registrations",
        club_name: "Dakshh Org Comm",
        messages: [
            "All participants registering for paid events are hereby requested to complete their payments to verify their registrations.",
            "Teams/Participants that are not verified before the day of the event will be considered invalid, and they will not be permitted to partake in the event."
        ],
    },
    {
        id: "2",
        event_name: "Dakshh 2026 Registrations",
        club_name: "Dakshh Org Comm",
        messages: [
            "All participants registering for paid events are requested to use the SAME EMAIL ADDRESS and EXACTLY SAME TEAM NAME for payment that they used to log into our platform and create a team/register in an event."
        ],
    }
];
