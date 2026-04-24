import { ROLES, ROLE_COLORS } from '../../lib/agentRoles'
import type { Role } from '../../lib/agentRoles'
import { emptyRoleFilter, type RoleFilter } from '../../lib/analysisUtils'

export default function RoleFilterBar({ filter, onChange, label = 'Role Composition' }: { filter: RoleFilter; onChange: (f: RoleFilter) => void; label?: string }) {
  const adjust = (role: Role, delta: number) => {
    const next = { ...filter, [role]: Math.max(0, filter[role] + delta) }
    if (Object.values(next).reduce((a, b) => a + b, 0) > 5) return
    onChange(next)
  }
  const isActive = ROLES.some(r => filter[r] > 0)

  return (
    <div className="bg-vct-800 border border-white/10 rounded-lg p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        {isActive && (
          <button onClick={() => onChange(emptyRoleFilter())} className="text-xs text-gray-400 hover:text-white transition-colors">Clear</button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {ROLES.map(role => (
          <div key={role} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${ROLE_COLORS[role]}`}>
            <span className="text-xs font-semibold">{role}</span>
            <button onClick={() => adjust(role, -1)} className="text-xs w-4 text-center opacity-60 hover:opacity-100">-</button>
            <span className="text-sm font-bold w-3 text-center">{filter[role]}</span>
            <button onClick={() => adjust(role, +1)} className="text-xs w-4 text-center opacity-60 hover:opacity-100">+</button>
          </div>
        ))}
      </div>
      {isActive && (
        <p className="text-xs text-gray-400 mt-3">
          Showing comps with at least: {ROLES.filter(r => filter[r] > 0).map(r => `${filter[r]} ${r}`).join(', ')}
        </p>
      )}
    </div>
  )
}
