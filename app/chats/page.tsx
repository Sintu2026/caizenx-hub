'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase, ChatSubject, ChatMessage } from '@/lib/supabase'

const SUBJECT_COLORS = [
  { bg: 'from-blue-900/50 to-blue-800/30', border: 'border-blue-700/50', text: 'text-blue-400', dot: 'bg-blue-500' },
  { bg: 'from-purple-900/50 to-purple-800/30', border: 'border-purple-700/50', text: 'text-purple-400', dot: 'bg-purple-500' },
  { bg: 'from-amber-900/50 to-amber-800/30', border: 'border-amber-700/50', text: 'text-amber-400', dot: 'bg-amber-500' },
  { bg: 'from-green-900/50 to-green-800/30', border: 'border-green-700/50', text: 'text-green-400', dot: 'bg-green-500' },
  { bg: 'from-red-900/50 to-red-800/30', border: 'border-red-700/50', text: 'text-red-400', dot: 'bg-red-500' },
  { bg: 'from-cyan-900/50 to-cyan-800/30', border: 'border-cyan-700/50', text: 'text-cyan-400', dot: 'bg-cyan-500' },
  { bg: 'from-pink-900/50 to-pink-800/30', border: 'border-pink-700/50', text: 'text-pink-400', dot: 'bg-pink-500' },
  { bg: 'from-indigo-900/50 to-indigo-800/30', border: 'border-indigo-700/50', text: 'text-indigo-400', dot: 'bg-indigo-500' },
]

function getColorForIndex(index: number) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length]
}

export default function ChatsPage() {
  const [userEmail, setUserEmail] = useState('')
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [subjects, setSubjects] = useState<ChatSubject[]>([])
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectDesc, setNewSubjectDesc] = useState('')
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSubject = subjects.find(s => s.id === activeSubjectId)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load subjects when signed in
  useEffect(() => {
    if (isSignedIn) {
      loadSubjects()
    }
  }, [isSignedIn])

  // Load messages when subject changes
  useEffect(() => {
    if (activeSubjectId) {
      loadMessages(activeSubjectId)
    }
  }, [activeSubjectId])

  const handleSignIn = () => {
    if (!userEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email' })
      return
    }
    if (!senderName.trim()) {
      setSenderName(userEmail.split('@')[0])
    }
    setIsSignedIn(true)
    setMessage({ type: '', text: '' })
  }

  const loadSubjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('chat_subjects')
        .select('*')
        .eq('user_email', userEmail)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      setSubjects(data || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load subjects' })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (subjectId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to load messages' })
    }
  }

  const createSubject = async () => {
    if (!newSubjectName.trim()) {
      setMessage({ type: 'error', text: 'Subject name is required' })
      return
    }

    try {
      const { data, error } = await supabase
        .from('chat_subjects')
        .insert([{
          name: newSubjectName.trim(),
          description: newSubjectDesc.trim() || null,
          user_email: userEmail,
          message_count: 0,
          last_message_at: new Date().toISOString(),
        }])
        .select()

      if (error) throw error

      if (data && data[0]) {
        setSubjects([data[0], ...subjects])
        setActiveSubjectId(data[0].id!)
        setMessages([])
        setShowMobileSidebar(false)
      }
      setNewSubjectName('')
      setNewSubjectDesc('')
      setShowNewSubject(false)
      setMessage({ type: 'success', text: 'Subject created' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create subject' })
    }
  }

  const deleteSubject = async (id: string) => {
    try {
      // Delete all messages in the subject first
      await supabase.from('chat_messages').delete().eq('subject_id', id)
      const { error } = await supabase.from('chat_subjects').delete().eq('id', id)
      if (error) throw error

      setSubjects(subjects.filter(s => s.id !== id))
      if (activeSubjectId === id) {
        setActiveSubjectId(null)
        setMessages([])
      }
      setMessage({ type: 'success', text: 'Subject deleted' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete subject' })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeSubjectId) return

    setSendingMessage(true)
    try {
      const msgData: ChatMessage = {
        subject_id: activeSubjectId,
        user_email: userEmail,
        content: newMessage.trim(),
        sender_name: senderName || userEmail.split('@')[0],
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([msgData])
        .select()

      if (error) throw error

      if (data && data[0]) {
        setMessages([...messages, data[0]])
      }

      // Update subject metadata
      await supabase
        .from('chat_subjects')
        .update({
          message_count: (activeSubject?.message_count || 0) + 1,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', activeSubjectId)

      // Update local subject state
      setSubjects(subjects.map(s =>
        s.id === activeSubjectId
          ? { ...s, message_count: (s.message_count || 0) + 1, last_message_at: new Date().toISOString() }
          : s
      ))

      setNewMessage('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send message' })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: 'short' })
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Sign-in screen
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md border border-gray-700">
          <h1 className="text-2xl font-bold mb-2">Chats</h1>
          <p className="text-gray-400 text-sm mb-6">Enter your email to access your chats organized by subject.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Display Name (optional)</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Your name"
              />
            </div>
            {message.text && (
              <div className={`px-4 py-2 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                {message.text}
              </div>
            )}
            <button
              onClick={handleSignIn}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              Enter Chats
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col">
      {/* Notification */}
      {message.text && (
        <div className={`px-4 py-2 text-sm ${message.type === 'error' ? 'bg-red-900/70 text-red-200' : 'bg-green-900/70 text-green-200'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="text-gray-300 hover:text-white ml-4">
              x
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="md:hidden fixed bottom-4 left-4 z-30 bg-blue-600 hover:bg-blue-700 rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Subject Sidebar */}
        <aside className={`${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-20 w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full transition-transform duration-200`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Subjects</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{userEmail}</span>
                <button
                  onClick={() => { setIsSignedIn(false); setSubjects([]); setMessages([]); setActiveSubjectId(null) }}
                  className="text-xs text-gray-500 hover:text-gray-300 transition"
                >
                  Sign out
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowNewSubject(!showNewSubject)}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
            >
              + New Subject
            </button>
          </div>

          {/* New Subject Form */}
          {showNewSubject && (
            <div className="p-4 border-b border-gray-700 bg-gray-750">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-500"
                placeholder="Subject name"
                onKeyDown={(e) => e.key === 'Enter' && createSubject()}
              />
              <input
                type="text"
                value={newSubjectDesc}
                onChange={(e) => setNewSubjectDesc(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-500"
                placeholder="Description (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowNewSubject(false); setNewSubjectName(''); setNewSubjectDesc('') }}
                  className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  onClick={createSubject}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Subject List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-gray-500 text-sm">No subjects yet.</p>
                <p className="text-gray-600 text-xs mt-1">Create a subject to start chatting.</p>
              </div>
            ) : (
              subjects.map((subject, index) => {
                const color = getColorForIndex(index)
                const isActive = subject.id === activeSubjectId
                return (
                  <div
                    key={subject.id}
                    className={`group flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-700/50 transition ${
                      isActive ? 'bg-gray-700/70' : 'hover:bg-gray-700/40'
                    }`}
                    onClick={() => { setActiveSubjectId(subject.id!); setShowMobileSidebar(false) }}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${color.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
                          {subject.name}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {subject.last_message_at ? formatTime(subject.last_message_at) : ''}
                        </span>
                      </div>
                      {subject.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{subject.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-600">
                          {subject.message_count || 0} message{(subject.message_count || 0) !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id!) }}
                          className="text-xs text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeSubject ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3 border-b border-gray-700 bg-gray-800/50 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getColorForIndex(subjects.indexOf(activeSubject)).dot}`} />
                <div>
                  <h2 className="font-semibold text-sm">{activeSubject.name}</h2>
                  {activeSubject.description && (
                    <p className="text-xs text-gray-500">{activeSubject.description}</p>
                  )}
                </div>
                <span className="ml-auto text-xs text-gray-600">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-500">No messages yet in this subject.</p>
                      <p className="text-gray-600 text-sm mt-1">Start the conversation below.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.user_email === userEmail
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                          isOwn
                            ? 'bg-blue-600 rounded-br-sm'
                            : 'bg-gray-700 rounded-bl-sm'
                        }`}>
                          {!isOwn && (
                            <p className="text-xs text-gray-400 mb-1 font-medium">{msg.sender_name || msg.user_email}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                            {msg.created_at ? formatTime(msg.created_at) : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                <div className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition"
                  >
                    {sendingMessage ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No Subject Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-20">
                  <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-400">Select a subject</h3>
                <p className="text-sm text-gray-600 mt-1">Choose a subject from the sidebar or create a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
