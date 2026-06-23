import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

// Groups consecutive messages by same sender so we only show
// avatar + name on the first message in a cluster
function groupMessages(messages) {
  return messages.map((msg, i) => {
    const prev = messages[i - 1]
    const showAvatar =
      !prev ||
      prev.senderId !== msg.senderId ||
      new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000 // 5 min gap
    return { ...msg, showAvatar }
  })
}

function formatDateSep(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

// Insert date separator objects between messages from different days
function injectDateSeps(messages) {
  const result = []
  let lastDate = null
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString()
    if (d !== lastDate) {
      result.push({ type: 'date-sep', label: formatDateSep(msg.createdAt), id: `sep-${d}` })
      lastDate = d
    }
    result.push(msg)
  }
  return result
}

export default function ChatWindow({ messages, currentUser, typingUsers }) {
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const grouped = groupMessages(messages)
  const withSeps = injectDateSeps(grouped)

  const typingNames = typingUsers
    ?.filter(u => u !== currentUser?.username)
    .slice(0, 3) || []

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm font-medium">No messages yet</p>
          <p className="text-zinc-600 text-xs mt-1">Be the first to say something!</p>
        </div>
      )}

      {/* Messages + date separators */}
      {withSeps.map(item => {
        if (item.type === 'date-sep') {
          return (
            <div key={item.id} className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[11px] text-zinc-500 font-medium flex-shrink-0">{item.label}</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
          )
        }

        return (
          <div key={item._id} className={item.showAvatar ? 'pt-2' : 'pt-0.5'}>
            <MessageBubble
              message={item}
              isOwn={item.senderId === currentUser?._id}
              showAvatar={item.showAvatar}
            />
          </div>
        )
      })}

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="flex items-center gap-2 py-1 pl-10">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-zinc-500 italic">
            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}