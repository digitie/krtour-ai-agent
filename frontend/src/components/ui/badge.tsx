import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-control border border-transparent px-2 text-2xs leading-none font-medium whitespace-nowrap tabular-nums transition-[color,background-color,border-color] duration-fast ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-foreground [a]:hover:bg-brand-hover",
        secondary: "bg-brand-tint text-brand [a]:hover:border-brand",
        destructive:
          "bg-destructive-tint text-destructive [a]:hover:border-destructive",
        outline:
          "border-border bg-card text-text-secondary [a]:hover:bg-surface-subtle [a]:hover:text-text-primary",
        ghost: "text-text-secondary hover:bg-surface-subtle hover:text-text-primary",
        link: "text-brand underline-offset-4 hover:underline",
        success: "bg-success-tint text-success [a]:hover:border-success",
        warning: "bg-warning-tint text-warning [a]:hover:border-warning",
        info: "bg-info-tint text-info [a]:hover:border-info",
        neutral: "bg-surface-subtle text-text-secondary [a]:hover:bg-surface-muted [a]:hover:text-text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
