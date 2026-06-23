import { useState, useRef, useEffect } from 'react'

export default function MessageInput({ onSend, onTyping, roomName }) {
  const [value, setValue] = useState('')
  const typingTimeout = useRef(null)
  const inputRef = useRef(null)

  // Focus input whenever room changes
  useEffect(() => { inputRef.current?.focus() }, [roomName])

  const handleChange = e => {
    setValue(e.target.value)
    onTyping?.(true)
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onTyping?.(false), 1500)
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
    clearTimeout(typingTimeout.current)
    onTyping?.(false)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 py-3 border-t border-zinc-800">
      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">

        {/* Attach */}
        <button
          className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
          aria-label="Attach file"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
        </button>

        {/* Textarea — grows with content */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${roomName}`}
          rows={1}
          className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
          style={{ fieldSizing: 'content' }}
        />

        {/* Emoji */}
        <button
          className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
          aria-label="Emoji"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
          </svg>
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-colors"
          aria-label="Send message"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </div>

      <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
        Press <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">Enter</kbd> to send · <kbd className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-500">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}