import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

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

export default function Sidebar({ activeRoom, onRoomSelect, currentUser, onlineUsers, onLogout, unreadCounts = {} }) {
  const [rooms, setRooms] = useState([])
  const [dmUsers, setDmUsers] = useState([]) // users with existing DM history
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([]) // user search results
  const [joining, setJoining] = useState(null)
  const navigate = useNavigate()

  const fetchRooms = useCallback(() => {
    api.get('/rooms').then(r => setRooms(r.data)).catch(console.error)
  }, [])

  // Fetch users who have DM history with current user
  const fetchDmUsers = useCallback(() => {
    api.get('/auth/dm-users').then(r => setDmUsers(r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    fetchRooms()
    fetchDmUsers()
  }, [fetchRooms, fetchDmUsers])

  // Search users when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      api.get(`/auth/users?search=${searchQuery}`)
        .then(r => setSearchResults(r.data))
        .catch(console.error)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const isMember = (room) => {
    if (!room.members || !currentUser?._id) return false
    return room.members.some(m => {
      const id = typeof m === 'object' ? m._id?.toString() : m?.toString()
      return id === currentUser._id.toString()
    })
  }

  const handleJoin = async (room) => {
    setJoining(room._id)
    try {
      await api.post(`/rooms/${room._id}/join`)
      fetchRooms()
      onRoomSelect(room.name, room.name)
    } catch (err) {
      console.error('Join failed:', err)
    } finally {
      setJoining(null)
    }
  }

  const getDmRoomId = (otherUserId) =>
    [currentUser._id, otherUserId].sort().join('_')

  const handleUserClick = (user) => {
    setSearchQuery('')
    setSearchResults([])
    const roomId = getDmRoomId(user._id)
    onRoomSelect(roomId, user.username)
    fetchDmUsers() // refresh DM list
  }

  const myRooms = rooms.filter(r => isMember(r))
  const joinableRooms = rooms.filter(r => !isMember(r) && !r.isPrivate)

  return (
    <aside className="w-56 flex-shrink-0 bg-zinc-900 flex flex-col select-none">

      {/* App header */}
      <div className="px-4 pt-4 pb-3 relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-white text-sm font-semibold tracking-wide">Chatwave</span>
        </div>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-zinc-800 text-zinc-300 text-xs placeholder-zinc-500 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500"
        />
        {/* Search dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {searchResults.map(u => (
              <button
                key={u._id}
                onClick={() => handleUserClick(u)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left"
              >
                {u.avatar ? (
                  <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${avatarColor(u._id)}`}>
                    {initials(u.username)}
                  </div>
                )}
                <span className="text-sm text-zinc-200 truncate">{u.username}</span>
                {onlineUsers?.includes(u._id) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 ml-auto" />
                )}
              </button>
            ))}
          </div>
        )}
        {searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 px-3 py-2">
            <p className="text-xs text-zinc-500">No users found</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* My Channels */}
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Channels
        </p>
        {myRooms.length === 0 && (
          <p className="px-4 text-[11px] text-zinc-600 py-1">No channels yet</p>
        )}
        {myRooms.map(room => {
          const unread = unreadCounts[room.name] || 0
          return (
            <button
              key={room._id}
              onClick={() => onRoomSelect(room.name, room.name)}
              className={`w-full flex items-center gap-2 px-4 py-1.5 text-left transition-colors
                ${activeRoom === room.name
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
            >
              <span className="text-zinc-500 font-medium">#</span>
              <span className="text-sm flex-1 truncate">{room.name}</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )
        })}

        {/* Joinable channels */}
        {joinableRooms.length > 0 && (
          <>
            <p className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
              Browse channels
            </p>
            {joinableRooms.map(room => (
              <div key={room._id} className="flex items-center gap-2 px-4 py-1.5">
                <span className="text-zinc-600 font-medium">#</span>
                <span className="text-sm flex-1 truncate text-zinc-500">{room.name}</span>
                <button
                  onClick={() => handleJoin(room)}
                  disabled={joining === room._id}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-violet-700 hover:bg-violet-600 text-white transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {joining === room._id ? '...' : 'Join'}
                </button>
              </div>
            ))}
          </>
        )}

        {/* Direct Messages — only existing conversations */}
        <p className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Direct messages
        </p>
        {dmUsers.length === 0 && (
          <p className="px-4 text-[11px] text-zinc-600 py-1">Search to start a DM</p>
        )}
        {dmUsers.map(u => {
          const roomId = getDmRoomId(u._id)
          const isOnline = onlineUsers?.includes(u._id)
          const unread = unreadCounts[roomId] || 0
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
                {u.avatar ? (
                  <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold ${avatarColor(u._id)}`}>
                    {initials(u.username)}
                  </div>
                )}
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-zinc-900" />
                )}
              </div>
              <span className="text-sm truncate flex-1">{u.username}</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2.5">
        <button onClick={() => navigate('/profile')} className="relative flex-shrink-0 group" title="View profile">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Your avatar" className="w-8 h-8 rounded-full object-cover ring-1 ring-zinc-700 group-hover:ring-violet-500 transition-all" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-emerald-200 flex items-center justify-center text-xs font-semibold ring-1 ring-zinc-700 group-hover:ring-violet-500 transition-all">
              {initials(currentUser?.username || '')}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{currentUser?.username}</p>
          <p className="text-emerald-500 text-[10px] font-medium">● Online</p>
        </div>
        <button onClick={onLogout} title="Logout" className="text-zinc-500 hover:text-red-400 transition-colors flex-shrink-0 p-1 rounded hover:bg-zinc-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
          </svg>
        </button>
      </div>
    </aside>
  )
}