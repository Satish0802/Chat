import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'

const onlineUsers = new Map()

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('No token'))
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    const user = socket.user
    console.log(`✅ Connected: ${user.username} (${socket.id})`)

    onlineUsers.set(user._id.toString(), socket.id)
    await User.findByIdAndUpdate(user._id, { isOnline: true })
    io.emit('user:online', user._id.toString())
    socket.emit('users:online', Array.from(onlineUsers.keys()))

    // ── Join room ──────────────────────────────────────────────────────────
    socket.on('room:join', (roomId) => {
      socket.rooms.forEach((r) => { if (r !== socket.id) socket.leave(r) })
      socket.join(roomId)
      console.log(`${user.username} joined room: ${roomId}`)
    })

    // ── Send message (text, image, or file) ────────────────────────────────
    socket.on('message:send', async ({ roomId, content, type = 'text', fileName = '' }) => {
      try {
        if (!content?.trim()) return

        const message = await Message.create({
          sender: user._id,
          room: roomId,
          content: content.trim(),
          type,
          fileName,
          readBy: [user._id], // sender implicitly "read" it
        })

        const populated = await message.populate('sender', 'username avatar')

        const payload = {
          _id:          populated._id.toString(),
          senderId:     populated.sender._id.toString(),
          senderName:   populated.sender.username,
          senderAvatar: populated.sender.avatar || '',
          content:      populated.content,
          type:         populated.type,
          fileName:     populated.fileName || '',
          createdAt:    populated.createdAt.toISOString(),
          room:         populated.room,
          readBy:       populated.readBy.map(id => id.toString()),
        }

        io.to(roomId).emit('message:receive', payload)
      } catch (err) {
        console.error('message:send error:', err)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // ── Mark message as read ───────────────────────────────────────────────
    socket.on('message:read', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId)
        if (!message) return

        // Don't let sender mark their own message as read again
        if (message.sender.toString() === user._id.toString()) return

        const userIdStr = user._id.toString()
        const alreadyRead = message.readBy.some(id => id.toString() === userIdStr)

        if (!alreadyRead) {
          message.readBy.push(user._id)
          await message.save()

          io.to(message.room).emit('message:read', {
            messageId: message._id.toString(),
            readBy:    message.readBy.map(id => id.toString()),
          })
        }
      } catch (err) {
        console.error('message:read error:', err)
      }
    })

    // ── Typing indicators ──────────────────────────────────────────────────
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

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ Disconnected: ${user.username}`)
      onlineUsers.delete(user._id.toString())
      await User.findByIdAndUpdate(user._id, { isOnline: false })
      io.emit('user:offline', user._id.toString())
    })
  })

  return io
}