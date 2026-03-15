/**
 * components/Chat/MessageBubble.jsx
 * Individual chat message bubble for user and assistant messages.
 */

import TypingIndicator from './TypingIndicator'

const BotIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const isEmpty = message.content === '' && message.isStreaming

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '10px',
      animation: 'fadeUp 0.28s ease',
      padding: '0 4px',
    }}>
      {/* Bot Avatar */}
      {!isUser && (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #00e5c3 0%, #0099ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(0,229,195,0.3)',
        }}>
          <BotIcon />
        </div>
      )}

      {/* Bubble */}
      <div style={{
        maxWidth: '72%',
        padding: isUser ? '11px 16px' : '12px 16px',
        borderRadius: isUser
          ? '18px 18px 4px 18px'
          : '18px 18px 18px 4px',
        fontSize: '0.92rem',
        lineHeight: '1.65',
        letterSpacing: '0.01em',
        background: isUser
          ? 'linear-gradient(135deg, #00c4a7 0%, #0088ee 100%)'
          : 'var(--surface2)',
        color: isUser ? '#000' : 'var(--text)',
        border: isUser ? 'none' : '1px solid var(--border)',
        fontFamily: isUser ? 'var(--font-body)' : 'var(--font-body)',
        fontWeight: isUser ? '500' : '400',
        boxShadow: isUser
          ? '0 4px 20px rgba(0,229,195,0.2)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {isEmpty ? <TypingIndicator /> : message.content}
        {message.isStreaming && !isEmpty && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '14px',
            background: 'var(--accent)',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            animation: 'pulse-dot 0.8s ease-in-out infinite',
          }} />
        )}
      </div>
    </div>
  )
}
