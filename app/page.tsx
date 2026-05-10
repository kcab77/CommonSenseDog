'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const FREE_LIMIT = 20
const COUNT_KEY = 'csd_question_count'
const PROFILE_KEY = 'csd_dog_profile'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface DogProfile {
  dog_name: string
  breed: string
  age: string
  diet: string
  health_issues: string
}

const WELCOME = `Hi! I'm your Common Sense Dog AI — a holistic, nutrition-first advisor for dog owners who want real, research-backed answers.

I can help you with:
🥩 Diet & nutrition — raw, gently cooked, freeze-dried, whole food
🌿 Natural remedies — allergies, skin issues, digestion, joint health
🐛 Flea & tick prevention — without harsh chemicals
🦷 Dental health — natural methods that actually work
💊 Supplements — fish oil, mushrooms, probiotics, goat milk & more

Save your dog's profile above and every answer will be tailored specifically to them. What's on your mind?`

const PROFILE_FIELDS: { key: keyof DogProfile; label: string; placeholder: string }[] = [
  { key: 'dog_name', label: "Dog's name", placeholder: 'e.g. Hershey' },
  { key: 'breed', label: 'Breed', placeholder: 'e.g. Chocolate Lab' },
  { key: 'age', label: 'Age', placeholder: 'e.g. 7 years' },
  { key: 'diet', label: 'Current diet', placeholder: 'e.g. Kibble, raw, gently cooked...' },
  { key: 'health_issues', label: 'Health issues or concerns', placeholder: 'e.g. Lipomas, allergies, joint stiffness...' },
]

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null)
  const [profileForm, setProfileForm] = useState<DogProfile>({
    dog_name: '', breed: '', age: '', diet: '', health_issues: '',
  })
  const [user, setUser] = useState<any>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authSent, setAuthSent] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const count = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10)
    setQuestionCount(count)

    const saved = localStorage.getItem(PROFILE_KEY)
    if (saved) {
      try {
        const p = JSON.parse(saved)
        setDogProfile(p)
        setProfileForm(p)
      } catch {}
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfileFromDB(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfileFromDB(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadProfileFromDB = async (userId: string) => {
    const { data } = await supabase
      .from('dog_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (data) {
      const p: DogProfile = {
        dog_name: data.dog_name || '',
        breed: data.breed || '',
        age: data.age || '',
        diet: data.diet || '',
        health_issues: data.health_issues || '',
      }
      setDogProfile(p)
      setProfileForm(p)
      localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
    }
  }

  const saveProfile = async () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileForm))
    setDogProfile({ ...profileForm })
    if (user) {
      await supabase.from('dog_profiles').upsert(
        { user_id: user.id, ...profileForm, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }
    setShowProfile(false)
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    if (!user && questionCount >= FREE_LIMIT) {
      setShowAuth(true)
      return
    }

    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoading(true)

    const newCount = questionCount + 1
    setQuestionCount(newCount)
    localStorage.setItem(COUNT_KEY, String(newCount))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, content: m.content })),
          dogProfile,
        }),
      })

      const data = await res.json()
      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Something went wrong — please try again.',
      }
      setMessages(prev => [...prev, assistantMsg])

      if (user) {
        await supabase.from('chat_messages').insert([
          { user_id: user.id, session_id: sessionId, role: 'user', content: userMsg.content },
          { user_id: user.id, session_id: sessionId, role: 'assistant', content: assistantMsg.content },
        ])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong — please try again.',
      }])
    } finally {
      setLoading(false)
      if (!user && newCount >= FREE_LIMIT) {
        setTimeout(() => setShowAuth(true), 800)
      }
    }
  }

  const sendMagicLink = async () => {
    if (!authEmail.trim()) return
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setAuthLoading(false)
    if (!error) setAuthSent(true)
  }

  const questionsLeft = Math.max(0, FREE_LIMIT - questionCount)
  const isNearLimit = !user && questionsLeft <= 5

  return (
    <div style={{ background: '#0a0a14', minHeight: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#f9fafb' }}>

      {/* Header */}
      <header style={{ background: '#0f1623', borderBottom: '1px solid #1f2937', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🐾</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f9fafb', lineHeight: 1.2 }}>Common Sense Dog AI</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Holistic · Nutrition-First · Whole Food</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {dogProfile?.dog_name && (
            <span style={{ fontSize: 12, color: '#22c55e', background: '#052e16', padding: '3px 10px', borderRadius: 20, border: '1px solid #14532d' }}>
              🐕 {dogProfile.dog_name}
            </span>
          )}
          <button
            onClick={() => setShowProfile(true)}
            style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '6px 12px', color: '#d1d5db', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {dogProfile?.dog_name ? 'Edit Profile' : '🐾 My Dog'}
          </button>
          {user ? (
            <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>
              Sign out
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12, cursor: 'pointer' }}>
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              marginBottom: 20,
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#052e16', border: '1px solid #14532d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 16 }}>🐾</span>
              </div>
            )}
            <div
              style={{
                maxWidth: '78%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                background: msg.role === 'user' ? '#22c55e' : '#111827',
                color: msg.role === 'user' ? '#000' : '#e5e7eb',
                fontSize: 15,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                border: msg.role === 'assistant' ? '1px solid #1f2937' : 'none',
                fontWeight: msg.role === 'user' ? 500 : 400,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#052e16', border: '1px solid #14532d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16 }}>🐾</span>
            </div>
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '4px 18px 18px 18px', padding: '14px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
              <div className="dot-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <div className="dot-2" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <div className="dot-3" style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input bar */}
      <div style={{ background: '#0f1623', borderTop: '1px solid #1f2937', padding: '12px 16px 16px' }}>
        {!user && (
          <div style={{ textAlign: 'center', fontSize: 12, color: isNearLimit ? '#f59e0b' : '#4b5563', marginBottom: 10 }}>
            {questionsLeft > 0
              ? `${questionsLeft} free question${questionsLeft === 1 ? '' : 's'} remaining · Sign in for unlimited`
              : 'Free limit reached — sign in for unlimited questions'}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, maxWidth: 760, margin: '0 auto', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 140) + 'px'
            }}
            placeholder={dogProfile?.dog_name ? `Ask about ${dogProfile.dog_name}...` : "Ask about your dog's health, diet, or wellness..."}
            rows={1}
            style={{
              flex: 1,
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: 14,
              padding: '12px 16px',
              color: '#f9fafb',
              fontSize: 15,
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              maxHeight: 140,
              overflowY: 'auto',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#374151' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#1f2937' : '#22c55e',
              border: 'none',
              borderRadius: 14,
              width: 46,
              height: 46,
              color: loading || !input.trim() ? '#6b7280' : '#000',
              fontSize: 20,
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontWeight: 700,
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#374151', marginTop: 8 }}>
          Not a substitute for veterinary care · commonsensedog.com
        </div>
      </div>

      {/* Dog Profile Modal */}
      {showProfile && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowProfile(false) }}
        >
          <div style={{ background: '#111827', borderRadius: 18, padding: 28, width: '100%', maxWidth: 440, border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🐾 Your Dog's Profile</h2>
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20, marginTop: 4 }}>
              Every answer will be tailored to your dog once you save their profile.
            </p>
            {PROFILE_FIELDS.map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={profileForm[field.key]}
                  onChange={e => setProfileForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: 10, padding: '10px 14px', color: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <button
              onClick={saveProfile}
              style={{ width: '100%', background: '#22c55e', border: 'none', borderRadius: 12, padding: '13px', color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 6 }}
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuth(false) }}
        >
          <div style={{ background: '#111827', borderRadius: 18, padding: 36, width: '100%', maxWidth: 420, border: '1px solid #1f2937', textAlign: 'center' }}>
            {!authSent ? (
              <>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🐾</div>
                <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700 }}>
                  {questionCount >= FREE_LIMIT ? `You've used your ${FREE_LIMIT} free questions!` : 'Create a free account'}
                </h2>
                <p style={{ color: '#9ca3af', marginBottom: 28, fontSize: 15, lineHeight: 1.6 }}>
                  Sign in to get unlimited questions, save your chat history, and sync your dog's profile across devices.<br />
                  <strong style={{ color: '#22c55e' }}>Free forever.</strong>
                </p>
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
                  placeholder="your@email.com"
                  autoFocus
                  style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: '13px 16px', color: '#f9fafb', fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
                />
                <button
                  onClick={sendMagicLink}
                  disabled={authLoading || !authEmail.trim()}
                  style={{ width: '100%', background: authLoading || !authEmail.trim() ? '#1f2937' : '#22c55e', border: 'none', borderRadius: 12, padding: '13px', color: authLoading || !authEmail.trim() ? '#6b7280' : '#000', fontWeight: 700, fontSize: 15, cursor: authLoading ? 'default' : 'pointer', marginBottom: 10 }}
                >
                  {authLoading ? 'Sending...' : 'Continue with Email →'}
                </button>
                <p style={{ color: '#4b5563', fontSize: 12 }}>We'll send a magic link — no password needed.</p>
                {questionCount < FREE_LIMIT && (
                  <button onClick={() => setShowAuth(false)} style={{ marginTop: 8, background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                    Not now ({questionsLeft} question{questionsLeft === 1 ? '' : 's'} left)
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={{ fontSize: 52, marginBottom: 14 }}>📬</div>
                <h2 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700 }}>Check your inbox</h2>
                <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.6 }}>
                  We sent a magic link to<br />
                  <strong style={{ color: '#f9fafb' }}>{authEmail}</strong>.<br /><br />
                  Click it to sign in and keep chatting.
                </p>
                <button
                  onClick={() => { setShowAuth(false); setAuthSent(false) }}
                  style={{ marginTop: 24, background: '#1f2937', border: '1px solid #374151', borderRadius: 12, padding: '12px 28px', color: '#f9fafb', fontSize: 14, cursor: 'pointer' }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
