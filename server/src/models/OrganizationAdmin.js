import mongoose from "mongoose";

const organizationAdminSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "organizationId is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
  },
  { timestamps: true },
);

organizationAdminSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

const OrganizationAdmin =
  mongoose.models.OrganizationAdmin ||
  mongoose.model("OrganizationAdmin", organizationAdminSchema);

export default OrganizationAdmin;
