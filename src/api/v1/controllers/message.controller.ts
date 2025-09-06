import type { Request, Response } from "express";
import { fetchMessages, sendMessage } from "../services/message.service";
import z, { ZodError } from "zod";
import { MessageSchema } from "../schemas/message.zod";
import { zId } from "@zodyac/zod-mongoose";


export const createMessage = async (req: Request, res: Response) => {
  try {
    if (!req.authUserId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    // Always trust the authenticated user as the sender, ignore client-provided sender
    const parsed = MessageSchema.parse({ ...req.body, sender: req.authUserId });
    const message = await sendMessage(parsed);

    console.log("✅ Message created:", message);
    res.status(201).json({
      message: "Message created successfully",
      data: message,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      console.error("❌ Zod validation error:", error.issues);
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues,
      });
    }

    console.error("❌ Error in createMessage:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessagesByConversation = async (req: Request, res: Response) => {
  try {

    const parsed = z.object({ conversationId: zId() }).parse(req.params);
    const messages = await fetchMessages(parsed.conversationId);

    console.log(`✅ Retrieved ${messages.length} messages for conversation ${parsed.conversationId}`);
    res.json({
      message: `Fetched ${messages.length} messages successfully`,
      data: messages,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      console.error("❌ Zod validation error:", error.issues);
      return res.status(400).json({
        message: "Validation error",
        errors: error.issues,
      });
    }

    console.error("❌ Error in getMessagesByConversation:", error.message);
    res.status(500).json({ message: "Error fetching messages" });
  }
};
