import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
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

// ── GET /api/auth/users — all users except self ──────────────────────────────
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar isOnline')
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' })
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

    // Check if username already taken by someone else
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

// ── POST /api/auth/avatar — upload avatar image ──────────────────────────────
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