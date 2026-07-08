import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Droplet, ArrowRight, Lock, Mail } from 'lucide-react'

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'An error occurred')
        return
      }

      // Login successful
      if (onLoginSuccess) onLoginSuccess(data.email)
      navigate('/overview')
    } catch (err) {
      setError('Could not connect to the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-surface-bg)]">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#26BDE2] rounded-full blur-[120px] opacity-20 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3F7E44] rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-md p-8 sm:p-10 card shadow-2xl border border-[var(--color-surface-border)] backdrop-blur-xl bg-[var(--color-surface-card)]/90 z-10 mx-4">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#26BDE2] to-[#0a7591] flex items-center justify-center shadow-lg shadow-[#26BDE2]/30 transform hover:rotate-12 transition-transform duration-300">
            <Droplet className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 text-gradient">
          AquaWise
        </h1>
        <p className="text-center text-sm mb-8 text-theme-muted">
          Sign in to access your dashboard
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-theme-muted">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-faint group-focus-within:text-[#26BDE2] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--color-surface-dynamic)] border border-[var(--color-surface-border)] rounded-xl py-3 pl-12 pr-4 text-[var(--color-text)] focus:outline-none focus:border-[#26BDE2] focus:ring-1 focus:ring-[#26BDE2]/50 transition-all placeholder:text-theme-faint"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-theme-muted">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-faint group-focus-within:text-[#26BDE2] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--color-surface-dynamic)] border border-[var(--color-surface-border)] rounded-xl py-3 pl-12 pr-4 text-[var(--color-text)] focus:outline-none focus:border-[#26BDE2] focus:ring-1 focus:ring-[#26BDE2]/50 transition-all placeholder:text-theme-faint"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="group mt-4 w-full flex items-center justify-center gap-2 bg-[#26BDE2] hover:bg-[#1da3c6] text-white py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed glow-primary"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-theme-muted">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-[#26BDE2] font-medium hover:underline underline-offset-4 transition-all">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}