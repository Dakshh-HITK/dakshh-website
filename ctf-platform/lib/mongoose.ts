import mongoose from "mongoose";
import "@/lib/models/Team";
import "@/lib/models/Attempt";
import "@/lib/models/User";
import "@/lib/models/Registration";
import "@/lib/models/Event";
import "@/lib/models/CTFChallenge";
import "@/lib/models/CTFSection";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }
  return uri;
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as { mongoose: MongooseCache };

const cached: MongooseCache = globalForMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

if (process.env.NODE_ENV !== "production") {
  globalForMongoose.mongoose = cached;
}

async function connect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri());
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connect;
