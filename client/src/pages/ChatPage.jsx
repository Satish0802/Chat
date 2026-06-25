import { useState, useEffect } from 'react'
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

  const {
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
  } = useSocket(activeRoom)

  // Load message history from REST whenever room changes
  useEffect(() => {
    api.get(`/messages/${activeRoom}`)
      .then(res => {
        // Shape matches what socket emits
        const shaped = res.data.map(m => ({
          _id: m._id,
          senderId: m.sender._id,
          senderName: m.sender.username,
          content: m.content,
          type: m.type,
          createdAt: m.createdAt,
        }))
        setMessages(shaped)
      })
      .catch(err => console.error('Failed to load history:', err))
  }, [activeRoom, setMessages])

  const handleRoomSelect = (roomId, displayName) => {
  setActiveRoom(roomId)
  setRoomName(displayName || roomId) // Fallback to roomId if displayName is not provided
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
      />

      <div className="flex flex-col flex-1 min-w-0 bg-zinc-900">
        <TopBar roomId={activeRoom} roomName={roomName} onlineCount={onlineUsers.length} />

        <ChatWindow
          messages={messages}
          currentUser={user}
          typingUsers={typingUsers}
        />

        <MessageInput
          onSend={sendMessage}
          onTyping={sendTyping}
          roomName={roomName}
        />
      </div>
    </div>
  )
}