/**
 * components/Chat/ChatWindow.jsx
 * The main chat interface. Handles input, message list, and suggestions.
 */

import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const BotIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

const SUGGESTIONS = [
  'What are your business hours?',
  'How do I reset my password?',
  'What is your refund policy?',
  'How do I contact support?',
]

export default function ChatWindow({ messages, isStreaming, onSend, onClear }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef()
  const textareaRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'
  }, [input])

  const handleSend = () => {
    const q = input.trim()
    if (!q || isStreaming) return
    setInput('')
    onSend(q)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '780px',
      width: '100%',
      margin: '0 auto',
      padding: '0 24px',
      height: '100%',
    }}>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>

        {isEmpty ? (
          /* Empty state */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '16px',
            paddingBottom: '60px',
            animation: 'fadeIn 0.5s ease',
          }}>
            {/* Bot icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              boxShadow: '0 0 32px var(--accent-glow)',
              marginBottom: '4px',
            }}>
              <BotIcon />
            </div>

            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: 'var(--text)',
                marginBottom: '6px',
              }}>
                How can I help you?
              </h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
                Ask me anything about our products and services.
              </p>
            </div>

            {/* Suggestion chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              marginTop: '8px',
            }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border2)',
                    background: 'var(--surface)',
                    color: 'var(--text-2)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => {
                    e.target.style.borderColor = 'var(--accent)'
                    e.target.style.color = 'var(--accent)'
                    e.target.style.background = 'var(--accent-glow2)'
                  }}
                  onMouseLeave={e => {
                    e.target.style.borderColor = 'var(--border2)'
                    e.target.style.color = 'var(--text-2)'
                    e.target.style.background = 'var(--surface)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '12px 0 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>

        {/* Clear button (only when there are messages) */}
        {!isEmpty && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-3)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--danger)'
                e.currentTarget.style.color = 'var(--danger)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-3)'
              }}
            >
              <TrashIcon /> New chat
            </button>
          </div>
        )}

        {/* Input row */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 10px 10px 18px',
          transition: 'border-color 0.2s',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
          onFocus={() => {}}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.93rem',
              lineHeight: '1.5',
              resize: 'none',
              padding: '4px 0',
              maxHeight: '130px',
              opacity: isStreaming ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background: isStreaming || !input.trim()
                ? 'var(--surface3)'
                : 'linear-gradient(135deg, #00e5c3, #0099ff)',
              color: isStreaming || !input.trim() ? 'var(--text-3)' : '#000',
              cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
              boxShadow: !isStreaming && input.trim()
                ? '0 4px 16px rgba(0,229,195,0.3)'
                : 'none',
            }}
          >
            <SendIcon />
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-3)',
          fontFamily: 'var(--font-mono)',
        }}>
          Answers are based on uploaded knowledge base documents only.
        </p>
      </div>
    </div>
  )
}
