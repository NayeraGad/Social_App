import mongoose from "mongoose";

const connectionDB = async () => {
  try {
    await mongoose.connect(process.env.URI);
    console.log("Connected to database successfully");
  } catch (error) {
    console.log("Not connected to database", error);
  }
};

export default connectionDB;
