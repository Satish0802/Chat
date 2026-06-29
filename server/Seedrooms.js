// Run once: node server/seedRooms.js
// Creates default channels in DB if they don't exist

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Room from './models/Room.js'

dotenv.config()

await mongoose.connect(process.env.MONGO_URI)

const defaults = ['general', 'random', 'dev-talk']

for (const name of defaults) {
  const exists = await Room.findOne({ name, type: 'channel' })
  if (!exists) {
    await Room.create({ name, type: 'channel', isPrivate: false, members: [] })
    console.log(`Created channel: ${name}`)
  } else {
    console.log(`Already exists: ${name}`)
  }
}

await mongoose.disconnect()
console.log('Done.')