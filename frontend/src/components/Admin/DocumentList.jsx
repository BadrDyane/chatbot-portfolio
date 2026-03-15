/**
 * components/Admin/DocumentList.jsx
 * Shows all uploaded documents with status and delete button.
 */

const FileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    <style>{`svg { animation: spin 1s linear infinite; }`}</style>
  </svg>
)

const STATUS_CONFIG = {
  ready:      { color: '#00e5c3', bg: 'rgba(0,229,195,0.1)',  label: 'Ready' },
  processing: { color: '#ffa502', bg: 'rgba(255,165,2,0.1)',  label: 'Processing' },
  error:      { color: '#ff4757', bg: 'rgba(255,71,87,0.1)',  label: 'Error' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.processing
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 9px',
      borderRadius: '20px',
      fontSize: '0.71rem',
      fontWeight: 600,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: cfg.bg,
      color: cfg.color,
      flexShrink: 0,
    }}>
      {status === 'processing' && <SpinnerIcon />}
      {cfg.label}
    </span>
  )
}

export default function DocumentList({ documents, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)', fontSize: '0.87rem' }}>
        Loading documents...
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '36px 24px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-3)',
        fontSize: '0.87rem',
      }}>
        No documents uploaded yet. Upload your first document above.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {documents.map(doc => (
        <div
          key={doc.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: '8px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-2)',
              flexShrink: 0,
            }}>
              <FileIcon />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '0.88rem',
                fontWeight: 500,
                color: 'var(--text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '2px',
              }}>
                {doc.original_name}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {doc.chunk_count > 0 ? `${doc.chunk_count} chunks` : '—'}
                {' · '}
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
              {doc.status === 'error' && doc.error_message && (
                <p style={{ fontSize: '0.73rem', color: 'var(--danger)', marginTop: '2px' }}>
                  {doc.error_message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <StatusBadge status={doc.status} />
            <button
              onClick={() => onDelete(doc.id)}
              disabled={doc.status === 'processing'}
              style={{
                width: '30px', height: '30px',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-3)',
                cursor: doc.status === 'processing' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                opacity: doc.status === 'processing' ? 0.4 : 1,
              }}
              onMouseEnter={e => {
                if (doc.status !== 'processing') {
                  e.currentTarget.style.background = 'var(--danger-glow)'
                  e.currentTarget.style.borderColor = 'var(--danger)'
                  e.currentTarget.style.color = 'var(--danger)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-3)'
              }}
              title="Delete document"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
