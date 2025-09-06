import mongoose from 'mongoose';

const connectDB = async () => {

  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ MongoDB connected backend service");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", (error as Error).message);
    process.exit(1);
  }
};

export default connectDB;
