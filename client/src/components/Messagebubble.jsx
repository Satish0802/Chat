function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const AVATAR_COLORS = [
  'bg-violet-800 text-violet-200',
  'bg-emerald-900 text-emerald-300',
  'bg-orange-900 text-orange-300',
  'bg-sky-900 text-sky-300',
  'bg-pink-900 text-pink-300',
  'bg-amber-900 text-amber-300',
]

function avatarColor(userId = '') {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function ReadStatus({ readBy, senderId, isOwn }) {
  const readByOthers = readBy?.filter(id => id !== senderId) || []
  const isRead = readByOthers.length > 0

  const colorClass = isRead
    ? 'text-blue-400'
    : isOwn
      ? 'text-violet-200/60'
      : 'text-zinc-400'

  return (
    <span className={`flex items-center ${colorClass}`}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {isRead && (
        <svg className="w-3 h-3 -ml-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </span>
  )
}

function FileBubble({ content, fileName, isOwn }) {
  return (
    
      <a href={content.replace('/raw/upload/', '/raw/upload/fl_attachment:false/')}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 mt-1 max-w-xs transition-colors
        ${isOwn
          ? 'bg-violet-700 hover:bg-violet-600 text-violet-100'
          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
        }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        ${isOwn ? 'bg-violet-800' : 'bg-zinc-700'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{fileName || 'Download file'}</p>
        <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-violet-300' : 'text-zinc-500'}`}>
          Click to open
        </p>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-violet-300' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    </a>
  )
}

function ImageBubble({ content }) {
  return (
    <img
      src={content}
      alt="shared image"
      className="rounded-xl max-w-xs lg:max-w-sm max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity mt-1"
      onClick={() => window.open(content, '_blank')}
    />
  )
}

export default function MessageBubble({
  content,
  type,
  fileName,
  createdAt,
  senderId,
  senderName,
  senderAvatar,
  readBy,
  isOwn,
  showAvatar,
}) {

  // ── Own message (right-aligned) ────────────────────────────────────────
  if (isOwn) {
    return (
      <div className="flex justify-end items-end gap-2">
        <div className="max-w-xs lg:max-w-sm">

          {type === 'image' && (
            <>
              <ImageBubble content={content} />
              <div className="flex justify-end items-center gap-1 mt-0.5">
                <span className="text-[10px] text-zinc-500">{formatTime(createdAt)}</span>
                <ReadStatus readBy={readBy} senderId={senderId} isOwn={true} />
              </div>
            </>
          )}

          {type === 'file' && (
            <>
              <FileBubble content={content} fileName={fileName} isOwn />
              <div className="flex justify-end items-center gap-1 mt-0.5">
                <span className="text-[10px] text-zinc-500">{formatTime(createdAt)}</span>
                <ReadStatus readBy={readBy} senderId={senderId} isOwn={true} />
              </div>
            </>
          )}

          {type === 'text' && (
            <div className="bg-violet-600 text-white text-sm leading-relaxed px-4 py-2 rounded-2xl rounded-br-sm">
              <div className="flex items-end justify-between gap-2">
                <span className="break-words">{content}</span>
                <div className="flex items-center gap-1 flex-shrink-0 translate-y-0.5 ml-2">
                  <span className="text-[10px] text-violet-200/70 whitespace-nowrap">{formatTime(createdAt)}</span>
                  <ReadStatus readBy={readBy} senderId={senderId} isOwn={true} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  // ── Other user message (left-aligned) ──────────────────────────────────
  return (
    <div className="flex items-start gap-2.5">

      <div className="flex-shrink-0 w-8">
        {showAvatar && (
          senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${avatarColor(senderId)}`}>
              {initials(senderName)}
            </div>
          )
        )}
      </div>

      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-zinc-200">{senderName}</span>
            <span className="text-[10px] text-zinc-500">{formatTime(createdAt)}</span>
          </div>
        )}

        <div className="max-w-xs lg:max-w-sm">
          {type === 'image' && <ImageBubble content={content} />}
          {type === 'file' && <FileBubble content={content} fileName={fileName} isOwn={false} />}
          {type === 'text' && (
            <div className="flex items-end gap-2">
              <p className="text-sm text-zinc-300 leading-relaxed">{content}</p>
              {!showAvatar && (
                <span className="text-[10px] text-zinc-500 flex-shrink-0 mb-0.5">
                  {formatTime(createdAt)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}