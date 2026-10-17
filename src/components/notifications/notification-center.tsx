'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Calendar,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
  Check,
} from 'lucide-react'
import { getNotificationsAction, type AppNotification } from './actions'

interface Props {
  role: 'ADMIN' | 'PATIENT'
}

export function NotificationCenter({ role }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const popoverRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const storageKey = `evsoftware_read_notifs_${role.toLowerCase()}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setReadIds(new Set(JSON.parse(saved)))
      }
    } catch {}

    getNotificationsAction(role)
      .then((data) => {
        setNotifications(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [role, storageKey])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !readIds.has(n.id) && n.unread).length

  const handleMarkAsRead = (id: string) => {
    const next = new Set(readIds)
    next.add(id)
    setReadIds(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(next)))
    } catch {}
  }

  const handleMarkAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setReadIds(allIds)
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(allIds)))
    } catch {}
  }

  const handleNotificationClick = (n: AppNotification) => {
    handleMarkAsRead(n.id)
    setIsOpen(false)
    router.push(n.href)
  }

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'APPOINTMENT':
        return <Calendar className="w-4 h-4 text-blue-600" />
      case 'QUESTIONNAIRE':
        return <FileText className="w-4 h-4 text-purple-600" />
      case 'PLAN':
        return <Sparkles className="w-4 h-4 text-teal-600" />
      case 'DOCUMENT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir notificaciones"
        className={`relative p-2 rounded-2xl transition-all cursor-pointer ${
          isOpen
            ? 'bg-blue-100/80 text-blue-800'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-2xs border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Notificaciones
              </span>
              {unreadCount > 0 && (
                <span className="text-3xs font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-3xs font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Marcar leídas
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center px-4 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">Sin notificaciones pendientes</p>
                <p className="text-3xs text-slate-400">
                  Te avisaremos cuando haya novedades en tus citas, cuestionarios o planes.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = readIds.has(item.id) || !item.unread
                const dateObj = new Date(item.time)
                const timeFormatted = isNaN(dateObj.getTime())
                  ? ''
                  : dateObj.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                      isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-blue-50/30 hover:bg-blue-50/60'
                    }`}
                  >
                    <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                      {getIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            isRead ? 'text-slate-800' : 'text-blue-950 font-black'
                          }`}
                        >
                          {item.title}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-2xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-3xs text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{timeFormatted}</span>
                        </span>
                        <span className="text-3xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>Ver</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
