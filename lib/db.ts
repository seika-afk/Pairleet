import mongoose from "mongoose";

const uri = process.env.MONGODB_STRING;

if (!uri) {
  throw new Error(" mongo uri not defined");
}

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    console.log("Creating new connection");
    cached.promise = mongoose.connect(uri).then((mongoose) => {
      console.log("Connected to DB");
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
