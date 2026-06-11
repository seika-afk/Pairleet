import mongoose from "mongoose";

import User from "./models/User";
import SessionArchive from "./models/ServerArchive";

async function main() {
  await mongoose.connect(
    "mongodb+srv://artistnoob6_db_user:i9He0mqOL2y1LbGw@leetpair.y8p3lde.mongodb.net/?appName=leetpair",
  );

  console.log("Connected to MongoDB");

  const user = await User.create({
    clerkId: "clerk_test12_123",
    username: "sei",
  });

  console.log("User created:");
  console.log(user);

  const archive = await SessionArchive.create({
    sessionName: "Weekly Contest",

    startedAt: new Date(Date.now() - 1000 * 60 * 30),
    endedAt: new Date(),

    totalQuestions: 3,

    participants: [
      {
        userId: user._id,
        username: user.username,

        rank: 1,

        solved: 3,

        totalTime: 1800,
      },
    ],

    questions: [
      {
        title: "Two Sum",
        wasSolved: true,
        fastestSolvedBy: "seika",
      },
      {
        title: "Valid Parentheses",
        wasSolved: true,
        fastestSolvedBy: "seika",
      },
      {
        title: "Merge Intervals",
        wasSolved: false,
        fastestSolvedBy: "N/A",
      },
    ],
  });

  console.log("Archive created:");
  console.dir(archive, { depth: null });

  const foundArchives = await SessionArchive.find({
    "participants.userId": user._id,
  });

  console.log("Found archives:");
  console.dir(foundArchives, { depth: null });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
