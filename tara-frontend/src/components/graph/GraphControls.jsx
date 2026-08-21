export function GraphControls({ riskFilter, onRiskFilterChange, onReset }) {
  const risks = ['ALL', 'HIGH', 'MEDIUM', 'LOW']
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-white border-b border-[#E8E5E0]">
      <span className="text-xs text-[#8A8580] uppercase tracking-wider font-medium">Risk Filter</span>
      <div className="flex gap-1.5 flex-wrap">
        {risks.map((r) => (
          <button
            key={r}
            onClick={() => onRiskFilterChange(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              riskFilter === r
                ? 'bg-[#171613] text-white shadow-sm'
                : 'bg-[#F0EEEA] text-[#6B6660] hover:bg-[#E8E5E0] hover:text-[#1B1A17]'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        onClick={onReset}
        className="ml-auto px-3 py-1.5 rounded-full text-xs font-medium text-[#6B6660] border border-[#E8E5E0] hover:text-[#1B1A17] hover:bg-[#F0EEEA] transition-colors"
      >
        Reset View
      </button>
    </div>
  )
}
