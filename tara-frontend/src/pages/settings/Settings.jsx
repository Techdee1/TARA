import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useConnectionStore } from '@/store/connectionStore'
import { useAmountsStore } from '@/store/amountsStore'
import { resetMockGraph } from '@/mocks/identityMocks'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'data', label: 'Data Source' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'api', label: 'API Configuration' },
  { id: 'security', label: 'Security' },
]

export default function Settings() {
  const [active, setActive] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const mode = useConnectionStore((s) => s.mode)
  const queryClient = useQueryClient()

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleResetDemo = () => {
    resetMockGraph()
    useAmountsStore.persist.clearStorage()
    queryClient.invalidateQueries({ queryKey: ['graph'] })
    queryClient.invalidateQueries({ queryKey: ['verdict'] })
    setResetDone(true)
    setTimeout(() => setResetDone(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Platform configuration" />

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <div className="lg:w-48 shrink-0">
          <nav className="flex lg:flex-col gap-0.5 overflow-x-auto pb-1 lg:pb-0">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`shrink-0 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active === s.id
                    ? 'bg-[#171613] text-white'
                    : 'text-[#6B6660] hover:bg-[#F0EEEA] hover:text-[#1B1A17]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-[#E8E5E0] rounded-xl shadow-soft p-5 sm:p-6 min-w-0">
          {active === 'profile' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-sm font-semibold text-[#1B1A17] mb-4">Profile Settings</h3>
              <Input label="Full Name" defaultValue="Akeem Jr." />
              <Input label="Email" type="email" defaultValue="akeem@tara-demo.ng" />
              <Input label="Role" defaultValue="Trust & Safety Reviewer" />
              <Input label="Platform" defaultValue="TARA Demo Instance" />
            </div>
          )}

          {active === 'data' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-sm font-semibold text-[#1B1A17] mb-1">Data Source</h3>
              <p className="text-xs text-[#8A8580] mb-4">
                TARA falls back to realistic local demo data automatically if the live backend doesn't
                respond in time, so the product keeps working through a flaky connection.
              </p>

              <div className="p-4 bg-[#F0EEEA] rounded-lg flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${mode === 'demo' ? 'bg-amber-500' : 'bg-[#0D9488]'}`} />
                <div>
                  <p className="text-sm font-medium text-[#1B1A17]">
                    {mode === 'demo' ? 'Running on demo data' : 'Connected to live backend'}
                  </p>
                  <p className="text-xs text-[#6B6660] mt-0.5">
                    {mode === 'demo'
                      ? "The real TARA backend didn't answer in time this session."
                      : 'Every request is reaching the real TARA API.'}
                  </p>
                </div>
              </div>

              <div className="p-4 border border-[#E8E5E0] rounded-lg">
                <p className="text-sm font-medium text-[#1B1A17] mb-1">Reset demo graph</p>
                <p className="text-xs text-[#6B6660] mb-3">
                  Clears any identities verified live in demo mode and restores the original
                  24-identity loan-stacking demo dataset.
                </p>
                <Button variant="secondary" size="sm" onClick={handleResetDemo}>
                  {resetDone ? '✓ Reset' : 'Reset Demo Graph'}
                </Button>
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-sm font-semibold text-[#1B1A17] mb-4">Notification Preferences</h3>
              {[
                { label: 'Needs Review Verdicts', desc: 'Notify immediately when an identity is flagged Needs Review' },
                { label: 'New Ring Detected', desc: 'Notify when a new shared-attribute cluster crosses the review threshold' },
                { label: 'Verification Failures', desc: 'Notify when a QoreID verification comes back unverified' },
                { label: 'Daily Digest', desc: 'Daily summary of verification and detection activity' },
              ].map((item) => (
                <label key={item.label} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mt-0.5 accent-[#0D9488]" />
                  <div>
                    <p className="text-sm text-[#1B1A17]">{item.label}</p>
                    <p className="text-xs text-[#6B6660]">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {active === 'api' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-sm font-semibold text-[#1B1A17] mb-4">API Configuration</h3>
              <Input label="API Base URL" defaultValue="http://localhost:8000/api/v1" />
              <Input label="QoreID API Key" type="password" defaultValue="••••••••••••••••" />
            </div>
          )}

          {active === 'security' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-sm font-semibold text-[#1B1A17] mb-4">Security Settings</h3>
              <div className="p-4 bg-[#F0EEEA] border border-[#E8E5E0] rounded-lg">
                <p className="text-sm font-medium text-[#1B1A17] mb-1">Two-Factor Authentication</p>
                <p className="text-xs text-[#6B6660] mb-3">Add an extra layer of security to your account</p>
                <Button variant="secondary" size="sm">Enable 2FA</Button>
              </div>
              <div className="p-4 bg-[#F0EEEA] border border-[#E8E5E0] rounded-lg">
                <p className="text-sm font-medium text-[#1B1A17] mb-1">Session Management</p>
                <p className="text-xs text-[#6B6660] mb-3">Active sessions: 1 device</p>
                <Button variant="danger" size="sm">Revoke All Sessions</Button>
              </div>
              <Input label="Change Password" type="password" placeholder="New password" />
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#E8E5E0] flex items-center gap-3">
            <Button variant="primary" onClick={handleSave}>
              {saved ? '✓ Saved' : 'Save Changes'}
            </Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
