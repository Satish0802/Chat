import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Message from '../models/Message.js'

const onlineUsers = new Map()

// All known rooms — channels + any DM rooms seen
const CHANNEL_ROOMS = ['general', 'random', 'dev-talk']

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

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

    // Join all channels + all DM rooms this user is part of
    socket.on('rooms:join-all', async () => {
      // Join all channel rooms
      for (const ch of CHANNEL_ROOMS) {
        socket.join(ch)
      }
      // Find all DM rooms this user has messages in
      const userIdStr = user._id.toString()
      const dmRooms = await Message.distinct('room', {
        room: { $regex: userIdStr },
      })
      for (const room of dmRooms) {
        socket.join(room)
      }
      console.log(`${user.username} joined all rooms`)
    })

    // Join specific room (when user navigates to it)
    socket.on('room:join', (roomId) => {
      socket.join(roomId)
      console.log(`${user.username} joined room: ${roomId}`)
    })

    // Send message
    socket.on('message:send', async ({ roomId, content, type = 'text', fileName = '' }) => {
      try {
        if (!content?.trim()) return

        const message = await Message.create({
          sender: user._id,
          room: roomId,
          content: content.trim(),
          type,
          fileName,
          readBy: [user._id],
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

    // Mark message as read
    socket.on('message:read', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId)
        if (!message) return
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

    // Typing
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
        username: user.username,
        roomId,
      })
    })

    socket.on('disconnect', async () => {
      console.log(`❌ Disconnected: ${user.username}`)
      onlineUsers.delete(user._id.toString())
      await User.findByIdAndUpdate(user._id, { isOnline: false })
      io.emit('user:offline', user._id.toString())
    })
  })

  return io
}