import express from 'express'
import Message from '../models/Message.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// ── GET /api/messages/:room — load history (newest 50, paginated) ────────────
router.get('/:room', protect, async (req, res) => {
  try {
    const { before } = req.query
    const query = { room: req.params.room }
    if (before) query._id = { $lt: before }
    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50)

    const flattened = messages.reverse().map(msg => ({
      _id:          msg._id.toString(),
      senderId:     msg.sender._id.toString(),
      senderName:   msg.sender.username,
      senderAvatar: msg.sender.avatar || '',
      content:      msg.content,
      type:         msg.type,
      fileName:     msg.fileName || '',
      createdAt:    msg.createdAt.toISOString(),
      room:         msg.room,
      readBy:       msg.readBy.map(id => id.toString()),
    }))

    res.json(flattened)
  } catch (err) {
    console.error('Fetch messages error:', err)
    res.status(500).json({ error: 'Could not fetch messages' })
  }
})

export default router