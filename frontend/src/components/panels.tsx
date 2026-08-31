import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 상태/작업 상세/수집 화면이 각자 복붙하던 대시보드 조각의 단일 출처.
// 제목 텍스트와 heading 역할은 E2E가 검증하므로 렌더 구조(h2)를 유지한다.

/** 화면 내 큰 묶음(작업/데이터/보안 등). 제목 + 선택적 우측 액션. */
export function Section({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-5">
      {actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-md font-semibold tracking-tight text-text-primary">{title}</h2>
          {actions}
        </div>
      ) : (
        <h2 className="text-md font-semibold tracking-tight text-text-primary">{title}</h2>
      )}
      {children}
    </section>
  );
}

/** 정보 단위 경계 카드. 최신 기준 레포의 flat panel shape를 공유한다. */
export function Panel({
  title,
  icon,
  className,
  children,
}: {
  title: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "group/panel flex min-w-0 flex-col rounded-panel border border-border bg-card p-4 text-sm text-text-primary",
        className,
      )}
    >
      <h2 className="-mx-4 mb-4 flex items-center gap-2 border-b border-border px-4 pb-3 text-md font-semibold leading-snug">
        {icon ? <span className="text-brand">{icon}</span> : null}
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 목록 패널 상단 제목 + 개수 배지 줄(장소/후보/반복 작업 목록 공용). */
export function PanelHeader({
  title,
  count,
  icon,
}: {
  title: string;
  count: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        {icon}
        {title}
      </h2>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}

/** KPI strip 단위. 개별 아이콘 타일 대신 얇은 경계와 숫자 위계만 사용한다. */
export function MetricCard({
  icon,
  label,
  value,
  tone = "neutral",
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "active" | "warn";
  href?: string;
}) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-text-secondary">
        <span
          className={cn(
            "shrink-0",
            tone === "active"
              ? "text-brand"
              : tone === "warn"
                ? "text-warning"
                : "text-text-secondary",
          )}
        >
          {icon}
        </span>
        <span className="truncate">
          {label}
        </span>
      </span>
      <span className="block min-w-0 text-md font-semibold leading-snug text-text-primary">
        {value}
      </span>
    </>
  );
  const className =
    "group flex min-w-0 flex-col gap-1 border-l border-border px-4 py-1 first:border-l-0 first:pl-0";
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          className,
          "rounded-control no-underline transition-[color,background-color,border-color] duration-fast ease-out hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

/** 작은 라벨/값 셀(요약 그리드·다이얼로그 요약 공용). KPI 숫자는 size="lg"로 크게(규칙 8). */
export function Metric({
  label,
  value,
  size = "sm",
}: {
  label: string;
  value: string;
  size?: "sm" | "lg";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-border py-2">
      <span className="text-xs font-medium text-text-secondary">
        {label}
      </span>
      <span
        className={
          size === "lg"
            ? "text-lg font-semibold leading-snug text-text-primary whitespace-nowrap"
            : "text-sm font-semibold text-text-primary"
        }
      >
        {value}
      </span>
    </div>
  );
}

/** key→count 목록(상태 집계 공용). labeler로 한국어 라벨 변환. */
export function CountList({
  counts,
  empty,
  labeler,
}: {
  counts: Record<string, number>;
  empty: string;
  labeler?: (key: string) => string;
}) {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    return <EmptyState>{empty}</EmptyState>;
  }
  return (
    <div className="flex flex-col divide-y divide-border border-y border-border text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-3 py-2">
          <span className="text-text-secondary">{labeler ? labeler(key) : key}</span>
          <span className="font-medium tabular-nums">{value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/** 비어 있음/로딩 안내 문단(공용). */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="border-y border-border py-3 text-sm text-text-secondary">
      {children}
    </p>
  );
}
