import express from 'express'
import Room from '../models/Room.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// GET /api/rooms — all channels (public) + ones user is member of
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({ type: 'channel' })
      .populate('members', 'username avatar')
      .populate('createdBy', 'username')
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch rooms' })
  }
})

// POST /api/rooms — create a new channel
router.post('/', protect, async (req, res) => {
  try {
    const { name, isPrivate } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })

    const exists = await Room.findOne({ name: name.trim(), type: 'channel' })
    if (exists) return res.status(409).json({ error: 'Channel already exists' })

    const room = await Room.create({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      type: 'channel',
      isPrivate: isPrivate || false,
      createdBy: req.user._id,
      members: [req.user._id],
    })

    await room.populate('members', 'username avatar')
    await room.populate('createdBy', 'username')
    res.status(201).json(room)
  } catch (err) {
    res.status(500).json({ error: 'Could not create room' })
  }
})

// POST /api/rooms/:id/join — join a public channel
router.post('/:id/join', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ error: 'Room not found' })
    if (room.isPrivate) return res.status(403).json({ error: 'Room is private' })

    const isMember = room.members.some(m => m.toString() === req.user._id.toString())
    if (!isMember) {
      room.members.push(req.user._id)
      await room.save()
    }

    await room.populate('members', 'username avatar')
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: 'Could not join room' })
  }
})

// POST /api/rooms/:id/leave — leave a channel
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ error: 'Room not found' })

    room.members = room.members.filter(m => m.toString() !== req.user._id.toString())
    await room.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Could not leave room' })
  }
})

// GET /api/rooms/:id/members — list members
router.get('/:id/members', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('members', 'username avatar isOnline')
    if (!room) return res.status(404).json({ error: 'Room not found' })
    res.json(room.members)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch members' })
  }
})

export default router

// POST /api/rooms/:id/kick — owner removes a member
router.post('/:id/kick', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ error: 'Room not found' })

    const isOwner = room.createdBy?.toString() === req.user._id.toString()
    if (!isOwner) return res.status(403).json({ error: 'Only the owner can remove members' })

    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: 'userId required' })

    room.members = room.members.filter(m => m.toString() !== userId.toString())
    await room.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Could not remove member' })
  }
})