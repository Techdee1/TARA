import { useState, useEffect } from 'react'

export function STREditor({ content, onChange, readOnly = false }) {
  const [value, setValue] = useState(content ?? '')

  // Sync when content prop changes (e.g. after data loads)
  useEffect(() => {
    setValue(content ?? '')
  }, [content])

  const handleChange = (e) => {
    setValue(e.target.value)
    onChange?.(e.target.value)
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E8E5E0] rounded-lg overflow-hidden h-full flex flex-col">
      <div className="px-4 py-2 bg-[#F0EEEA] border-b border-[#E8E5E0] flex items-center justify-between shrink-0">
        <span className="text-xs text-[#8A8580] uppercase tracking-wider">STR Draft</span>
        {readOnly
          ? <span className="text-[10px] text-[#8A8580]">Read-only</span>
          : <span className="text-[10px] text-[#0D9488]">Editable</span>
        }
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        rows={24}
        className="flex-1 w-full bg-transparent p-4 text-sm text-[#1B1A17] font-mono resize-none focus:outline-none leading-relaxed"
        style={{ minHeight: '480px' }}
        placeholder={readOnly ? '' : 'STR content will appear here after generation…'}
      />
    </div>
  )
}
