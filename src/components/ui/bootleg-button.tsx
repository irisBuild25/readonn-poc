import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon
  size?: 'default' | 'sm'
}

/** Shared Bootleg CTA: ink label + vermillion mark. Use for primary actions. */
export function BootlegButton({
  icon: Icon,
  size = 'default',
  className,
  children,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        'cta-bootleg rounded-full border border-foreground/15 bg-card shadow-sm transition-colors',
        'hover:border-foreground/40 hover:bg-secondary',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'cta-bootleg--sm px-3 py-1.5' : 'justify-center px-5 py-3',
        className,
      )}
      {...props}
    >
      <span className="cta-bootleg__mark" aria-hidden>
        <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </span>
      <span className={size === 'sm' ? 'text-sm' : 'text-base'}>{children}</span>
    </button>
  )
}
