/**
 * components/Admin/UploadZone.jsx
 * Drag-and-drop + click-to-upload file zone.
 */

import { useState, useRef } from 'react'

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

export default function UploadZone({ onUpload, isUploading, progress }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }

  const s = {
    zone: {
      border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '40px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      cursor: isUploading ? 'not-allowed' : 'pointer',
      transition: 'all 0.25s',
      background: dragging ? 'var(--accent-glow2)' : 'transparent',
      color: dragging ? 'var(--accent)' : 'var(--text-2)',
      position: 'relative',
      overflow: 'hidden',
    },
  }

  return (
    <div
      style={s.zone}
      onDragOver={e => { e.preventDefault(); if (!isUploading) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && inputRef.current?.click()}
      onMouseEnter={e => {
        if (!isUploading && !dragging) {
          e.currentTarget.style.borderColor = 'var(--accent)'
          e.currentTarget.style.color = 'var(--accent)'
          e.currentTarget.style.background = 'var(--accent-glow2)'
        }
      }}
      onMouseLeave={e => {
        if (!dragging) {
          e.currentTarget.style.borderColor = 'var(--border2)'
          e.currentTarget.style.color = 'var(--text-2)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onUpload(e.target.files[0])}
      />

      {/* Upload progress bar */}
      {isUploading && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          height: '3px',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--accent), #0099ff)',
          transition: 'width 0.3s ease',
        }} />
      )}

      <div style={{
        width: '48px', height: '48px',
        borderRadius: '14px',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <UploadIcon />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px', color: 'inherit' }}>
          {isUploading ? `Uploading... ${progress}%` : 'Drop a file here or click to browse'}
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
          Supports PDF, TXT, and Markdown — max 20MB
        </p>
      </div>
    </div>
  )
}
