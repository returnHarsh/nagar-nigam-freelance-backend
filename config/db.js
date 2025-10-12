import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // const db = process.env.DB_NAME
    // const uri = `${process.env.MONGO_URI}/${db}`;
    const uri = process.env.MONGO_URI;
    
    if(!uri){
      console.log("MONGO_URI is not set");
      process.exit(1);
    }

    mongoose.set('strictQuery' , true);

    // Attach events first
    mongoose.connection.on("connected", () => {
      console.log("[INFO] ✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    // Then connect
    await mongoose.connect(uri);

  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
};
