import * as React from "react";

import { cn } from "@/lib/utils";

// Input과 같은 surface·focus recipe를 사용해 폼 컨트롤의 리듬을 맞춘다.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full min-w-0 rounded-control border border-input bg-card px-3 py-2 text-sm text-text-primary transition-[color,background-color,border-color] duration-fast ease-out placeholder:text-text-tertiary",
        "hover:bg-surface-subtle focus-visible:border-text-secondary focus-visible:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-55 read-only:cursor-default read-only:bg-surface-subtle read-only:text-text-secondary",
        "aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
