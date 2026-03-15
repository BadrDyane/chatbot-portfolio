/**
 * hooks/useChat.js
 * Manages all chat state: messages, streaming, session.
 */

import { useState, useCallback, useRef } from 'react'
import { sendMessage } from '../api/client'

const SESSION_KEY = 'supportai_session_id'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || null
  )
  const streamingIndexRef = useRef(null)

  const addMessage = useCallback((role, content) => {
    const msg = { id: Date.now() + Math.random(), role, content, ts: new Date() }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const send = useCallback(async (question) => {
    if (isStreaming || !question.trim()) return

    // Add user message
    addMessage('user', question)

    // Add empty assistant placeholder
    const placeholderId = Date.now() + Math.random()
    streamingIndexRef.current = placeholderId
    setMessages(prev => [...prev, {
      id: placeholderId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      ts: new Date(),
    }])

    setIsStreaming(true)

    await sendMessage(
      question,
      sessionId,
      // onToken
      (token) => {
        setMessages(prev => prev.map(m =>
          m.id === placeholderId
            ? { ...m, content: m.content + token }
            : m
        ))
      },
      // onDone
      (finalSessionId) => {
        setMessages(prev => prev.map(m =>
          m.id === placeholderId
            ? { ...m, isStreaming: false }
            : m
        ))
        setIsStreaming(false)
        setSessionId(finalSessionId)
        sessionStorage.setItem(SESSION_KEY, finalSessionId)
      },
      // onError
      (errMsg) => {
        setMessages(prev => prev.map(m =>
          m.id === placeholderId
            ? { ...m, content: 'Sorry, something went wrong. Please try again.', isStreaming: false }
            : m
        ))
        setIsStreaming(false)
      }
    )
  }, [isStreaming, sessionId, addMessage])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return { messages, isStreaming, sessionId, send, clearChat }
}
