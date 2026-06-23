// Renders a single message row.
// If message.senderId === currentUser.id  → right-aligned own bubble
// Otherwise → left-aligned with avatar + name

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Deterministic colour per user so avatars stay consistent
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

export default function MessageBubble({ message, isOwn, showAvatar }) {
  const { senderName, senderId, content, createdAt, type } = message

  if (isOwn) {
    return (
      <div className="flex justify-end items-end gap-2 group">
        <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1">
          {formatTime(createdAt)}
        </span>
        <div className="max-w-xs lg:max-w-sm">
          {type === 'image' ? (
            <img src={content} alt="shared" className="rounded-xl max-w-full" />
          ) : (
            <div className="bg-violet-600 text-white text-sm leading-relaxed px-4 py-2 rounded-2xl rounded-br-sm">
              {content}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2.5 group">
      {/* Avatar — only show on first message in a cluster */}
      <div className="flex-shrink-0 w-8">
        {showAvatar && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${avatarColor(senderId)}`}>
            {initials(senderName)}
          </div>
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
          {type === 'image' ? (
            <img src={content} alt="shared" className="rounded-xl max-w-full" />
          ) : (
            <p className={`text-sm text-zinc-300 leading-relaxed ${!showAvatar ? 'pl-0' : ''}`}>
              {content}
            </p>
          )}
        </div>
      </div>

      <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1 flex-shrink-0">
        {!showAvatar && formatTime(createdAt)}
      </span>
    </div>
  )
}