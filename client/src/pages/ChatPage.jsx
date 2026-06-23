import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ChatWindow from '../components/ChatWindow'
import MessageInput from '../components/MessageInput'
// import { useSocket } from '../hooks/useSocket'   ← uncomment when backend is ready
// import api from '../lib/api'                     ← uncomment when backend is ready

// ---------------------------------------------------------------------------
// MOCK DATA — replace with real socket + API calls when backend is ready
// ---------------------------------------------------------------------------
const MOCK_USER = { _id: 'user-me', username: 'satoki', initials: 'SK' }

const MOCK_MESSAGES = [
  {
    _id: '1', senderId: 'user-alex', senderName: 'Alex Kumar',
    content: "Hey everyone! How's the project going?",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(), type: 'text',
  },
  {
    _id: '2', senderId: 'user-sara', senderName: 'Sara Rai',
    content: 'Going great! Just pushed the auth module 🚀',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(), type: 'text',
  },
  {
    _id: '3', senderId: 'user-alex', senderName: 'Alex Kumar',
    content: 'Nice! Did you handle the JWT refresh token too?',
    createdAt: new Date(Date.now() - 7 * 60000).toISOString(), type: 'text',
  },
  {
    _id: '4', senderId: 'user-me', senderName: 'satoki',
    content: "I'll review it now and add the refresh token logic.",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(), type: 'text',
  },
  {
    _id: '5', senderId: 'user-me', senderName: 'satoki',
    content: 'Should be done in ~30 mins.',
    createdAt: new Date(Date.now() - 5 * 60000 + 30000).toISOString(), type: 'text',
  },
  {
    _id: '6', senderId: 'user-sara', senderName: 'Sara Rai',
    content: 'Sounds good! Let me know if you need help 👍',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(), type: 'text',
  },
]
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const [activeRoom, setActiveRoom] = useState('general')
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [typingUsers, setTypingUsers] = useState([])

  // ── When backend is ready, replace the block below ──────────────────────
  // const { messages, setMessages, sendMessage, sendTyping, typingUsers } = useSocket(activeRoom)
  //
  // useEffect(() => {
  //   api.get(`/messages/${activeRoom}`).then(r => setMessages(r.data))
  // }, [activeRoom])
  // ────────────────────────────────────────────────────────────────────────

  // Mock: clear messages when switching rooms
  useEffect(() => {
    setMessages(activeRoom === 'general' ? MOCK_MESSAGES : [])
    setTypingUsers([])
  }, [activeRoom])

  const handleSend = (content) => {
    const newMsg = {
      _id: Date.now().toString(),
      senderId: MOCK_USER._id,
      senderName: MOCK_USER.username,
      content,
      createdAt: new Date().toISOString(),
      type: 'text',
    }
    setMessages(prev => [...prev, newMsg])
    // When backend ready: sendMessage(content)
  }

  const handleTyping = (isTyping) => {
    // When backend ready: sendTyping(isTyping)
    console.log('typing:', isTyping)
  }

  const roomDisplayName = activeRoom.startsWith('dm-')
    ? activeRoom.replace('dm-', '').replace('-', ' ')
    : activeRoom

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      <Sidebar
        activeRoom={activeRoom}
        onRoomSelect={setActiveRoom}
        currentUser={MOCK_USER}
      />

      {/* Main chat panel */}
      <div className="flex flex-col flex-1 min-w-0 bg-zinc-900">
        <TopBar roomId={activeRoom} onlineCount={12} />

        <ChatWindow
          messages={messages}
          currentUser={MOCK_USER}
          typingUsers={typingUsers}
        />

        <MessageInput
          onSend={handleSend}
          onTyping={handleTyping}
          roomName={roomDisplayName}
        />
      </div>
    </div>
  )
}