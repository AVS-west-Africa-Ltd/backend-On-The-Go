import mongoose from "mongoose";

const { Schema } = mongoose;

const businessSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    website: { type: String },
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
    },
    phoneNumber: { type: String },
    hours: { type: String },
    freeWifiHours: { type: String },
    profilePicture: { type: String },
    email: { type: String },
    description: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true, // This adds `createdAt` and `updatedAt` fields automatically
  }
);

export default mongoose.model("Business", businessSchema);
