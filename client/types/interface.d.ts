import mongoose, { Types } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  roles: ("participant" | "volunteer" | "admin" | "super_admin")[];
  passwordHash?: string;
  image?: string;
  avatar?: number;
  provider: "google" | "credentials";
  emailVerified?: Date;
  verified?: boolean;
  amongUsScore?: number;
  createdAt: Date;
  updatedAt: Date;
  fullName?: string;
  phoneNumber?: string;
  college?: string;
  stream?: string;
  isProfileComplete: boolean;
}

export interface IPoc {
  name: string;
  mobile: string;
}

export interface IEvent {
  eventName: string;
  category: "Software" | "Hardware" | "Entrepreneurship" | "Quiz" | "Gaming";
  "Design and Prototyping";
  date: string;
  time: string;
  duration: string;
  venue: string;
  description: string;
  banner?: string | null;
  rules: string[];
  clubs: string[];
  isTeamEvent: boolean;
  isActive: boolean;
  doc?: string;
  pocs: IPoc[];
  maxMembersPerTeam: number;
  minMembersPerTeam: number;
  teamLimit?: number;
  prizePool: number;
  isPaidEvent: boolean;
  isFoodProvided: boolean;
  maxFoodServingsPerParticipant: number;
  fees: number;
  registrations: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventProps {
  _id: Types.ObjectId;
  eventName: string;
  category:
  | "Software"
  | "Hardware"
  | "Entrepreneurship"
  | "Quiz"
  | "Gaming"
  | "Design and Prototyping";
  description: string;
  banner?: string | null;
  clubs: string[];
  __v: number;
}

const CATEGORIES = [
  "All",
  "Software",
  "Hardware",
  "Entrepreneurship",
  "Quiz",
  "Gaming",
  "Design and Prototyping",
] as const;

type Category = (typeof CATEGORIES)[number];

export interface PublicEventProps {
  _id: string;
  eventName: string;
  category: Exclude<Category, "All">;
  description: string;
  banner?: string | null;
  clubs: string[];
  date: string;
  time: string;
  venue: string;
  isTeamEvent: boolean;
  minMembersPerTeam: number;
  maxMembersPerTeam: number;
  prizePool: string;
  __v: number;
}

export interface EventByIdProps {
  _id: Types.ObjectId;
  eventName: string;
  category:
  | "Software"
  | "Hardware"
  | "Entrepreneurship"
  | "Quiz"
  | "Gaming"
  | "Design and Prototyping";
  description: string;
  banner?: string | null;
  rules: string[];
  clubs: string[];
  pocs: IPoc[];
  date: string;
  time: string;
  venue: string;
  isTeamEvent: boolean;
  membersPerTeam: number;
  prizePool: string;
  __v: number;
}

export interface IRegistration {
  eventId: Types.ObjectId;
  isInTeam: boolean;
  teamId?: Types.ObjectId;
  participant: Types.ObjectId;
  verified: boolean;
  checkedIn: boolean;
  checkedInAt?: Date;
  checkedInBy?: Types.ObjectId;
  foodServedCount: number;
  lastFoodServedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeam {
  eventId: Types.ObjectId;
  teamCode: string;
  teamName?: string;
  teamLeader: Types.ObjectId;
  team: Types.ObjectId[];
  paymentStatus?: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface RegiEventProps {
  _id: string;
  eventName: string;
  category:
  | "Software"
  | "Hardware"
  | "Entrepreneurship"
  | "Quiz"
  | "Gaming"
  | "Design and Prototyping";
  banner?: string | null;
  date: string;
  time: string;
  venue: string;
  minMembersPerTeam?: number;
  maxMembersPerTeam?: number;
  isPaidEvent?: boolean;
}

export interface Registration {
  _id: string;
  eventId: RegiEventProps;
  isInTeam: boolean;
  participant: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Team {
  _id: string;
  eventId: RegiEventProps;
  teamLeader:
  | string
  | {
    _id: string;
    username?: string;
    fullName?: string;
  };
  teamCode: string;
  teamName?: string;
  paymentStatus?: "pending" | "completed" | "failed";
  team: (
    | string
    | {
      _id: string;
      username?: string;
      fullName?: string;
    }
  )[];
  members?: {
    _id: string;
    username?: string;
    fullName?: string;
    isLeader: boolean;
  }[];
  teamSize?: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PopulatedTeamUser {
  _id: mongoose.Types.ObjectId;
  username?: string;
  fullName?: string;
}

export interface RegistrationLean {
  _id: mongoose.Types.ObjectId;
  isInTeam?: boolean;
  teamId?: mongoose.Types.ObjectId;
  verified?: boolean;
  createdAt?: Date;
}

export interface TeamLean {
  _id: mongoose.Types.ObjectId;
  teamCode: string;
  teamName?: string;
  teamLeader?: PopulatedTeamUser;
  team?: PopulatedTeamUser[];
  paymentStatus?: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface MyTeamResponse {
  _id: string;
  teamCode: string;
  teamName?: string;
  paymentStatus?: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  isTeamLeader?: boolean;
  members: {
    _id: string;
    username: string;
    fullName: string;
    isLeader: boolean;
  }[];
  teamSize: number;
}

export interface TeamMember {
  _id: string;
  username?: string;
  fullName?: string;
  isLeader?: boolean;
}

export interface TeamDetails {
  _id: string;
  teamCode: string;
  teamName?: string;
  teamSize: number;
  isTeamLeader?: boolean;
  paymentStatus?: "pending" | "completed" | "failed";
  members: TeamMember[];
}

export interface EventDetails {
  _id: string;
  eventName: string;
  category: string;
  date: string;
  time: string;
  duration?: string;
  venue: string;
  description: string;
  banner?: string;
  rules?: string[];
  clubs?: string[];
  pocs?: { name: string; mobile: string }[];
  isTeamEvent: boolean;
  isActive: boolean;
  doc?: string;
  minMembersPerTeam: number;
  maxMembersPerTeam: number;
  isPaidEvent: boolean;
  fees: number;
  prizePool: string;
  userRegistration?: {
    isRegistered: boolean;
    isInTeam: boolean;
    verified: boolean;
    registrationId?: string | null;
  };
  myTeam?: TeamDetails | null;
}

export interface ProfileData {
  username: string;
  avatar: number | null;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  college?: string;
  stream?: string;
  isProfileComplete?: boolean;
  qrPayload?: string;
}

export interface LeaderBoard {
  username?: string;
  fullName?: string;
  amongUsScore: number;
  avatar?: number;
}

export interface RuleSet {
  rules: string[];
}

export interface SoloCondition {
  type: "solo";
  unpaid: RuleSet;
  paid: RuleSet;
}

export interface TeamCondition {
  type: "team";
  team_creation: string[];
  team_joining: string[];
  unpaid: RuleSet;
  paid: RuleSet;
}

export type RegistrationCondition = SoloCondition | TeamCondition;

export interface EventRegistrationStep {
  step: number;
  title: string;
  rules?: string[];
  conditions?: RegistrationCondition;
}

export type EventRegistrationRules = EventRegistrationStep[];

export interface Partner {
  id: string;
  partner_name: string;
  partner_type: string;
  logo_url: string;
  website_url?: string;
}

interface HandCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface SeminarData {
  _id: string;
  title: string;
  speaker: string;
  speakerImage: string;
  speakerBio: string;
  description: string;
  speakerNote?: string;
  date: string;
  time: string;
  mode: "online" | "offline";
  venue?: string;
  meetLink?: string;
  maxRegistrations?: number;
  registrations?: string[];
  isActive?: boolean;
  isRegisterationNeeded?: boolean;
  club?: string;
}
