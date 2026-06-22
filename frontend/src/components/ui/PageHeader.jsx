export default function PageHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="page-header mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="page-header-icon">
              <Icon size={20} strokeWidth={2} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}
