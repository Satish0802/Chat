import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ChatWindow from '../components/ChatWindow'
import MessageInput from '../components/MessageInput'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function ChatPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeRoom, setActiveRoom] = useState('general')
  const [roomName, setRoomName] = useState('general')
  const [unreadCounts, setUnreadCounts] = useState({})
  const activeRoomRef = useRef('general')

  const {
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    onIncomingMessage,
  } = useSocket(activeRoom)

  // Load message history
  useEffect(() => {
    api.get(`/messages/${activeRoom}`)
      .then(res => { setMessages(res.data) })
      .catch(err => console.error('Failed to load history:', err))
  }, [activeRoom, setMessages])

  // Track unread — use ref to avoid stale closure
  useEffect(() => {
    const unsub = onIncomingMessage((msg, room) => {
      if (room !== activeRoomRef.current) {
        setUnreadCounts(prev => ({
          ...prev,
          [room]: (prev[room] || 0) + 1,
        }))
      }
    })
    return unsub
  }, [onIncomingMessage])

  const handleRoomSelect = useCallback((roomId, displayName) => {
    setActiveRoom(roomId)
    activeRoomRef.current = roomId
    setRoomName(displayName || roomId)
    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }))
  }, [])

  const handleSend = (content, type = 'text', fileName = '') => {
    sendMessage(content, type, fileName)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      <Sidebar
        activeRoom={activeRoom}
        onRoomSelect={handleRoomSelect}
        currentUser={user}
        onlineUsers={onlineUsers}
        onLogout={handleLogout}
        unreadCounts={unreadCounts}
      />

      <div className="flex flex-col flex-1 min-w-0 bg-zinc-900">
        <TopBar
          roomId={activeRoom}
          roomName={roomName}
          onlineCount={onlineUsers.length}
          messages={messages}
          onRoomSelect={(roomId) => handleRoomSelect(roomId, roomId)}
          unreadCounts={unreadCounts}
        />

        <ChatWindow
          messages={messages}
          currentUser={user}
          typingUsers={typingUsers}
          markAsRead={markAsRead}
        />

        <MessageInput
          onSend={handleSend}
          onTyping={sendTyping}
          roomName={roomName}
        />
      </div>
    </div>
  )
}