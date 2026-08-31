import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

// 최신 기준 레포의 button recipe. 색상 토큰만 Concierge의 보라 팔레트를 참조한다.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding font-medium whitespace-nowrap no-underline select-none transition-[color,background-color,border-color,box-shadow,transform] duration-fast ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed aria-disabled:cursor-not-allowed aria-busy:cursor-progress aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-brand-foreground hover:bg-brand-hover active:bg-brand-hover disabled:bg-surface-muted disabled:text-text-primary aria-disabled:bg-surface-muted aria-disabled:text-text-primary",
        outline:
          "border-input bg-card text-text-primary hover:bg-surface-subtle active:bg-surface-muted aria-expanded:bg-surface-subtle aria-expanded:text-text-primary disabled:border-input disabled:bg-card aria-disabled:border-input aria-disabled:bg-card",
        secondary:
          "border-brand bg-brand-tint text-brand hover:border-brand-hover hover:text-brand-hover active:border-brand-hover active:text-brand-hover aria-expanded:border-brand aria-expanded:bg-brand-tint aria-expanded:text-brand disabled:border-brand disabled:text-brand aria-disabled:border-brand aria-disabled:text-brand",
        ghost:
          "text-text-secondary hover:bg-surface-subtle hover:text-text-primary active:bg-surface-muted aria-expanded:bg-surface-subtle aria-expanded:text-text-primary disabled:bg-transparent disabled:text-text-secondary aria-disabled:bg-transparent aria-disabled:text-text-secondary",
        destructive:
          "border-input bg-card text-destructive hover:border-destructive hover:bg-destructive-tint active:bg-destructive-tint disabled:border-input disabled:bg-card aria-disabled:border-input aria-disabled:bg-card",
        "destructive-solid":
          "bg-destructive text-brand-foreground hover:bg-text-primary hover:text-surface-page active:bg-text-primary active:text-surface-page disabled:bg-surface-muted disabled:text-text-primary aria-disabled:bg-surface-muted aria-disabled:text-text-primary",
        link: "text-brand underline-offset-4 hover:text-brand-hover hover:underline",
      },
      size: {
        default:
          "h-control gap-2 px-3.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "h-control-sm gap-1.5 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        xs: "h-control-sm gap-1.5 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-control gap-2 px-3.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-control text-sm",
        "icon-sm": "size-control-sm text-xs [&_svg:not([class*='size-'])]:size-3.5",
        "icon-xs": "size-control-sm text-xs [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-control text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const BUTTON_LABEL_CLASS = "inline-flex items-center justify-center gap-[inherit]";
const BUTTON_LABEL_DIMMED_CLASS =
  "group-disabled/button:opacity-55 group-aria-disabled/button:opacity-55";

type ButtonClickHandler = NonNullable<ButtonPrimitive.Props["onClick"]>;

const blockBusyActivation: ButtonClickHandler = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** 비동기 진행 중에도 포커스를 유지하는 버튼 상태. */
    loading?: boolean;
    /** 비활성 상태의 이유를 native title로 제공한다. */
    disabledReason?: string;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabledReason,
  disabled,
  title,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const nativeDisabled = Boolean(disabled) && !loading;
  const reason = disabled && !loading ? disabledReason : undefined;

  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading ? "true" : undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      title={reason ?? title}
      disabled={nativeDisabled}
      onClick={loading ? blockBusyActivation : onClick}
      className={cn(buttonVariants({ variant, size }), loading && "relative", className)}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          data-slot="button-spinner"
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2Icon className="animate-spin" />
        </span>
      ) : null}
      <span
        data-slot="button-label"
        className={cn(
          BUTTON_LABEL_CLASS,
          loading ? "opacity-0" : BUTTON_LABEL_DIMMED_CLASS,
        )}
      >
        {children}
      </span>
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
