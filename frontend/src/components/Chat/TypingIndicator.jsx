/**
 * components/Chat/TypingIndicator.jsx
 * Animated dots shown while AI is generating a response.
 */

export default function TypingIndicator() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            animation: `bounce-dot 1.3s ease-in-out infinite`,
            animationDelay: `${i * 0.18}s`,
            opacity: 0.7,
          }}
        />
      ))}
    </span>
  )
}
