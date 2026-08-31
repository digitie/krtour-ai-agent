import * as React from "react";

import { cn } from "@/lib/utils";

// 최신 기준 레포와 같은 flat card recipe. 클릭 가능한 카드만 data-interactive를 사용한다.
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex min-w-0 flex-col gap-4 rounded-panel border border-border bg-card p-6 text-sm text-text-primary data-[size=sm]:gap-3 data-[size=sm]:p-4",
        "data-interactive:cursor-pointer data-interactive:transition-[color,background-color,border-color] data-interactive:duration-fast data-interactive:ease-out data-interactive:hover:bg-surface-subtle data-interactive:focus-visible:outline-2 data-interactive:focus-visible:outline-offset-2 data-interactive:focus-visible:outline-focus data-interactive:active:bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1",
        "[.border-b]:-mx-6 [.border-b]:border-border [.border-b]:px-6 [.border-b]:pb-4",
        "group-data-[size=sm]/card:[.border-b]:-mx-4 group-data-[size=sm]/card:[.border-b]:px-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  role = "heading",
  "aria-level": ariaLevel = 2,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-level={ariaLevel}
      data-slot="card-title"
      role={role}
      className={cn(
        "text-md leading-snug font-semibold text-text-primary group-data-[size=sm]/card:text-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs text-text-secondary", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 flex items-center gap-2 self-start justify-self-end text-icon-default",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("min-w-0", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "-mx-6 mt-1 flex flex-wrap items-center gap-2 rounded-b-panel border-t border-border px-6 py-3 group-data-[size=sm]/card:-mx-4 group-data-[size=sm]/card:px-4",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
