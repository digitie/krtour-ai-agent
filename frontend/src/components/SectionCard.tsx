import type { ReactNode } from "react";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  size?: "default" | "sm";
  headingLevel?: 2 | 3 | 4;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
};

// 페이지 섹션의 제목 밴드·본문·footer를 하나의 flat containment로 묶는다.
function SectionCard({
  title,
  description,
  actions,
  footer,
  size = "sm",
  headingLevel = 2,
  className,
  contentClassName,
  children,
}: SectionCardProps) {
  return (
    <Card className={className} size={size}>
      <CardHeader className="border-b">
        <CardTitle aria-level={headingLevel}>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {actions ? <CardAction>{actions}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}

export { SectionCard };
export type { SectionCardProps };
