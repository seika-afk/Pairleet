import { model, models, Schema } from "mongoose";
const UserSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);
export default models.User || model("User", UserSchema);
