/**
 * hooks/useDocuments.js
 * Manages document upload, listing, deletion, and status polling.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDocuments, uploadDocument, deleteDocument, fetchDocumentStatus } from '../api/client'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState(null)
  const pollingRef = useRef({})

  // Load documents on mount
  useEffect(() => {
    loadDocuments()
    return () => {
      // Clear all polling on unmount
      Object.values(pollingRef.current).forEach(clearInterval)
    }
  }, [])

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {
      const docs = await fetchDocuments()
      setDocuments(docs)
      // Resume polling for any processing documents
      docs.filter(d => d.status === 'processing').forEach(doc => {
        startPolling(doc.id)
      })
    } catch (err) {
      setError('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const startPolling = useCallback((docId) => {
    if (pollingRef.current[docId]) return
    pollingRef.current[docId] = setInterval(async () => {
      try {
        const status = await fetchDocumentStatus(docId)
        if (status.status !== 'processing') {
          clearInterval(pollingRef.current[docId])
          delete pollingRef.current[docId]
          setDocuments(prev => prev.map(d =>
            d.id === docId
              ? { ...d, status: status.status, chunk_count: status.chunk_count, error_message: status.error_message }
              : d
          ))
        }
      } catch {}
    }, 2000)
  }, [])

  const upload = useCallback(async (file) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    try {
      const result = await uploadDocument(file, setUploadProgress)
      const newDoc = {
        id: result.id,
        original_name: file.name,
        file_type: file.type,
        chunk_count: 0,
        status: 'processing',
        created_at: new Date().toISOString(),
        error_message: null,
      }
      setDocuments(prev => [newDoc, ...prev])
      startPolling(result.id)
      return { success: true, name: file.name }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [startPolling])

  const remove = useCallback(async (docId) => {
    const doc = documents.find(d => d.id === docId)
    try {
      await deleteDocument(docId)
      clearInterval(pollingRef.current[docId])
      delete pollingRef.current[docId]
      setDocuments(prev => prev.filter(d => d.id !== docId))
      return { success: true, name: doc?.original_name }
    } catch (err) {
      setError('Failed to delete document')
      return { success: false }
    }
  }, [documents])

  return {
    documents,
    isLoading,
    isUploading,
    uploadProgress,
    error,
    upload,
    remove,
    reload: loadDocuments,
  }
}
