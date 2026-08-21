import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1B1A17]">TA<span className="text-[#0D9488]">RA</span></h1>
        <p className="text-sm text-[#6B6660] mt-1">Identity network trust, on top of QoreID verification.</p>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E8E5E0] rounded-xl p-8">
        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#0D9488] text-xl">✓</span>
            </div>
            <h2 className="text-base font-semibold text-[#1B1A17] mb-2">Check your email</h2>
            <p className="text-sm text-[#6B6660] mb-6">Reset instructions sent to {email}</p>
            <Link to="/login" className="text-sm text-[#0D9488] hover:underline">Back to login</Link>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-[#1B1A17] mb-2">Reset password</h2>
            <p className="text-sm text-[#6B6660] mb-6">Enter your email to receive reset instructions.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email Address" type="email" placeholder="you@platform.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">Send Reset Link</Button>
            </form>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-xs text-[#6B6660] hover:text-[#0D9488] transition-colors">← Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
