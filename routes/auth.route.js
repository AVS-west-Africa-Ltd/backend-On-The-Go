const express = require("express");
const router = express.Router();
const { catchErrors } = require("../handlers/errorHandler");
const UserController = require("../controllers/UserController");


router.post("/register", catchErrors(UserController.CreateUser));
