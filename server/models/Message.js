import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const messageSchema = new Schema(
  {
    sender: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: String,
      required: true,
      // For group channels: 'general', 'random', etc.
      // For DMs: sorted userId pair e.g. '64abc_64def'
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      maxlength: [2000, 'Message too long'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'image'],
      default: 'text',
    },
    readBy: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
)

// Index for fast room history queries (newest first)
messageSchema.index({ room: 1, createdAt: -1 })

export default mongoose.model('Message', messageSchema)