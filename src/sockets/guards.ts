import type { Socket } from "socket.io"
import { Types } from "mongoose"
import { Conversation } from "@/models/conversation"

export async function assertMembershipOrEmit(socket: Socket, conversationId?: string) {
  if (!conversationId) {
    socket.emit("error", { error: "Missing conversation id" })
    return null
  }
  const userId = (socket as any).data?.userId as string | undefined
  if (!userId) {
    socket.emit("error", { error: "Unauthorized socket" })
    return null
  }
  if (!Types.ObjectId.isValid(conversationId)) {
    socket.emit("error", { error: "Invalid conversation id" })
    return null
  }
  const convo = await Conversation.findById(conversationId).select("participants")
  if (!convo) {
    socket.emit("error", { error: "Conversation not found" })
    return null
  }
  const isMember = convo.participants.some((p) => String(p) === String(userId))
  if (!isMember) {
    socket.emit("error", { error: "Forbidden: not a participant" })
    return null
  }
  return { userId }
}
