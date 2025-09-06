import type { Server, Socket } from "socket.io"
import jwt from "jsonwebtoken"
import { parse as parseCookie } from "cookie"

export function registerSocketAuth(io: Server) {
  const JWT_SECRET = process.env.JWT_SECRET || "__dev__secret__change_me__"
  io.use((socket: Socket, next) => {
    try {
      const cookies = parseCookie(socket.request.headers.cookie || "")
      const cookieToken = cookies["jwt"]
      const authHeader = (socket.handshake.headers["authorization"] || socket.handshake.headers["Authorization"]) as string | undefined
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined
      const authToken = (socket.handshake.auth as any)?.token as string | undefined
      const token = cookieToken || bearerToken || authToken
      if (!token) return next(new Error("Unauthorized: No token"))

      const decoded = jwt.verify(token, JWT_SECRET) as any
      const uid = decoded?.sub || decoded?.id || decoded?.userId
      if (!uid) return next(new Error("Unauthorized: Invalid token payload"))
        ; (socket as any).data = { ...(socket as any).data, userId: String(uid), tokenDecoded: decoded }
      return next()
    } catch (err) {
      return next(new Error("Unauthorized: Invalid or expired token"))
    }
  })
}
