import { Server, Socket } from "socket.io";
import { MessageSchema } from "@/api/v1/schemas/message.zod";
import * as messageService from "@/api/v1/services/message.service";
import { Conversation } from "@/models/conversation";
import { Types } from "mongoose";
import { assertMembershipOrEmit } from "./guards";

export const registerMessageHandlers = (io: Server, socket: Socket) => {
  console.log("✅ Message socket connected:", socket.id);

  // Join a conversation room
  socket.on("join_conversation", async (conversationId: string) => {
    try {
      const res = await assertMembershipOrEmit(socket, conversationId)
      if (!res) return
      socket.join(conversationId)
      console.log(`🟢 ${socket.id} joined conversation ${conversationId}`)
    } catch { }
  });

  // Leave a conversation room
  socket.on("leave_conversation", (conversationId: string) => {
    if (!conversationId) return;
    socket.leave(conversationId);
    console.log(`🔴 ${socket.id} left conversation ${conversationId}`);
  });

  // Send a message
  socket.on("send_message", async (payload) => {
    try {
      const res = await assertMembershipOrEmit(socket, payload?.conversation)
      if (!res) return
      const parsed = MessageSchema.parse({ ...payload, sender: res.userId });

      const saved = await messageService.sendMessage({ ...parsed, status: "sent" } as any);
      io.to(parsed.conversation).emit("new_message", saved);
      console.log("📩 Message sent:", saved._id?.toString?.() ?? "");
    } catch (err: any) {
      console.error("❌ Error in send_message:", err);
      socket.emit("error", { error: err?.issues ?? err?.message ?? "Invalid message payload" });
    }
  });

  // Mark message as delivered (userId from authenticated socket)
  socket.on("message_delivered", async ({ messageId }) => {
    try {
      const res = await assertMembershipOrEmit(socket, undefined)
      if (!res || !messageId) return socket.emit("error", { error: "Unauthorized or invalid payload" })
      const updated = await messageService.updateMessageStatus(messageId, "delivered", res.userId)
      if (!updated) return
      // Membership already checked by assertMembershipOrEmit for user existence; we can still ensure membership on convo:
      const convo = await Conversation.findById(updated.conversation).select("participants")
      const isMember = convo && convo.participants.some((p) => String(p) === String(res.userId))
      if (!isMember) return
      io.to(updated.conversation.toString()).emit("message_status", updated)
      console.log("✅ Delivered:", messageId)
    } catch (err) {
      console.error("❌ Error in message_delivered:", err)
    }
  })

  // Mark message as read (userId from authenticated socket)
  socket.on("message_read", async ({ messageId }) => {
    try {
      const res = await assertMembershipOrEmit(socket, undefined)
      if (!res || !messageId) return socket.emit("error", { error: "Unauthorized or invalid payload" })
      const updated = await messageService.updateMessageStatus(messageId, "read", res.userId)
      if (!updated) return
      const convo = await Conversation.findById(updated.conversation).select("participants")
      const isMember = convo && convo.participants.some((p) => String(p) === String(res.userId))
      if (!isMember) return
      io.to(updated.conversation.toString()).emit("message_status", updated)
      console.log("👀 Read:", messageId)
    } catch (err) {
      console.error("❌ Error in message_read:", err)
    }
  })

  socket.on("disconnect", () => {
    console.log("❌ Message socket disconnected:", socket.id);
  });
};

