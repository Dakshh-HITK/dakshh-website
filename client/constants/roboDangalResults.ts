/**
 * Hardcoded ROBO DANGAL results with sub-events.
 * Verify against DB using: python scripts/verify_robo_dangal_teams.py
 */
export const ROBO_DANGAL_HARDCODED = {
  eventName: "ROBO DANGAL",
  prizePool: "₹18k",
  subEvents: [
    {
      name: "Bot Pursuit",
      prize: "₹4k + ₹2k",
      winner: { teamName: "KAAL", members: ["Hitesh Kumar", "Gaurav Sau"] },
      runnerUp: {
        teamName: "BHAIRAV",
        members: ["Vinay Malik", "Akanshi Sharma"],
      },
    },
    {
      name: "Tug and Tussle",
      prize: "₹4k + ₹2k",
      winner: { teamName: "ASMR", members: ["Shubham Roy"] },
      runnerUp: {
        teamName: "CRATUS",
        members: ["Deep Ghosh", "Deep Samanta", "Sapra Kanti Maity"],
      },
    },
    {
      name: "Torque Wars",
      prize: "₹4k + ₹2k",
      winner: {
        teamName: "BUMBLEBEE",
        members: [
          "Aritra Mukherjee",
          "Triparna Misra",
          "Shauryaveer Singh",
        ],
      },
      runnerUp: {
        teamName: "NITRO THUNDER 3.0",
        members: ["Samanwita Sardar", "Md Rahimuddin", "Ajmal Hossain"],
      },
    },
  ],
} as const;
