import { Router } from "express"
import {
  createPairConversation,
  createGroupConversation,
  getUserConversations,
} from "../controllers/conversation.controller"
import verifyAuth from "../../../middleware/verifyAuth"

const router = Router()

// POST /api/conversations/pair
router.post("/pair", verifyAuth, createPairConversation)

// POST /api/conversations/group
router.post("/group", verifyAuth, createGroupConversation)

// GET /api/conversations/:userId
router.get("/:userId", verifyAuth, getUserConversations)

export default router
