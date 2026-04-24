export default function AgentPill({ agent, active, onClick }: { agent: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        active
          ? 'bg-vct-700 text-white'
          : 'bg-vct-800 border border-white/10 text-gray-300 hover:border-white/40'
      }`}
    >
      {agent}
    </button>
  )
}
