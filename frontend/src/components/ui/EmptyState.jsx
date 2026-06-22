export default function EmptyState({ icon: Icon, emoji, title, description, action }) {
  return (
    <div className="empty-state">
      {emoji && <span className="text-4xl block mb-3">{emoji}</span>}
      {Icon && <Icon size={40} className="text-zinc-700 mx-auto mb-3" strokeWidth={1.25} />}
      <p className="text-zinc-400 font-medium">{title}</p>
      {description && <p className="text-zinc-600 text-sm mt-1">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
