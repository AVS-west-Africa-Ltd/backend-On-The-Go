const Waitlist = require("../models/Waitlist");
const { Waitlist } = require('./models');
class WaitlistController {
  static async joinWaitlist(req, res) {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const [entry, created] = await Waitlist.findOrCreate({
        where: { email },
      });

      if (!created) {
        return res.status(200).json({ message: "You're already on the waitlist" });
      }

      return res.status(201).json({ message: "Successfully joined the waitlist" });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong", error: error.message });
    }
  }

  static async getWaitlist(req, res) {
    try {
      const list = await Waitlist.findAll();
      return res.status(200).json({ count: list.length, list });
    } catch (error) {
      return res.status(500).json({ message: "Could not fetch waitlist", error: error.message });
    }
  }
}

module.exports = WaitlistController;
