/**
 * components/Admin/AdminPanel.jsx
 * The admin dashboard for managing knowledge base documents.
 */

import UploadZone from './UploadZone'
import DocumentList from './DocumentList'

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)

export default function AdminPanel({ documents, isLoading, isUploading, uploadProgress, onUpload, onDelete, onReload }) {
  const readyCount = documents.filter(d => d.status === 'ready').length
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0)

  return (
    <div style={{
      flex: 1,
      maxWidth: '700px',
      width: '100%',
      margin: '0 auto',
      padding: '36px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      overflowY: 'auto',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            marginBottom: '6px',
          }}>
            Knowledge Base
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.87rem' }}>
            Upload documents to train the chatbot. Supported: PDF, TXT, Markdown.
          </p>
        </div>
        <button
          onClick={onReload}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'transparent',
            color: 'var(--text-2)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border2)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {[
          { label: 'Documents', value: documents.length },
          { label: 'Ready', value: readyCount },
          { label: 'Total Chunks', value: totalChunks },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1,
            padding: '16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4rem',
              fontWeight: 500,
              color: 'var(--accent)',
              marginBottom: '4px',
            }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div>
        <h3 style={{ fontSize: '0.82rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
          Upload New Document
        </h3>
        <UploadZone onUpload={onUpload} isUploading={isUploading} progress={uploadProgress} />
      </div>

      {/* Document list */}
      <div>
        <h3 style={{ fontSize: '0.82rem', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
          Uploaded Documents
        </h3>
        <DocumentList documents={documents} onDelete={onDelete} isLoading={isLoading} />
      </div>
    </div>
  )
}
