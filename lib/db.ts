import mongoose from "mongoose";

const uri = process.env.MONGODB_STRING;

if (!uri) {
  throw new Error(" mongo uri not defined");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache =
  globalWithMongoose.mongoose ?? (globalWithMongoose.mongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    console.log("Creating new connection");
    const mongoUri = uri!;
    cached.promise = mongoose.connect(mongoUri).then((mongoose) => {
      console.log("Connected to DB");
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
