import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { errorLogger } from "../utils/errorLogger.js";

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["super-admin", "admin", "nagar-officials", "surveyor"],
  },
  password: { type: String },
} , {timestamps : true});

// instance method → encrypt password
userSchema.methods.encryptPassword = async function () {
  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return this.password;
    
  } catch (err) {
    errorLogger(err, "encryptPassword");
  }
};

// instance method → compare entered password with hashed one
userSchema.methods.decryptPassword = async function (enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (err) {
    errorLogger(err, "decryptPassword");
  }
};

export const User = mongoose.model("User", userSchema);

