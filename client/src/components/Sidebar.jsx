import { useState } from 'react'

const channels = [
  { id: 'general', name: 'general', unread: 3 },
  { id: 'random', name: 'random', unread: 0 },
  { id: 'dev-talk', name: 'dev-talk', unread: 0 },
]

const directMessages = [
  { id: 'dm-alex', name: 'Alex Kumar', initials: 'AK', online: true, color: 'bg-violet-800 text-violet-200' },
  { id: 'dm-sara', name: 'Sara Rai', initials: 'SR', online: false, color: 'bg-emerald-900 text-emerald-300' },
  { id: 'dm-priya', name: 'Priya Lama', initials: 'PL', online: true, color: 'bg-orange-900 text-orange-300' },
]

export default function Sidebar({ activeRoom, onRoomSelect, currentUser }) {
  const [search, setSearch] = useState('')

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredDMs = directMessages.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
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

      {/* Channels */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Channels
        </p>

        {filteredChannels.map(ch => (
          <button
            key={ch.id}
            onClick={() => onRoomSelect(ch.id)}
            className={`w-full flex items-center gap-2 px-4 py-1.5 text-left transition-colors
              ${activeRoom === ch.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
          >
            <span className="text-zinc-500 font-medium">#</span>
            <span className="text-sm flex-1 truncate">{ch.name}</span>
            {ch.unread > 0 && (
              <span className="bg-violet-600 text-violet-100 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {ch.unread}
              </span>
            )}
          </button>
        ))}

        {/* Direct Messages */}
        <p className="px-4 pt-4 pb-1 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
          Direct messages
        </p>

        {filteredDMs.map(dm => (
          <button
            key={dm.id}
            onClick={() => onRoomSelect(dm.id)}
            className={`w-full flex items-center gap-2 px-4 py-1.5 text-left transition-colors
              ${activeRoom === dm.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
          >
            <div className="relative flex-shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold ${dm.color}`}>
                {dm.initials}
              </div>
              {dm.online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-zinc-900" />
              )}
            </div>
            <span className="text-sm truncate">{dm.name}</span>
          </button>
        ))}
      </div>

      {/* Current user footer */}
      <div className="px-3 py-3 border-t border-zinc-800 flex items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-emerald-700 text-emerald-200 flex items-center justify-center text-[10px] font-semibold">
            {currentUser?.initials || 'SK'}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-zinc-900" />
        </div>
        <span className="text-xs text-zinc-400 flex-1 truncate">{currentUser?.username || 'satoki'}</span>
        <button className="text-zinc-600 hover:text-zinc-300 transition-colors" aria-label="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>
      </div>
    </aside>
  )
}