export interface FestEvent {
  id: string;
  eventName: string;
  description: string;
  time: string;
  venue: string;
}

export interface FestDay {
  dayTitle: string;
  date: string;
  events: FestEvent[];
}

export const FEST_SCHEDULE: FestDay[] = [
  {
    dayTitle: "Day 1",
    date: "March 13, 2026",
    events: [
      {
        id: "d1-0",
        eventName: "INAUGURATION CEREMONY",
        description: "",
        time: "10:00 AM (1.5 hours)",
        venue: "SV Auditorium",
      },
      {
        id: "d1-1",
        eventName: "Brainstorm",
        description: "",
        time: "11:30 AM (2 hours)",
        venue: "ICTB07, ICTB09, ICTB10",
      },
      {
        id: "d1-2",
        eventName: "HydroLaunch",
        description: "",
        time: "10:00 AM (3 hours)",
        venue: "30 BIGHA",
      },
      {
        id: "d1-3",
        eventName: "Robo Dangal",
        description: "",
        time: "02:00 PM (4 hours)",
        venue: "Basketball Court",
      },
      {
        id: "d1-4",
        eventName: "Robo Race",
        description: "",
        time: "12:00 PM (5 hours)",
        venue: "Ground opposite to The Heritage College",
      },
      {
        id: "d1-5",
        eventName: "Solve the Maze",
        description: "",
        time: "10:00 AM (6 hours)",
        venue: "CB 607",
      },
      {
        id: "d1-6",
        eventName: "Circuitrix",
        description: "",
        time: "09:00 AM (5 hours)",
        venue: "SV Auditorium & CB 601",
      },
      {
        id: "d1-7",
        eventName: "VALORANT",
        description: "",
        time: "09:00 AM (10 hours)",
        venue: "ICTB02, ICTB03",
      },
      {
        id: "d1-8",
        eventName: "Hack Among Us",
        description: "",
        time: "08:30 AM (24 hours)",
        venue: "Central Library",
      },
      {
        id: "d1-9",
        eventName: "Skeld Sprint",
        description: "",
        time: "01:00 PM (3 hours)",
        venue: "CME 616",
      },
      {
        id: "d1-10",
        eventName: "Modelworks",
        description: "",
        time: "12:30 PM (1.5 hours)",
        venue: "CME 609",
      },
      {
        id: "d1-11",
        eventName: "Quiz Tank",
        description: "",
        time: "01:30 PM (3 hours)",
        venue: "Heritage Academy Auditorium",
      },
      {
        id: "d1-12",
        eventName: "CADventure",
        description: "",
        time: "10:00 AM (1.5 hours)",
        venue: "CME 609",
      },
      {
        id: "d1-13",
        eventName: "novaTechX",
        description: "",
        time: "01:00 PM (2.5 hours)",
        venue: "Executive Hall",
      },
      {
        id: "d1-14",
        eventName: "AI Protosprint",
        description: "",
        time: "09:00 AM (8 hours)",
        venue: "CME 108, CME117",
      },
      {
        id: "d1-15",
        eventName: "Cyber Quest",
        description: "",
        time: "11:00 AM (36 hours)",
        venue: "CB lobby and online",
      },
    ],
  },
  {
    dayTitle: "Day 2",
    date: "March 14, 2026",
    events: [
      {
        id: "d2-1",
        eventName: "TechTussle",
        description: "",
        time: "09:30 AM (3 hours)",
        venue: "CME108, CB505, CB506",
      },
      {
        id: "d2-2",
        eventName: "Robo War",
        description: "",
        time: "10:00 AM (8 hours)",
        venue: "Ground opposite to Nibedita Girls’ Hostel",
      },
      {
        id: "d2-3",
        eventName: "BGMI",
        description: "",
        time: "10:00 AM (5 hours)",
        venue: "CME 604, CME 605",
      },
      {
        id: "d2-4",
        eventName: "ModelForge",
        description: "",
        time: "11:00 AM (6 hours)",
        venue: "CB509, CB507",
      },
      {
        id: "d2-5",
        eventName: "Startup Expo",
        description: "",
        time: "11:00 AM (5 hours)",
        venue: "Executive Hall",
      },
      {
        id: "d2-6",
        eventName: "Loadrix",
        description: "",
        time: "11:00 AM (3 hours)",
        venue: "CME207 (ED LAB), CME213",
      },
      {
        id: "d2-7",
        eventName: "Sci-Charades",
        description: "",
        time: "10:00 AM (3 hours)",
        venue: "Basketball Court",
      },
      {
        id: "d2-8",
        eventName: "Vibe-A-Thon",
        description: "",
        time: "09:00 AM (6 hours)",
        venue: "Heritage Academy Auditorium",
      },
      {
        id: "d2-9",
        eventName: "Mélange",
        description: "",
        time: "01:00 PM (3 hours)",
        venue: "CME 108, CME117",
      },
      {
        id: "d2-10",
        eventName: "Solve the Maze",
        description: "",
        time: "10:00 AM (6 hours)",
        venue: "CB607",
      },
      {
        id: "d2-11",
        eventName: "Robo Dangal",
        description: "",
        time: "01:00 PM (4 hours)",
        venue: "Basketball Court",
      },
      {
        id: "d2-12",
        eventName: "CLOSING CEREMONY",
        description: "",
        time: "05:30 PM (1.2 hours)",
        venue: "SV Auditorium",
      },
      {
        id: "d2-13",
        eventName: "CULTURAL NIGHT",
        description: "",
        time: "07:00 PM",
        venue: "SURPRISE",
      },
    ],
  },
];