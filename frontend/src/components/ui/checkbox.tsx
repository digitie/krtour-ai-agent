"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// 시각 크기는 16px로 유지하고 after 확장으로 hit area를 보강한다.
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-control border border-input bg-card text-brand-foreground transition-[color,background-color,border-color] duration-fast ease-out after:absolute after:-inset-2 after:content-['']",
        "data-[unchecked]:hover:border-text-secondary data-[unchecked]:hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:opacity-55 group-has-disabled/field:opacity-55 aria-invalid:border-destructive data-checked:border-brand data-checked:bg-brand data-checked:text-brand-foreground data-[checked]:hover:border-brand-hover data-[checked]:hover:bg-brand-hover",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
