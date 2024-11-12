import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // Screen 1: Basic Information
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Screen 2: Profile Setup
    profilepicture: { type: String }, // URL to the profile picture
    bio: { type: String },
    username: { type: String, required: true, unique: true },
    // userverification
    verifiedEmail: { type: Boolean, default: false },
    verificationToken: { type: String },
    // Screen 3: Interests and Skillset
    interests: { type: [String] }, // Array of interests
    skillset: { type: [String] }, // Array of skillsets
    socialLinks: { type: Map, of: String }, // Map of social links, e.g., { "twitter": "url", "linkedin": "url" }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const User = mongoose.model("User", UserSchema);
export default User;
