import mongoose from 'mongoose';

export const connectMongoDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("MONGODB_URI is not defined");
    throw new Error("MONGODB_URI is not defined");
  }
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(uri,{
      family: 4
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
};
