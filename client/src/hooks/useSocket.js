import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export function useSocket(roomId) {
  const { token } = useAuth()
  const socketRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])

  // ── Connect once on mount, disconnect on unmount ───────────────────────────
  useEffect(() => {
    if (!token) return

    const socket = io(import.meta.env.VITE_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected')
      if (roomId) socket.emit('room:join', roomId)
    })
    socket.on('connect_error', (err) => console.error('Socket error:', err.message))

    // Online presence
    socket.on('users:online', (ids) => setOnlineUsers(ids))
    socket.on('user:online',  (id)  => setOnlineUsers(prev => [...new Set([...prev, id])]))
    socket.on('user:offline', (id)  => setOnlineUsers(prev => prev.filter(u => u !== id)))

    // Incoming messages
    socket.on('message:receive', (msg) =>
      setMessages(prev => [...prev, msg])
    )

    // Read receipts — update readBy for a specific message
    socket.on('message:read', ({ messageId, readBy }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, readBy } : msg
      ))
    })

    // Typing
    socket.on('typing:start', ({ username }) =>
      setTypingUsers(prev => [...new Set([...prev, username])])
    )
    socket.on('typing:stop', ({ username }) =>
      setTypingUsers(prev => prev.filter(u => u !== username))
    )

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  // ── Join room whenever roomId changes ──────────────────────────────────────
  useEffect(() => {
    if (!socketRef.current || !roomId) return

    const joinRoom = () => {
      socketRef.current.emit('room:join', roomId)
      setMessages([])
      setTypingUsers([])
    }

    if (socketRef.current.connected) {
      joinRoom()
    } else {
      socketRef.current.once('connect', joinRoom)
    }
  }, [roomId])

  // ── Actions ────────────────────────────────────────────────────────────────
  const sendTyping = (isTyping) => {
    socketRef.current?.emit(
      isTyping ? 'typing:start' : 'typing:stop',
      { roomId }
    )
  }

  const sendMessage = (content, type = 'text', fileName = '') => {
    socketRef.current?.emit('message:send', { roomId, content, type, fileName })
  }

  const markAsRead = (messageId) => {
    socketRef.current?.emit('message:read', { messageId })
  }

  return {
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
    markAsRead,
  }
}