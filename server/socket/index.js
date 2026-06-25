import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'

// userId → socketId mapping for online presence
const onlineUsers = new Map()

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // ── Auth middleware — runs before every connection ──────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('No token'))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (!user) return next(new Error('User not found'))

      socket.user = user   // attach full user to socket
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.user
    console.log(`✅ Connected: ${user.username} (${socket.id})`)

    // Mark online
    onlineUsers.set(user._id.toString(), socket.id)
    await User.findByIdAndUpdate(user._id, { isOnline: true })
    io.emit('user:online', user._id.toString())

    // Send current online user list to the newly connected client
    socket.emit('users:online', Array.from(onlineUsers.keys()))

    // ── Join a room ────────────────────────────────────────────────────────────
    socket.on('room:join', (roomId) => {
      // Leave all previous rooms first (except socket's own room)
      socket.rooms.forEach((r) => {
        if (r !== socket.id) socket.leave(r)
      })
      socket.join(roomId)
      console.log(`${user.username} joined room: ${roomId}`)
    })

    // ── Send a message ─────────────────────────────────────────────────────────
    socket.on('message:send', async ({ roomId, content, type = 'text' }) => {
      try {
        if (!content?.trim()) return

        const message = await Message.create({
          sender: user._id,
          room: roomId,
          content: content.trim(),
          type,
        })

        const populated = await message.populate('sender', 'username avatar')

        // Shape the message to match what the frontend expects
        const payload = {
          _id: populated._id.toString(),
          senderId: populated.sender._id.toString(),
          senderName: populated.sender.username,
          content: populated.content,
          type: populated.type,
          createdAt: populated.createdAt.toISOString(),
          room: populated.room,
        }

        io.to(roomId).emit('message:receive', payload)
      } catch (err) {
        console.error('message:send error:', err)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // ── Typing indicators ──────────────────────────────────────────────────────
    socket.on('typing:start', ({ roomId }) => {
      socket.to(roomId).emit('typing:start', {
        userId: user._id.toString(),
        username: user.username,
        roomId,
      })
    })

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:stop', {
        userId: user._id.toString(),
        roomId,
      })
    })

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ Disconnected: ${user.username}`)
      onlineUsers.delete(user._id.toString())
      await User.findByIdAndUpdate(user._id, { isOnline: false })
      io.emit('user:offline', user._id.toString())
    })
  })

  return io
}