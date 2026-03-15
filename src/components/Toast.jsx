import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react'

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div className={`fixed top-24 right-4 z-50 animate-slideIn`}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[type]}`}>
        <span className={`text-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'yellow' : 'blue'}-500`}>
          {icons[type]}
        </span>
        <p className="font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Container Component
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-24 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
