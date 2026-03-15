/**
 * api/client.js
 * All communication with the FastAPI backend lives here.
 * Using fetch for streaming (SSE) and axios for regular requests.
 */

import axios from 'axios'

const BASE = ''  // Empty string = use Vite proxy (same origin in dev)

// ── Axios instance for regular requests ──────────────────────────────────────
export const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
})

// ── Document endpoints ────────────────────────────────────────────────────────

export const uploadDocument = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/admin/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  })
  return response.data
}

export const fetchDocuments = async () => {
  const response = await api.get('/admin/documents')
  return response.data
}

export const deleteDocument = async (docId) => {
  const response = await api.delete(`/admin/documents/${docId}`)
  return response.data
}

export const fetchDocumentStatus = async (docId) => {
  const response = await api.get(`/admin/documents/${docId}/status`)
  return response.data
}

// ── Chat endpoints ────────────────────────────────────────────────────────────

/**
 * Send a message and stream the response.
 * Calls onToken for each streamed word, onDone when complete.
 *
 * @param {string} question
 * @param {string|null} sessionId
 * @param {function} onToken  - called with each token string
 * @param {function} onDone   - called with final sessionId when stream ends
 * @param {function} onError  - called with error message
 */
export const sendMessage = async (question, sessionId, onToken, onDone, onError) => {
  try {
    const response = await fetch('/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, session_id: sessionId }),
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let finalSessionId = sessionId

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.slice(6))

          if (data.session_id) finalSessionId = data.session_id
          if (data.token) onToken(data.token)
          if (data.done) onDone(finalSessionId)
          if (data.error) onError(data.error)
        } catch {
          // Ignore malformed lines
        }
      }
    }
  } catch (err) {
    onError(err.message || 'Connection failed')
  }
}

export const fetchHistory = async (sessionId) => {
  const response = await api.get(`/chat/history/${sessionId}`)
  return response.data
}

export const clearHistory = async (sessionId) => {
  const response = await api.delete(`/chat/history/${sessionId}`)
  return response.data
}
