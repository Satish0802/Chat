// Top bar of the chat panel — shows room name, online count, and action icons

export default function TopBar({ roomId, onlineCount = 0 }) {
  const isDM = roomId?.startsWith('dm-')
  const displayName = isDM ? roomId.replace('dm-', '').replace('-', ' ') : roomId

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800 flex-shrink-0">

      {/* Room name */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {isDM ? (
          <div className="w-5 h-5 rounded-full bg-violet-800 flex items-center justify-center text-[9px] text-violet-200 font-semibold flex-shrink-0">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        ) : (
          <span className="text-zinc-400 text-lg font-light leading-none">#</span>
        )}
        <span className="text-white text-sm font-semibold truncate capitalize">{displayName}</span>
        {!isDM && (
          <span className="text-zinc-500 text-xs flex-shrink-0">· {onlineCount} online</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 text-zinc-500">
        <IconBtn label="Search messages">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </IconBtn>

        {!isDM && (
          <IconBtn label="Members">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </IconBtn>
        )}

        <IconBtn label="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </IconBtn>
      </div>
    </div>
  )
}

function IconBtn({ label, children }) {
  return (
    <button
      className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors"
      aria-label={label}
      type="button"
    >
      {children}
    </button>
  )
}