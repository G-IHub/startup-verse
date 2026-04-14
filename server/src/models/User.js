import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { USER_ROLES } from "../utils/enums.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "{VALUE} is not a valid user role",
      },
      required: [true, "Role is required"],
    },
    startupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      index: true,
    },
    founderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    onboardingComplete: { type: Boolean, default: false },
    /** Virtual Office Joyride tour; set true when user finishes the tour (server source of truth). */
    virtualOfficeTourCompleted: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    profile: { type: mongoose.Schema.Types.Mixed, default: {} },
    notificationPreferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    avatarUrl: {
      type: String,
      default: "",
      maxlength: [1000, "URL cannot exceed 1000 characters"],
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

// Pre-save hook to hash the password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
