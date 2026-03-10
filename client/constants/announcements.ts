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
            "The lobby is filling up fast, and the Start Countdown has begun. To ensure everyone is ready for departure, we are closing registration for our 24 events one by one.",
            "Complete your registration and JOIN THE CREW before the timer runs out. Head over to the website now to secure your spot before the mission officially launches!",
            "HURRY UP! And don't be ejected for fun 😉"
        ],
    },  
    {
        id: "2",
        event_name: "Dakshh 2026 Registrations",
        club_name: "Dakshh Org Comm",
        messages: [
            "All participants registering for paid events are hereby requested to complete their payments to verify their registrations.",
            "Teams/Participants that are not verified before the day of the event will be considered invalid, and they will not be permitted to partake in the event."
        ],
    },
    {
        id: "3",
        event_name: "Dakshh 2026 Registrations",
        club_name: "Dakshh Org Comm",
        messages: [
            "All participants registering for paid events are requested to use the SAME EMAIL ADDRESS and EXACTLY SAME TEAM NAME for payment that they used to log into our platform and create a team/register in an event."
        ],
    },
    {
        id: "4",
        event_name: "Dakshh 2026 Registrations",
        club_name: "Dakshh Org Comm",
        messages: [
            "Participants may register for multiple events even if their timings clash. Allocation of appropriate time slots for such participants will be managed by the Event Heads and the Organizing Committee, subject to feasibility."
        ],
    }
];
