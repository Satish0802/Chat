import express from 'express'
import { upload } from '../middleware/upload.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({
    url:      req.file.path,
    fileName: req.file.originalname,
    type:     req.file.mimetype.startsWith('image/') ? 'image' : 'file',
  })
})

export default router