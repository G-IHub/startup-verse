import mongoose from "mongoose";

const organizationAdminSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

