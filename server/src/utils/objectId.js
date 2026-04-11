import mongoose from "mongoose";

export function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export function asObjectId(value, fieldName = "id") {
  if (!isValidObjectId(value)) {
    const error = new Error(`Invalid ${fieldName}.`);
    error.statusCode = 400;
    throw error;
  }

  return new mongoose.Types.ObjectId(value);
}