import { UserRound } from 'lucide-react'
import { useApp } from '@/store'
import { cn } from '@/lib/utils'

/** Top-right account entry, shared by every tab page. */
export function AvatarButton({ className }: { className?: string }) {
  const app = useApp()
  return (
    <button aria-label={app.user ? '我的' : '登录'} onClick={() => app.go({ name: 'me' })}
      className={cn('relative grid size-9 shrink-0 place-items-center rounded-full border bg-card text-[13px] font-bold', className)}>
      {app.user ? app.user[0] : <UserRound className="size-4" />}
      {app.user && app.role === 'creator' && <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-primary px-1 text-[8.5px] font-bold leading-[13px] text-primary-foreground">创</span>}
    </button>
  )
}
