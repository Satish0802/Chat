import { useState, useEffect } from 'react'
import api from '../lib/api'

const CHANNELS = [
  { id: 'general', name: 'general', unread: 0 },
  { id: 'random', name: 'random', unread: 0 },
  { id: 'dev-talk', name: 'dev-talk', unread: 0 },
]

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  'bg-violet-800 text-violet-200',
  'bg-emerald-900 text-emerald-300',
  'bg-orange-900 text-orange-300',
  'bg-sky-900 text-sky-300',
  'bg-pink-900 text-pink-300',
]
function avatarColor(id = '') {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function Sidebar({ activeRoom, onRoomSelect, currentUser, onlineUsers, onLogout }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/auth/users').then(r => setUsers(r.data)).catch(console.error)
  }, [])

  const getDmRoomId = (otherUserId) =>
    [currentUser._id, otherUserId].sort().join('_')

  const filteredChannels = CHANNELS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className="w-56 flex-shrink-0 bg-zinc-900 flex flex-col select-none">
      {/* App header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-white text-sm font-semibold tracking-wide">Chatwave</span>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-zinc-800 text-zinc-300 text-xs placeholder-zinc-500 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Channels */}
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Channels
        </p>
        {filteredChannels.map(ch => (
          <button
            key={ch.id}
            onClick={() => onRoomSelect(ch.id, ch.name)}
            className={`w-full flex items-center gap-2 px-4 py-1.5 text-left transition-colors
              ${activeRoom === ch.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
          >
            <span className="text-zinc-500 font-medium">#</span>
            <span className="text-sm flex-1 truncate">{ch.name}</span>
          </button>
        ))}

        {/* Direct Messages */}
        <p className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Direct messages
        </p>
        {filteredUsers.map(u => {
          const roomId = getDmRoomId(u._id)
          const isOnline = onlineUsers?.includes(u._id)
          return (
            <button
              key={u._id}
              onClick={() => onRoomSelect(roomId, u.username)}
              className={`w-full flex items-center gap-2 px-4 py-1.5 text-left transition-colors
                ${activeRoom === roomId
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold ${avatarColor(u._id)}`}>
                  {initials(u.username)}
                </div>
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                )}
              </div>
              <span className="text-sm truncate">{u.username}</span>
            </button>
          )
        })}
      </div>

      {/* Current user footer */}
<div className="px-3 py-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2.5">
  <div className="relative flex-shrink-0">
    <div className="w-8 h-8 rounded-full bg-emerald-700 text-emerald-200 flex items-center justify-center text-xs font-semibold">
      {initials(currentUser?.username || '')}
    </div>
    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-white text-xs font-semibold truncate">{currentUser?.username}</p>
    <p className="text-emerald-500 text-[10px] font-medium">● Online</p>
  </div>
  <button
    onClick={onLogout}
    title="Logout"
    className="text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded hover:bg-zinc-800"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
    </svg>
  </button>
</div>
    </aside>
  )
}