import mongoose from "mongoose";

const { Schema } = mongoose;

const defibrillatorSchema = new Schema(
  {
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    description: { type: String },
    accessibility: { type: String },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create a geospatial index on the location field
defibrillatorSchema.index({ location: "2dsphere" });

export default mongoose.model("Defibrillator", defibrillatorSchema);
