import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Sparkles, ChevronDown, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import { generateAgenticResponse, simulateTypingDelay } from './chatEngine'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
// ── Quick suggestion chips ────────────────────────────────────────────────────
const SUGGESTIONS = [
  { label: '💧 Water status', q: 'What is my water level and flow?' },
  { label: '🚨 Actions needed?', q: 'What type of actions could I do if there is anything not good?' },
  { label: '📊 System report', q: 'Give me a full system status report' },
  { label: '⚙️ Pump control', q: 'Is it a good time to run the pump?' },
]

// ── Welcome message ───────────────────────────────────────────────────────────
const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  text: "👋 Hi! I'm your **AquaWise AI Assistant**.\n\nI am connected to your live system data and can help you troubleshoot issues, monitor levels, or give you advice on system operations.\n\nJust ask me anything! 💡",
  time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [bubblePulse, setBubblePulse] = useState(true)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatBodyRef = useRef(null)

  // Store data
  const sensors = useStore(s => s.sensors)
  const aiResults = useStore(s => s.aiResults)
  const pumpOn = useStore(s => s.pumpOn)
  const alerts = useStore(s => s.alerts)
  const impact = useStore(s => s.impact)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setBubblePulse(false)
    }
  }, [isOpen])

  const handleSend = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setIsTyping(true)

    // Call the Agentic Engine (Gemini)
    try {
      // Pass the current messages to serve as history
      const responseText = await generateAgenticResponse(
        trimmed,
        nextMessages,
        sensors,
        aiResults,
        pumpOn,
        alerts,
        impact
      )

      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: responseText,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: '⚠️ **Error:** Failed to connect to the AI engine. Please ensure your API key is correctly set in the .env file.',
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setIsTyping(false)
    }
  }, [input, messages, sensors, aiResults, pumpOn, alerts, impact])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([WELCOME_MSG])
  }

  // ── Render markdown-lite ────────────────────────────────────────
  // Removed in favor of ReactMarkdown

  // Check if API key is configured in .env
  const isAgentActive = Boolean(import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'paste_your_key_here')

  return (
    <>
      {/* ── Floating Bubble ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'aquawise-chat-bubble',
          isOpen && 'aquawise-chat-bubble--open',
          bubblePulse && 'aquawise-chat-bubble--pulse'
        )}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        id="aquawise-chat-toggle"
      >
        <div className="aquawise-chat-bubble__inner">
          {isOpen ? (
            <X size={22} strokeWidth={2.2} />
          ) : (
            <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
              <defs>
                <linearGradient id="aqua-chat-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#c7d8ff" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M16 3 C12 9 6 13 6 19 C6 24.5 10.5 29 16 29 C21.5 29 26 24.5 26 19 C26 13 20 9 16 3Z"
                fill="url(#aqua-chat-grad)"
                opacity="0.95"
              />
              <path d="M16 10 L16 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              <path d="M16 10 L18.5 7.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <path d="M16 10 L13.5 7.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <path
                d="M10 21 Q13 18 16 21 Q19 24 22 21"
                stroke="rgba(79,125,243,0.5)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
        {!isOpen && bubblePulse && (
          <span className="aquawise-chat-bubble__dot" />
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={clsx(
          'aquawise-chat-panel',
          isOpen ? 'aquawise-chat-panel--open' : 'aquawise-chat-panel--closed'
        )}
        role="dialog"
        aria-label="AquaWise Assistant"
      >
        {/* Header */}
        <div className="aquawise-chat-header">
          <div className="aquawise-chat-header__left">
            <div className="aquawise-chat-header__avatar">
              <Sparkles size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="aquawise-chat-header__title">AquaWise AI</p>
              <p className="aquawise-chat-header__status">
                <span className={isAgentActive ? "aquawise-chat-header__dot-online" : "aquawise-chat-header__dot-offline"} />
                {isAgentActive ? 'Agent active' : 'Offline - Setup required'}
              </p>
            </div>
          </div>
          <div className="aquawise-chat-header__actions">
            <button onClick={clearChat} className="aquawise-chat-header__btn" aria-label="Clear chat" title="Clear conversation">
              <Trash2 size={14} strokeWidth={1.8} />
            </button>
            <button onClick={() => setIsOpen(false)} className="aquawise-chat-header__btn" aria-label="Close">
              <ChevronDown size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="aquawise-chat-body custom-scroll" ref={chatBodyRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                'aquawise-chat-msg',
                msg.role === 'user' ? 'aquawise-chat-msg--user' : 'aquawise-chat-msg--bot'
              )}
            >
              <div className={clsx(
                'aquawise-chat-msg__bubble',
                msg.role === 'user' ? 'aquawise-chat-msg__bubble--user' : 'aquawise-chat-msg__bubble--bot'
              )}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
              <span className="aquawise-chat-msg__time">{msg.time}</span>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="aquawise-chat-msg aquawise-chat-msg--bot">
              <div className="aquawise-chat-msg__bubble aquawise-chat-msg__bubble--bot aquawise-chat-typing">
                <span className="aquawise-chat-typing__dot" />
                <span className="aquawise-chat-typing__dot" />
                <span className="aquawise-chat-typing__dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

          {/* Suggestions */}
          {messages.length === 1 && !isTyping && (
            <div className="aquawise-chat-suggestions">
              {SUGGESTIONS.map(s => (
                <button
                  key={s.label}
                  className="aquawise-chat-suggestion"
                  onClick={() => handleSend(s.q)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="aquawise-chat-footer">
          <div className="aquawise-chat-input-wrap">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAgentActive ? "Ask the AI agent..." : "API key required in .env..."}
              className="aquawise-chat-input"
              disabled={isTyping}
              id="aquawise-chat-input"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="aquawise-chat-send"
              aria-label="Send message"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </div>
          <p className="aquawise-chat-footer__hint">
            Agentic AI mode \u00B7 {isAgentActive ? 'Secured & active' : 'Offline'}
          </p>
        </div>
      </div>
    </>
  )
}
