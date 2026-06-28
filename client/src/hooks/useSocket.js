import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export function useSocket(roomId) {
  const { token } = useAuth()
  const socketRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const incomingCallbackRef = useRef(null)
  const activeRoomRef = useRef(roomId)

  // Keep activeRoomRef in sync
  useEffect(() => {
    activeRoomRef.current = roomId
  }, [roomId])

  // Connect once on mount
  useEffect(() => {
    if (!token) return

    const socket = io(import.meta.env.VITE_SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected')
      // Join ALL rooms on connect so we receive messages from all
      socket.emit('rooms:join-all')
    })
    socket.on('connect_error', (err) => console.error('Socket error:', err.message))

    socket.on('users:online', (ids) => setOnlineUsers(ids))
    socket.on('user:online',  (id)  => setOnlineUsers(prev => [...new Set([...prev, id])]))
    socket.on('user:offline', (id)  => setOnlineUsers(prev => prev.filter(u => u !== id)))

    socket.on('message:receive', (msg) => {
      // Only add to messages state if it's for the active room
      if (msg.room === activeRoomRef.current) {
        setMessages(prev => [...prev, msg])
      }
      // Always fire the unread callback
      if (incomingCallbackRef.current) {
        incomingCallbackRef.current(msg, msg.room)
      }
    })

    socket.on('message:read', ({ messageId, readBy }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, readBy } : msg
      ))
    })

    socket.on('typing:start', ({ username, roomId: tRoom }) => {
      if (tRoom === activeRoomRef.current)
        setTypingUsers(prev => [...new Set([...prev, username])])
    })
    socket.on('typing:stop', ({ username, roomId: tRoom }) => {
      if (tRoom === activeRoomRef.current)
        setTypingUsers(prev => prev.filter(u => u !== username))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token])

  // When room changes, clear local state and join new room
  useEffect(() => {
    if (!socketRef.current || !roomId) return

    const join = () => {
      socketRef.current.emit('room:join', roomId)
      setMessages([])
      setTypingUsers([])
    }

    if (socketRef.current.connected) {
      join()
    } else {
      socketRef.current.once('connect', join)
    }
  }, [roomId])

  const sendTyping = (isTyping) => {
    socketRef.current?.emit(isTyping ? 'typing:start' : 'typing:stop', { roomId })
  }

  const sendMessage = (content, type = 'text', fileName = '') => {
    socketRef.current?.emit('message:send', { roomId, content, type, fileName })
  }

  const markAsRead = (messageId) => {
    socketRef.current?.emit('message:read', { messageId })
  }

  const onIncomingMessage = useCallback((cb) => {
    incomingCallbackRef.current = cb
    return () => { incomingCallbackRef.current = null }
  }, [])

  

  return {
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    onIncomingMessage,
  }
}