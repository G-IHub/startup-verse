import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Organization name is required"], 
      trim: true,
      minlength: [2, "Organization name must be at least 2 characters"],
      maxlength: [100, "Organization name cannot exceed 100 characters"]
    },
    description: { 
      type: String, 
      default: "",
      maxlength: [5000, "Description cannot exceed 5000 characters"]
    },
    logo: { 
      type: String, 
      default: "",
      maxlength: [1000, "Logo URL cannot exceed 1000 characters"]
    },
    website: { 
      type: String, 
      default: "",
      maxlength: [1000, "Website URL cannot exceed 1000 characters"]
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

organizationSchema.index({ createdBy: 1 });

const Organization =
  mongoose.models.Organization || mongoose.model("Organization", organizationSchema);

export default Organization;