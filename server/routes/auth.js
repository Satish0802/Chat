import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Room from '../models/Room.js'
import Message from '../models/Message.js'
import { protect } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = express.Router()

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' })

    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Username'
      return res.status(409).json({ error: `${field} already in use` })
    }

    const user = await User.create({ username, email, password })

    // Auto-join #general only
    await Room.findOneAndUpdate(
      { name: 'general', type: 'channel' },
      { $addToSet: { members: user._id } }
    )

    const token = signToken(user._id)
    res.status(201).json({ token, user })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error during registration' })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' })

    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const isMatch = await user.matchPassword(password)
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user._id)
    res.json({ token, user })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error during login' })
  }
})

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user })
})

// ── GET /api/auth/users — search users by name (excludes self) ───────────────
router.get('/users', protect, async (req, res) => {
  try {
    const { search } = req.query
    const query = { _id: { $ne: req.user._id } }
    if (search?.trim()) {
      query.username = { $regex: search.trim(), $options: 'i' }
    } else {
      // No search query — return empty so sidebar doesn't show all users
      return res.json([])
    }
    const users = await User.find(query).select('username avatar isOnline').limit(10)
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' })
  }
})

// ── GET /api/auth/dm-users — users current user has DM history with ──────────
router.get('/dm-users', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString()

    // DM room IDs contain underscore and the user's ID
    const allRooms = await Message.distinct('room', {
      room: { $regex: userId }
    })

    // Filter to only DM rooms (contain underscore separator)
    const dmRooms = allRooms.filter(r => r.includes('_'))

    // Extract other user IDs
    const otherUserIds = dmRooms
      .map(room => room.split('_').find(p => p !== userId))
      .filter(Boolean)

    if (otherUserIds.length === 0) return res.json([])

    const users = await User.find({ _id: { $in: otherUserIds } })
      .select('username avatar isOnline')

    res.json(users)
  } catch (err) {
    console.error('DM users error:', err)
    res.status(500).json({ error: 'Could not fetch DM users' })
  }
})

// ── GET /api/auth/profile ────────────────────────────────────────────────────
router.get('/profile', protect, (req, res) => {
  res.json({ user: req.user })
})

// ── PUT /api/auth/profile — update username ──────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { username } = req.body
    if (!username?.trim())
      return res.status(400).json({ error: 'Username is required' })

    const existing = await User.findOne({ username, _id: { $ne: req.user._id } })
    if (existing) return res.status(409).json({ error: 'Username already taken' })

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username: username.trim() },
      { new: true }
    )
    res.json({ user })
  } catch (err) {
    console.error('Profile update error:', err)
    res.status(500).json({ error: 'Could not update profile' })
  }
})

// ── POST /api/auth/avatar ────────────────────────────────────────────────────
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    )
    res.json({ user })
  } catch (err) {
    console.error('Avatar upload error:', err)
    res.status(500).json({ error: 'Could not upload avatar' })
  }
})

export default router

// ── POST /api/auth/block/:userId — block a user ──────────────────────────────
router.post('/block/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params
    if (userId === req.user._id.toString())
      return res.status(400).json({ error: 'Cannot block yourself' })

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: userId }
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Could not block user' })
  }
})