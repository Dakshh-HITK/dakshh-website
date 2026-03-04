import mongoose from "mongoose";
import Seminar from "../client/lib/models/Seminar.ts";
import dotenv from "dotenv";
dotenv.config();

const seminarsData = [
  {
    title: "Quantum Computing: The Next Frontier",
    club: "Robotics Club",
    speaker: "Subham Bhattacharya",
    speakerImage:
      "https://res.cloudinary.com/dnil7l0j1/image/upload/v1772562170/Shubham_iokifq.jpg",
    speakerBio:
      "Subham Bhattacharya is a Software Engineer at ABP and a 4x Hackathon Winner. He is passionate about Cyber Security, Machine Learning, and Full Stack Development. An AI/ML enthusiast and exploit developer, he enjoys building innovative, user-centric applications and actively works on cutting-edge technology solutions.",
    description:
      "Explore the fascinating world of quantum computing and its potential to revolutionize modern technology. This session will introduce core concepts of quantum computation and discuss its future impact on AI, cybersecurity, and advanced robotics.",
    speakerNote:
      "Bring your curiosity and questions about emerging technologies and the quantum realm!",
    dateTime: new Date("2026-03-14T10:00:00"),
    mode: "offline",
    venue: "SV Auditorium, CB Building",
    isActive: true,
    isRegisterationNeeded: true,
    registrations: [],
  },
  // {
  //   title: "AI Ethics in Modern Society",
  //   speaker: "Prof. Sisir Kumar Das",
  //   speakerImage: "/peeking2.png",
  //   speakerBio:
  //     "Professor Sisir Kumar Das specializes in AI governance, ethics, and policy frameworks for responsible machine learning systems.",
  //   description:
  //     "A deep dive into the ethical implications of artificial intelligence and responsible AI development.",
  //   dateTime: new Date("2026-03-22T19:00:00"),
  //   mode: "offline",
  //   venue: "SV Auditorium, CB Building",
  //   isActive: true,
  //   isRegisterationNeeded: false,
  //   registrations: [],
  // },
  // {
  //   title: "Blockchain and Cryptocurrency Fundamentals",
  //   speaker: "Ms. Riya Sen",
  //   speakerImage: "/peeking.png",
  //   speakerBio:
  //     "Riya Sen is a blockchain consultant helping startups build secure decentralized applications.",
  //   description: "Understanding blockchain technology and crypto fundamentals.",
  //   dateTime: new Date("2026-02-10T18:00:00"),
  //   mode: "offline",
  //   venue: "ICT, Room 302",
  //   isActive: false,
  //   isRegisterationNeeded: true,
  //   registrations: [],
  // },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    for (const seminar of seminarsData) {
      const exists = await Seminar.findOne({ title: seminar.title });

      if (!exists) {
        await Seminar.create(seminar);
        console.log(`✅ Added: ${seminar.title}`);
      } else {
        console.log(`⚠️ Already exists: ${seminar.title}`);
      }
    }

    console.log("🚀 Seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
}

seed();