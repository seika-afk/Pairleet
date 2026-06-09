import { Schema, model, models } from "mongoose";

const SessionArchiveSchema = new Schema(
  {
    sessionName: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        username: {
          type: String,
          required: true,
        },

        rank: {
          type: Number,
          required: true,
        },

        solved: {
          type: Number,
          default: 0,
        },

        totalTime: {
          type: Number,
          default: 0,
        },
      },
    ],

    totalQuestions: {
      type: Number,
      required: true,
    },
    questions: [
      {
        title: { type: String, required: true },
        wasSolved: { type: Boolean, required: true },
        fastestSolvedBy: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default models.SessionArchive ||
  model("SessionArchive", SessionArchiveSchema);
