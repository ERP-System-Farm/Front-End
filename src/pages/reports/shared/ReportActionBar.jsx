import React, { useState } from 'react'
import { Send, Eye, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const ACTION_CONFIG = {
  submit: {
    label: 'تقديم التقرير',
    icon: Send,
    className:
      'bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-sm shadow-sky-600/20',
  },
  review: {
    label: 'بدء المراجعة',
    icon: Eye,
    className:
      'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm shadow-amber-500/20',
  },
  approve: {
    label: 'اعتماد التقرير',
    icon: CheckCircle2,
    className:
      'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20',
  },
  reject: {
    label: 'رفض التقرير',
    icon: XCircle,
    className:
      'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30 font-bold',
  },
}

const ReportActionBar = ({ availableActions, onAction, disabled }) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (!availableActions || availableActions.length === 0) return null

  const handleAction = (action) => {
    if (action === 'reject') {
      setRejectDialogOpen(true)
      return
    }
    onAction(action)
  }

  const submitReject = () => {
    if (!rejectReason.trim()) return
    onAction('reject', rejectReason)
    setRejectDialogOpen(false)
    setRejectReason('')
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {['submit', 'review', 'approve', 'reject']
          .filter((a) => availableActions.includes(a))
          .map((action) => {
            const cfg = ACTION_CONFIG[action]
            const Icon = cfg.icon
            const isReject = action === 'reject'
            return (
              <Button
                key={action}
                disabled={disabled}
                variant={isReject ? 'outline' : 'default'}
                size="sm"
                className={`h-8 px-3 text-xs rounded-lg gap-1.5 cursor-pointer transition-all ${cfg.className}`}
                onClick={() => handleAction(action)}
              >
                {disabled ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                {cfg.label}
              </Button>
            )
          })}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-rose-700 dark:text-rose-400 font-black flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              سبب رفض التقرير
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium">
              يرجى كتابة سبب الرفض بوضوح ليتمكن المهندس من التعديل والإعادة.
            </p>
            <Textarea
              autoFocus
              rows={4}
              placeholder="اكتب سبب الرفض هنا..."
              className="resize-none font-medium text-sm border-rose-200 dark:border-rose-900/40 focus-visible:ring-rose-500"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="font-bold"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectReason('')
              }}
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={!rejectReason.trim()}
              onClick={submitReject}
            >
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ReportActionBar
