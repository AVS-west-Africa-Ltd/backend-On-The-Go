
const { User, UserLocation } = require("../models");

const UserLocationController = {
  saveLocation: async (req, res) => {
    try {
      const { userId, latitude, longitude } = req.body;

      if (!userId || latitude == null || longitude == null) {
        return res.status(400).json({ message: "userId, latitude, and longitude are required" });
      }

      const userExists = await User.findByPk(userId);
      if (!userExists) {
        return res.status(404).json({ message: "User not found" });
      }

      const saved = await UserLocation.create({ userId, latitude, longitude });

      res.status(201).json({ message: "Location saved", data: saved });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error saving location", error: error.message });
    }
  }
};

module.exports = UserLocationController;
