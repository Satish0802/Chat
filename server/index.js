import './env.js'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { createServer } from 'http'
import { initSocket } from './socket/index.js'
import authRoutes from './routes/auth.js'
import messageRoutes from './routes/messages.js'
import uploadRoutes from './routes/upload.js'


const app = express()
const httpServer = createServer(app)



// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/upload', uploadRoutes)
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

// ── Socket.IO ──────────────────────────────────────────────────────────────────
initSocket(httpServer)

// ── MongoDB ────────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    httpServer.listen(process.env.PORT || 5000, () =>
      console.log(`✅ Server running on port ${process.env.PORT || 5000}`)
    )
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })