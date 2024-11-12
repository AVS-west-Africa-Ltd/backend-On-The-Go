import mongoose from "mongoose";

const { Schema } = mongoose;

const newsFeedSchema = new Schema(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Ensure that either a business or user is present
newsFeedSchema.pre("save", function (next) {
  if (!this.business && !this.user) {
    next(
      new Error("NewsFeed item must belong to either a business or a user.")
    );
  } else {
    next();
  }
});

export default mongoose.model("NewsFeed", newsFeedSchema);
