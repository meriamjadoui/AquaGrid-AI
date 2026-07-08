import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      navigate('/login')
    } catch (err) {
      setError('Impossible de contacter le serveur')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.6rem', marginBottom: '1rem',
    borderRadius: '0.5rem', border: '1px solid #2a3441',
    background: '#0c1015', color: '#e2e8f0'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0c1015'
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#131920', padding: '2.5rem', borderRadius: '0.75rem',
        width: '100%', maxWidth: '380px', color: '#e2e8f0'
      }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Créer un compte
        </h1>

        {error && (
          <div style={{
            background: '#3f1d1d', color: '#fca5a5', padding: '0.75rem',
            borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Prénom</label>
        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={inputStyle} />

        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nom</label>
        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={inputStyle} />

        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />

        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ ...inputStyle, marginBottom: '1.5rem' }} />

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '0.7rem', borderRadius: '0.5rem',
          border: 'none', background: '#26BDE2', color: '#fff',
          fontWeight: 600, cursor: 'pointer'
        }}>
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          Déjà un compte ? <Link to="/login" style={{ color: '#26BDE2' }}>Se connecter</Link>
        </p>
      </form>
    </div>
  )
}