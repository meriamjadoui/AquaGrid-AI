import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Droplet, ArrowRight, Lock, Mail, User, Briefcase } from 'lucide-react'

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('operator')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password, role })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'An error occurred')
        return
      }

      navigate('/login')
    } catch (err) {
      setError('Could not connect to the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-surface-bg)]">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#26BDE2] rounded-full blur-[120px] opacity-20 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3F7E44] rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-md p-8 sm:p-10 card shadow-2xl border border-[var(--color-surface-border)] backdrop-blur-xl bg-[var(--color-surface-card)]/90 z-10 mx-4">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#26BDE2] to-[#0a7591] flex items-center justify-center shadow-lg shadow-[#26BDE2]/30 transform hover:-rotate-12 transition-transform duration-300">
            <Droplet className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 text-gradient">
          Join AquaWise
        </h1>
        <p className="text-center text-sm mb-8 text-theme-muted">
          Create your account in seconds
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-theme-muted">First Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-faint group-focus-within:text-[#26BDE2] transition-colors" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-[var(--color-surface-dynamic)] border border-[var(--color-surface-border)] rounded-xl py-2.5 pl-9 pr-3 text-[var(--color-text)] focus:outline-none focus:border-[#26BDE2] focus:ring-1 focus:ring-[#26BDE2]/50 transition-all placeholder:text-theme-faint text-sm"
                  placeholder="John"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-theme-muted">Last Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-faint group-focus-within:text-[#26BDE2] transition-colors" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-[var(--color-surface-dynamic)] border border-[var(--color-surface-border)] rounded-xl py-2.5 pl-9 pr-3 text-[var(--color-text)] focus:outline-none focus:border-[#26BDE2] focus:ring-1 focus:ring-[#26BDE2]/50 transition-all placeholder:text-theme-faint text-sm"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

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
            <label className="block text-sm font-medium mb-2 text-theme-muted">User Role</label>
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-faint group-focus-within:text-[#26BDE2] transition-colors" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[var(--color-surface-dynamic)] border border-[var(--color-surface-border)] rounded-xl py-3 pl-12 pr-10 text-[var(--color-text)] focus:outline-none focus:border-[#26BDE2] focus:ring-1 focus:ring-[#26BDE2]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="operator">System Operator / Technician</option>
                <option value="maintenance">Maintenance / Field Engineer</option>
                <option value="manager">Facility Manager / Admin</option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-theme-faint">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.41 0.589966L6 5.16997L10.59 0.589966L12 1.99997L6 7.99997L0 1.99997L1.41 0.589966Z" fill="currentColor"/>
                </svg>
              </div>
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
                minLength={6}
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
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-theme-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-[#26BDE2] font-medium hover:underline underline-offset-4 transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}