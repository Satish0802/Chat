import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Helper — sign a JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' })

    // Check for duplicates
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

    // Return user without password (toJSON strips it)
    res.json({ token, user })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error during login' })
  }
})

// ── GET /api/auth/me — verify token + return current user ───────────────────
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user })
})

// GET /api/auth/users — get all users except yourself
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('username avatar isOnline')
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' })
  }
})

export default router