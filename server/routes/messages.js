import express from 'express'
import Message from '../models/Message.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// ── GET /api/messages/:room — load history (newest 50, paginated) ────────────
router.get('/:room', protect, async (req, res) => {
  try {
    const { before } = req.query   // message _id cursor for pagination
    const query = { room: req.params.room }
    if (before) query._id = { $lt: before }

    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50)

    // Reverse so oldest is first (correct display order)
    res.json(messages.reverse())
  } catch (err) {
    console.error('Fetch messages error:', err)
    res.status(500).json({ error: 'Could not fetch messages' })
  }
})

export default router