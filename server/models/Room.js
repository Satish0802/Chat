import mongoose from 'mongoose'

const { Schema, Types } = mongoose

const roomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // 'channel' = group chat, 'dm' = direct message
    type: {
      type: String,
      enum: ['channel', 'dm'],
      default: 'channel',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model('Room', roomSchema)