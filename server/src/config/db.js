import mongoose from "mongoose";

export async function connectDatabase() {
  const mongodbUri =
    process.env.MONGODB_CONNECTION_URI;
  const mongodbDbName = process.env.MONGODB_DB_NAME ;

  if (!mongodbUri) {
    const error = new Error("Missing MONGODB_CONNECTION_URI in environment");
    console.error("Database connection failed.");
    console.error(error);
    throw error;
  }

  try {
    await mongoose.connect(mongodbUri, {
      dbName: mongodbDbName,
    });
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Database connection failed.");
    console.error(error);
    throw error;
  }
}
