import mongoose from "mongoose";

const { Schema } = mongoose;

const facilitySchema = new Schema(
  {
    type: { type: String, enum: ["Hospital", "Pharmacy"], required: true },
    name: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    contact: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create a geospatial index on the location field
facilitySchema.index({ location: "2dsphere" });

export default mongoose.model("Facility", facilitySchema);
