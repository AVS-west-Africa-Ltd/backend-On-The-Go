import express from "express";

const router = express.Router();
import { authProfile } from "../middlewares/authProfile";
import { fetchPosts, searchBusinesses, makeComment, toggleReaction, followProfile, createChat, fetchChats, createPost } from "../controllers/AppController";
import { upload } from "../middlewares/upload";

router.use(authProfile);

router.post("/create-post", upload.array("media", 5), createPost);
router.get("/fetch-posts", fetchPosts);
router.get("/fetch-businesses", searchBusinesses);
router.post("/make-comment", makeComment);
router.post("/toggle-reaction", toggleReaction);
router.post("/follow-profile", followProfile);
router.post("/create-chat", createChat);
router.get("/fetch-chats", fetchChats);


export default router;