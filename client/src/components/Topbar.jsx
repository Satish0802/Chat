import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'

const CHANNEL_IDS = ['general', 'random', 'dev-talk']

export default function TopBar({
  roomId, roomName, onlineCount = 0,
  messages = [], onRoomSelect, unreadCounts = {},
  currentUser, onLeaveRoom,
}) {
  const isDM = !CHANNEL_IDS.includes(roomId) && roomId?.includes('_')
  const displayName = roomName || roomId

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [members, setMembers] = useState([])
  const [roomInfo, setRoomInfo] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  // Fetch members when panel opens for a channel
  useEffect(() => {
    if (!panelOpen || isDM) return
    api.get('/rooms').then(r => {
      const room = r.data.find(rm => rm.name === roomId)
      if (room) {
        setRoomInfo(room)
        setMembers(room.members || [])
      }
    }).catch(console.error)
  }, [panelOpen, roomId, isDM])

  const closeAll = () => {
    setSearchOpen(false)
    setPanelOpen(false)
    setNotifOpen(false)
    setSearchQuery('')
  }

  // Search results
  const searchResults = searchQuery.trim().length > 1
    ? messages.filter(m =>
        m.type === 'text' &&
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Shared media/files
  const sharedImages = messages.filter(m => m.type === 'image')
  const sharedFiles = messages.filter(m => m.type === 'file')

  // Unread
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0)
  const unreadRooms = Object.entries(unreadCounts).filter(([, count]) => count > 0)

  const isOwner = roomInfo?.createdBy?._id === currentUser?._id ||
    roomInfo?.createdBy === currentUser?._id

  const handleLeave = async () => {
    if (!roomInfo) return
    if (!window.confirm(`Leave #${roomInfo.name}?`)) return
    try {
      await api.post(`/rooms/${roomInfo._id}/leave`)
      closeAll()
      onLeaveRoom && onLeaveRoom()
    } catch (err) {
      console.error('Leave failed:', err)
    }
  }

  const handleKick = async (memberId) => {
    if (!roomInfo) return
    try {
      await api.post(`/rooms/${roomInfo._id}/kick`, { userId: memberId })
      setMembers(prev => prev.filter(m => (m._id || m) !== memberId))
    } catch (err) {
      console.error('Kick failed:', err)
    }
  }

  const handleBlock = async () => {
    // Get other user ID from DM room
    const otherUserId = roomId.split('_').find(id => id !== currentUser?._id)
    if (!otherUserId) return
    if (!window.confirm('Block this user? They will no longer be able to message you.')) return
    try {
      await api.post(`/auth/block/${otherUserId}`)
      closeAll()
    } catch (err) {
      console.error('Block failed:', err)
    }
  }

  return (
    <div className="relative flex-shrink-0">
      {/* Main bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {isDM ? (
            <div className="w-5 h-5 rounded-full bg-violet-800 flex items-center justify-center text-[9px] text-violet-200 font-semibold flex-shrink-0">
              {displayName?.slice(0, 1).toUpperCase()}
            </div>
          ) : (
            <span className="text-zinc-400 text-lg font-light leading-none">#</span>
          )}
          <span className="text-white text-sm font-semibold truncate capitalize">{displayName}</span>
          {!isDM && (
            <span className="text-zinc-500 text-xs flex-shrink-0">· {onlineCount} online</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-zinc-500">
          {/* Search */}
          <IconBtn label="Search" onClick={() => { closeAll(); setSearchOpen(true) }} active={searchOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </IconBtn>

          {/* Info panel */}
          <IconBtn label={isDM ? 'Info' : 'Members & info'} onClick={() => { const o = !panelOpen; closeAll(); setPanelOpen(o) }} active={panelOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </IconBtn>

          {/* Bell */}
          <div className="relative">
            <IconBtn label="Notifications" onClick={() => { const o = !notifOpen; closeAll(); setNotifOpen(o) }} active={notifOpen}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </IconBtn>
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search dropdown */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 px-5 py-3 shadow-xl">
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-zinc-800 text-zinc-200 text-sm placeholder-zinc-500 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-violet-500"
          />
          {searchQuery.trim().length > 1 && (
            <div className="mt-2 max-h-64 overflow-y-auto space-y-1">
              {searchResults.length === 0 ? (
                <p className="text-zinc-500 text-xs py-2 text-center">No messages found</p>
              ) : searchResults.map(msg => (
                <div key={msg._id} className="bg-zinc-800 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-zinc-500 mb-0.5">{msg.senderName}</p>
                  <p className="text-sm text-zinc-200">{highlight(msg.content, searchQuery)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications dropdown */}
      {notifOpen && (
        <div className="absolute top-full right-0 z-50 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl mt-1 mr-4 overflow-hidden">
          <p className="text-xs font-semibold text-zinc-400 px-4 py-3 border-b border-zinc-800">Notifications</p>
          {unreadRooms.length === 0 ? (
            <p className="text-zinc-500 text-xs text-center py-6">All caught up!</p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {unreadRooms.map(([room, count]) => (
                <button
                  key={room}
                  onClick={() => { onRoomSelect && onRoomSelect(room); closeAll() }}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-sm text-zinc-200 truncate">
                    {room.includes('_') ? '💬 DM' : `# ${room}`}
                  </span>
                  <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info / Members panel */}
      {panelOpen && (
        <div className="absolute top-full right-0 z-50 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl mt-1 mr-4 overflow-hidden max-h-[85vh] flex flex-col">

          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
            <p className="text-xs font-semibold text-zinc-400">
              {isDM ? 'Conversation info' : `# ${displayName}`}
            </p>
            <button onClick={() => setPanelOpen(false)} className="text-zinc-500 hover:text-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1">

            {/* Shared images */}
            {sharedImages.length > 0 && (
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                  Media · {sharedImages.length}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {sharedImages.map(img => (
                    <img
                      key={img._id}
                      src={img.content}
                      alt=""
                      className="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(img.content, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Shared files */}
            {sharedFiles.length > 0 && (
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                  Files · {sharedFiles.length}
                </p>
                <div className="space-y-1.5">
                  {sharedFiles.map(f => (
                    <a
                      key={f._id}
                      href={f.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 truncate"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <span className="truncate">{f.fileName || 'File'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {sharedImages.length === 0 && sharedFiles.length === 0 && (
              <div className="px-4 py-4 border-b border-zinc-800">
                <p className="text-zinc-500 text-xs text-center">No shared media yet</p>
              </div>
            )}

            {/* Channel members */}
            {!isDM && members.length > 0 && (
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                  Participants · {members.length}
                </p>
                <div className="space-y-2">
                  {members.map(m => {
                    const id = m._id || m
                    const name = m.username || id
                    const avatar = m.avatar
                    const isSelf = id?.toString() === currentUser?._id?.toString()
                    return (
                      <div key={id} className="flex items-center gap-2">
                        {avatar ? (
                          <img src={avatar} alt={name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-violet-800 text-violet-200 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                            {name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-zinc-300 flex-1 truncate">
                          {name} {isSelf && <span className="text-zinc-500 text-[10px]">(you)</span>}
                        </span>
                        {isOwner && !isSelf && (
                          <button
                            onClick={() => handleKick(id)}
                            className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-900/30 transition-colors flex-shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 space-y-1">
              {!isDM && (
                <button
                  onClick={handleLeave}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors text-sm text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                  </svg>
                  Leave and delete
                </button>
              )}
              {isDM && (
                <button
                  onClick={handleBlock}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors text-sm text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Block user
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-violet-500/40 text-white rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function IconBtn({ label, children, onClick, active }) {
  return (
    <button
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${active ? 'bg-zinc-700 text-violet-400' : 'hover:bg-zinc-800'}`}
      aria-label={label}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}