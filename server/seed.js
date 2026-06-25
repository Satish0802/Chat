// seed.js — run with: node seed.js
// Creates 3 demo users and sample messages in each channel
// Run from the server/ directory

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

// ── Inline schemas (avoids import path issues when running standalone) ────────

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    avatar: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Types.ObjectId, ref: 'User' },
    room: String,
    content: String,
    type: { type: String, default: 'text' },
    readBy: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)
const Message = mongoose.model('Message', messageSchema)

// ── Seed data ─────────────────────────────────────────────────────────────────

const USERS = [
  { username: 'satoki',  email: 'satoki@example.com', password: 'password123' },
  { username: 'alex',    email: 'alex@example.com',   password: 'password123' },
  { username: 'sara',    email: 'sara@example.com',   password: 'password123' },
]

const MESSAGE_TEMPLATES = [
  // general
  { room: 'general',  senderName: 'alex',   content: 'Hey everyone! Welcome to Chatwave 👋',                          minsAgo: 60 },
  { room: 'general',  senderName: 'sara',   content: 'Hi Alex! Glad to be here 🎉',                                   minsAgo: 58 },
  { room: 'general',  senderName: 'satoki', content: 'This real-time chat is working great!',                         minsAgo: 55 },
  { room: 'general',  senderName: 'alex',   content: 'Built with MERN + Socket.IO — nice stack choice',               minsAgo: 53 },
  { room: 'general',  senderName: 'sara',   content: 'The dark sidebar UI looks really clean 🔥',                     minsAgo: 50 },
  { room: 'general',  senderName: 'satoki', content: 'Thanks! Tailwind CSS made styling so much faster',              minsAgo: 48 },
  // random
  { room: 'random',   senderName: 'sara',   content: 'Anyone else think Nepal has the best mountains? 🏔️',            minsAgo: 40 },
  { room: 'random',   senderName: 'alex',   content: 'Hard to argue with Everest lol',                                minsAgo: 38 },
  { room: 'random',   senderName: 'satoki', content: 'Living proof 😄',                                               minsAgo: 35 },
  { room: 'random',   senderName: 'sara',   content: 'What are you building next after this?',                        minsAgo: 30 },
  { room: 'random',   senderName: 'satoki', content: 'Thinking of adding image sharing and reactions',                minsAgo: 28 },
  { room: 'random',   senderName: 'alex',   content: 'Emoji reactions would be awesome 👍',                           minsAgo: 25 },
  // dev-talk
  { room: 'dev-talk', senderName: 'alex',   content: 'Just pushed the auth middleware — JWT is working',              minsAgo: 20 },
  { room: 'dev-talk', senderName: 'satoki', content: 'Nice! Did you handle token expiry?',                            minsAgo: 18 },
  { room: 'dev-talk', senderName: 'alex',   content: 'Yep, 7 day expiry with a 401 redirect on the client',          minsAgo: 16 },
  { room: 'dev-talk', senderName: 'sara',   content: 'Make sure to also index the room field in MongoDB',             minsAgo: 14 },
  { room: 'dev-talk', senderName: 'satoki', content: 'Already done! messageSchema.index({ room: 1, createdAt: -1 })', minsAgo: 12 },
  { room: 'dev-talk', senderName: 'sara',   content: 'Perfect. That will keep history queries fast 🚀',               minsAgo: 10 },
]

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    await User.deleteMany({})
    await Message.deleteMany({})
    console.log('🗑️  Cleared existing users and messages')

    const hashedUsers = await Promise.all(
      USERS.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
      }))
    )

    const createdUsers = await User.insertMany(hashedUsers)
    console.log(`👤 Created ${createdUsers.length} users:`)
    createdUsers.forEach(u => console.log(`   • ${u.username} (${u.email})`))

    const userMap = {}
    createdUsers.forEach(u => { userMap[u.username] = u._id })

    const messages = MESSAGE_TEMPLATES.map(t => ({
      sender: userMap[t.senderName],
      room: t.room,
      content: t.content,
      type: 'text',
      createdAt: new Date(Date.now() - t.minsAgo * 60 * 1000),
      updatedAt: new Date(Date.now() - t.minsAgo * 60 * 1000),
    }))

    await Message.insertMany(messages)
    console.log(`💬 Created ${messages.length} messages across 3 channels`)

    console.log('\n🌱 Seed complete! Log in with any of these:')
    console.log('   satoki@example.com  |  password123')
    console.log('   alex@example.com    |  password123')
    console.log('   sara@example.com    |  password123')

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err.message)
    await mongoose.disconnect()
    process.exit(1)
  }
}

seed()