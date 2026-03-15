/**
 * App.jsx
 * Root component. Handles layout, tab navigation, and notification system.
 */

import { useState, useCallback } from 'react'
import ChatWindow from './components/Chat/ChatWindow'
import AdminPanel from './components/Admin/AdminPanel'
import { useChat } from './hooks/useChat'
import { useDocuments } from './hooks/useDocuments'

// ── Notification system ───────────────────────────────────────────────────────
function Notification({ note }) {
  if (!note) return null
  const colors = {
    success: { bg: 'rgba(0,229,195,0.12)', border: 'var(--accent)', color: 'var(--accent)' },
    error:   { bg: 'rgba(255,71,87,0.12)',  border: 'var(--danger)', color: 'var(--danger)' },
    info:    { bg: 'rgba(255,165,2,0.12)',   border: 'var(--warning)', color: 'var(--warning)' },
  }
  const c = colors[note.type] || colors.info
  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      borderRadius: 'var(--radius)',
      border: `1px solid ${c.border}`,
      background: c.bg,
      color: c.color,
      fontSize: '0.85rem',
      fontWeight: 500,
      whiteSpace: 'nowrap',
      zIndex: 1000,
      backdropFilter: 'blur(12px)',
      animation: 'notification-in 0.3s ease',
      fontFamily: 'var(--font-body)',
    }}>
      {note.message}
    </div>
  )
}

// ── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '1.05rem',
      letterSpacing: '-0.3px',
      color: 'var(--text)',
      userSelect: 'none',
    }}>
      {/* Animated logo mark */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #00e5c3, #0099ff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 16px rgba(0,229,195,0.35)',
        fontSize: '14px',
        fontWeight: 800,
        color: '#000',
      }}>
        S
      </div>
      Support<span style={{ color: 'var(--accent)' }}>AI</span>
    </div>
  )
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ documents }) {
  const ready = documents.filter(d => d.status === 'ready').length
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 12px',
      borderRadius: '20px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      fontSize: '0.76rem',
      color: ready > 0 ? 'var(--accent)' : 'var(--text-3)',
      fontFamily: 'var(--font-mono)',
    }}>
      <span style={{
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: ready > 0 ? 'var(--accent)' : 'var(--text-3)',
        animation: ready > 0 ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }} />
      {ready} doc{ready !== 1 ? 's' : ''} active
    </div>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 18px',
        borderRadius: '8px',
        border: 'none',
        background: active ? 'var(--surface2)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text-3)',
        fontSize: '0.85rem',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        transition: 'all 0.18s',
        outline: 'none',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </button>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [notification, setNotification] = useState(null)

  const { messages, isStreaming, send, clearChat } = useChat()
  const { documents, isLoading, isUploading, uploadProgress, upload, remove, reload } = useDocuments()

  const notify = useCallback((message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }, [])

  const handleUpload = useCallback(async (file) => {
    const result = await upload(file)
    if (result.success) {
      notify(`"${result.name}" uploaded — processing started`)
    } else {
      notify(result.error || 'Upload failed', 'error')
    }
  }, [upload, notify])

  const handleDelete = useCallback(async (docId) => {
    const result = await remove(docId)
    if (result.success) {
      notify(`"${result.name}" deleted`, 'error')
    }
  }, [remove, notify])

  const handleClearChat = useCallback(() => {
    clearChat()
    notify('Chat cleared', 'info')
  }, [clearChat, notify])

  return (
    <>
      {/* Grid background texture */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Accent glow top-left */}
      <div style={{
        position: 'fixed',
        top: '-120px',
        left: '-80px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,195,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* App shell */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          height: '58px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(8,11,15,0.85)',
          backdropFilter: 'blur(20px)',
          flexShrink: 0,
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <Logo />

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '2px',
            background: 'var(--bg2)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
          }}>
            <Tab label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
            <Tab label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          </div>

          <StatusPill documents={documents} />
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
        }}>
          {activeTab === 'chat' ? (
            <ChatWindow
              messages={messages}
              isStreaming={isStreaming}
              onSend={send}
              onClear={handleClearChat}
            />
          ) : (
            <AdminPanel
              documents={documents}
              isLoading={isLoading}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onReload={reload}
            />
          )}
        </main>
      </div>

      <Notification note={notification} />
    </>
  )
}
