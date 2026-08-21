import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#F5F4F1] flex items-center justify-center">
      <div className="text-center">
        <p className="text-8xl font-bold font-mono text-[#E8E5E0] mb-4">404</p>
        <h1 className="text-xl font-semibold text-[#1B1A17] mb-2">Page not found</h1>
        <p className="text-sm text-[#6B6660] mb-8">The route you requested does not exist.</p>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
