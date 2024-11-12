import express from "express";
const router = express.Router();
import { catchErrors } from "../middlewares/erroHandler.js";
import { userControllers } from "../controllers/userController.js";

// user routes

router
  .get("/users", catchErrors(userControllers.getUsers))
  .get("/users/:id", catchErrors(userControllers.getUser))
  .post("/users", catchErrors(userControllers.signupUser))
  .put("/users/:id", catchErrors(userControllers.updateUser))
  .delete("/users/:id", catchErrors(userControllers.deleteUser));

// export router

export default router;
