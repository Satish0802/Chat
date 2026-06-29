import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ChatWindow from '../components/ChatWindow'
import MessageInput from '../components/MessageInput'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

const STORAGE_KEY = 'chatwave_last_room'

function getLastRoom() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return saved || { id: 'general', name: 'general' }
  } catch {
    return { id: 'general', name: 'general' }
  }
}

export default function ChatPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const lastRoom = getLastRoom()
  const [activeRoom, setActiveRoom] = useState(lastRoom.id)
  const [roomName, setRoomName] = useState(lastRoom.name)
  const [unreadCounts, setUnreadCounts] = useState({})
  const activeRoomRef = useRef(lastRoom.id)

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

  // Track unread
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: roomId, name: displayName || roomId }))
  }, [])

  // When user leaves a channel, go back to general
  const handleLeaveRoom = useCallback(() => {
    handleRoomSelect('general', 'general')
  }, [handleRoomSelect])

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
          currentUser={user}
          onLeaveRoom={handleLeaveRoom}
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