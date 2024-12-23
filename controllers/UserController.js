const userService = require("../services/UserService");
const bcrypt = require("bcryptjs");
const jwtUtil = require("../utils/jwtUtil");
const path = require("path");
const multer = require("multer");

// Multer storage and configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Upload directory
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

class UserController {
  static async CreateUser(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password)
        return res.status(400).json({ message: "All fields are required" });

      let payload = { where: { email: email } };
      const isUserRegistered = await userService.getUserByEmailOrUsername(
        payload
      );
      if (isUserRegistered)
        return res.status(400).json({ message: "User already registered" });

      const hashedPassword = bcrypt.hashSync(password, 10);
      const user = await userService.createUser(req.body);
      user.password = hashedPassword;
      await user.save();
      return res
        .status(201)
        .json({ message: "User registered successfully", data: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async UpdateUserImage(req, res) {
    const uploadHandler = upload.single("profileImage");
    uploadHandler(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res
          .status(501)
          .json({ message: "Error uploading files", error: err.message });
      }

      const { userId } = req.params;

      try {
        const mediaPaths = `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`.toString();

        const user = await userService.updateUser(userId, {
          picture: mediaPaths,
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({
          message: "Profile picture updated successfully",
          info: user,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error uploading picture",
          error: error.message,
        });
      }
    });
  }

  static async Login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password)
        return res.status(400).json({ message: "All fields are required" });

      let payload = { where: { email: email } };
      const user = await userService.getUserByEmailOrUsername(payload);

      if (!user)
        return res.status(400).json({ message: "Invalid email or password" });

      const isPasswordMatch = await bcrypt.compareSync(password, user.password);
      if (!isPasswordMatch)
        return res.status(401).json({ message: "Invalid email or password" });

      const token = jwtUtil.generateToken(user);
      return res.status(200).json({ token: token, user: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getUsers(req, res) {
    try {
      const users = await userService.getUsers();
      if (!users || users.length === 0)
        return res.status(404).json({ message: "Users not found", info: [] });
      return res.status(200).json({ info: users });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const { userId } = req.params;

      const user = await userService.getUserById(userId);
      if (!user)
        return res.status(404).json({ message: "User not found", info: {} });
      return res.status(200).json({ info: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await userService.deleteUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await userService.updateUser(userId, req.body);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res
        .status(200)
        .json({ message: "User updated successfully", info: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async addFollower(req, res) {
    try {
      const { userId, followerId } = req.params;
      const user = await userService.addFollower(userId, followerId);

      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ message: "Follower added successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async removeFollower(req, res) {
    try {
      const { userId, followerId } = req.params;
      const user = await userService.removeFollower(userId, followerId);

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.status(200).json({ message: "Follower removed successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getNotifications(req, res) {
    try {
      const { userId } = req.params;

      const userNotification = await userService.getNotifications(userId);
      if (!userNotification)
        return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ notifications: userNotification });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      const notification = await userService.markNotificationAsRead(
        notificationId
      );
      if (!notification)
        return res.status(404).json({ message: "Notification not found" });
      return res
        .status(200)
        .json({ message: "Notification marked as read", notification });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getUserWithFollowers(req, res) {
    try {
      const { userId } = req.params;

      const user = await userService.getUserWithFollowers(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ info: user });
    } catch (e) {
      return res.status(500).json({ error: e });
    }
  }

  static async addInterests(req, res) {
    try {
      const { userId } = req.params;
      const { icon, title, type } = req.body;
      let newInterest = {
        icon,
        title,
        type,
      };
      const updatedInterests = await userService.addInterest(
        userId,
        newInterest
      );
      return res
        .status(200)
        .json({ message: "Interest added", interests: updatedInterests });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateInterest(req, res) {
    try {
      const { userId, index } = req.params;
      const updatedInterest = req.body;

      const user = await userService.updateInterest(
        userId,
        parseInt(index),
        updatedInterest
      );
      return res
        .status(200)
        .json({ message: "Interest updated successfully", interest: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteInterest(req, res) {
    try {
      const { userId, index } = req.params;
      const updatedInterests = await userService.deleteInterest(
        userId,
        parseInt(index)
      );

      return res.status(200).json({
        message: "Interest deleted successfully",
        interest: updatedInterests,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
