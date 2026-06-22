import { AlertCircle, CheckCircle } from 'lucide-react'

const STYLES = {
  error: {
    wrap: 'alert-error',
    icon: AlertCircle,
    text: 'text-red-400',
  },
  success: {
    wrap: 'alert-success',
    icon: CheckCircle,
    text: 'text-green-400',
  },
}

export default function Alert({ type = 'error', message, className = '' }) {
  if (!message) return null
  const s = STYLES[type] || STYLES.error
  const Icon = s.icon
  return (
    <div className={`${s.wrap} ${className}`}>
      <Icon size={16} className={`${s.text} shrink-0`} />
      <span className={`${s.text} text-sm`}>{message}</span>
    </div>
  )
}
