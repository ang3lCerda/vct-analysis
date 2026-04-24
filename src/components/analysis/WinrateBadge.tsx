export default function WinrateBadge({ value }: { value: number }) {
  const color =
    value >= 60 ? 'bg-green-500/20 text-green-400' :
    value >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
    'bg-red-500/20 text-red-400'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}>
      {value}%
    </span>
  )
}
