import mongoose from "mongoose";

const { Schema } = mongoose;

const wifiZoneSchema = new Schema(
  {
    name: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
    description: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index on the location field
wifiZoneSchema.index({ location: "2dsphere" });

export default mongoose.model("WifiZone", wifiZoneSchema);
