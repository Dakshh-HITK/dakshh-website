// import { EventRegistrationRules } from "@/types/interface";

// export const EVENT_REGISTRATION_RULES: EventRegistrationRules = [

//   {
//     step: 1,
//     title: "User Registration Requirement",
//     rules: [
//       "User must be registered on the platform.",
//       "Unregistered users cannot access event details or register for events."
//     ]
//   },

//   {
//     step: 2,
//     title: "Profile Completion Requirement",
//     rules: [
//       "User must complete their profile after registration.",
//       "Profile completion is mandatory before any event registration."
//     ]
//   },

//   {
//     step: 3,
//     title: "Event Exploration",
//     rules: [
//       "After registration, user can browse the event list page.",
//       "User may visit individual event pages based on interest.",
//       "Each event page will contain full details including: Event description, Event rules, Points of Contact (POCs), Payment requirement status (Paid / Unpaid), Team requirement status (Solo / Team)"
//     ]
//   },

//   {
//     step: 4,
//     title: "Solo Event Registration",
//     conditions: {

//       unpaid: {
//         rules: [
//           "User clicks on 'Register'.",
//           "Registration is immediately confirmed.",
//           "Event appears under Profile > Events tab.",
//           "Status is marked as 'Verified'."
//         ]
//       },

//       paid: {
//         rules: [
//           "User clicks on 'Register'.",
//           "User is redirected to the payment gateway.",
//           "User must complete all required payment fields.",
//           "After successful payment, a receipt is generated.",
//           "User should take a screenshot of the receipt for reference.",
//           "Event appears under Profile > Events tab.",
//           "Status is marked as 'Pending'.",
//           "Verification takes 1–3 working days.",
//           "After verification, status changes to 'Verified'."
//         ]
//       }

//     }
//   },

//   {
//     step: 5,
//     title: "Team Event Registration",
//     rules: [
//       "User must either create a team or join an existing team.",
//       "Only the Team Lead is allowed to complete final registration.",
//       "Minimum required team size must be fulfilled before registration is allowed."
//     ],

//     conditions: {

//       team_creation: [
//         "Team Lead clicks 'Create Team'.",
//         "Team Lead provides a team name.",
//         "System generates a unique Team ID.",
//         "Team Lead shares the Team ID with members."
//       ],

//       team_joining: [
//         "Team Member logs into their own account.",
//         "Team Member navigates to the same event page.",
//         "Team Member clicks 'Join Team'.",
//         "Team Member enters the Team ID to join."
//       ],

//       unpaid: {
//         rules: [
//           "Once minimum team size is reached, Team Lead can click 'Register'.",
//           "Registration is immediately confirmed.",
//           "Event appears under Profile > Teams and Events tab for all members.",
//           "Status is marked as 'Verified' for all team members."
//         ]
//       },

//       paid: {
//         rules: [
//           "Once minimum team size is reached, Team Lead can click 'Register'.",
//           "Only Team Lead is redirected to the payment gateway.",
//           "Team Lead completes payment process.",
//           "Payment receipt is generated.",
//           "Team Lead should take a screenshot of the receipt.",
//           "Event appears under Profile > Teams and Events tab for all members.",
//           "Status is marked as 'Pending'.",
//           "Verification takes 1–3 working days.",
//           "After verification, status changes to 'Verified' for all members."
//         ]
//       }

//     }
//   },

//   {
//     step: 6,
//     title: "Payment Restrictions",
//     rules: [
//       "Do NOT make duplicate payments for any event.",
//       "Only Team Lead is authorized to make payment in team events.",
//       "Team members must NOT attempt separate payments.",
//       "After payment, all team members can view status in their respective profile pages."
//     ]
//   }
// ];

import { EventRegistrationRules } from "@/types/interface";

export const EVENT_REGISTRATION_RULES: EventRegistrationRules = [
  {
    step: 1,
    title: "User Registration Requirement",
    rules: [
      "User must be registered on the platform.",
      "Unregistered users cannot access event details or register for events."
    ]
  },

  {
    step: 2,
    title: "Profile Completion Requirement",
    rules: [
      "User must complete their profile after registration.",
      "Profile completion is mandatory before any event registration."
    ]
  },

  {
    step: 3,
    title: "Event Exploration",
    rules: [
      "After registration, user can browse the event list page.",
      "User may visit individual event pages based on interest.",
      "Each event page will contain full details including: Event description, Event rules, POCs, Payment status (Paid / Unpaid), Team type (Solo / Team)"
    ]
  },

  /* ---------------- SOLO EVENT ---------------- */

  {
    step: 4,
    title: "Solo Event Registration",
    conditions: {
      type: "solo",

      unpaid: {
        rules: [
          "User clicks on 'Register'.",
          "Registration is immediately confirmed.",
          "Event appears under Profile > Events tab.",
          "Status is marked as 'Verified'."
        ]
      },

      paid: {
        rules: [
          "User clicks on 'Register'.",
          "User is redirected to payment gateway.",
          "User completes payment fields.",
          "Receipt is generated.",
          "User should keep payment proof.",
          "Event appears under Profile > Events tab.",
          "Status is marked as 'Pending'.",
          "Verification takes 1–3 working days.",
          "After verification, status becomes 'Verified'."
        ]
      }
    }
  },

  /* ---------------- TEAM EVENT ---------------- */

  {
    step: 5,
    title: "Team Event Registration",
    rules: [
      "User must create or join a team.",
      "Only Team Lead can complete registration.",
      "Minimum team size must be satisfied."
    ],

    conditions: {
      type: "team",

      team_creation: [
        "Team Lead clicks 'Create Team'.",
        "Provides team name.",
        "System generates unique Team ID.",
        "Team ID is shared with members."
      ],

      team_joining: [
        "Member logs into their account.",
        "Navigates to event page.",
        "Clicks 'Join Team'.",
        "Enters Team ID."
      ],

      unpaid: {
        rules: [
          "After minimum size is reached, Team Lead clicks 'Register'.",
          "Registration is confirmed instantly.",
          "Event appears under Teams tab for all members.",
          "Status marked 'Verified'."
        ]
      },

      paid: {
        rules: [
          "After minimum size is reached, Team Lead clicks 'Register'.",
          "Only Team Lead is redirected to payment.",
          "Team Lead completes payment.",
          "Receipt is generated.",
          "Event appears under Teams tab for all members.",
          "Status marked 'Pending'.",
          "Verification takes 1-3 working days.",
          "Status becomes 'Verified' for all members."
        ]
      }
    }
  },

  {
    step: 6,
    title: "Payment Restrictions",
    rules: [
      "Do NOT make duplicate payments.",
      "Only Team Lead can pay for team events.",
      "Team members must not pay separately.",
      "All members can view status in profile."
    ]
  }
];