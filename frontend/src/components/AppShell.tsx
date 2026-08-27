"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ActivityIcon,
  ClipboardCheckIcon,
  DownloadCloudIcon,
  ListChecksIcon,
  LogOutIcon,
  MapIcon,
  PlugIcon,
  SettingsIcon,
} from "lucide-react";

import { JobStatusLink } from "@/components/JobStatusLink";
import { Button } from "@/components/ui/button";
import { pickActiveNavHref } from "@/lib/nav";
import { cn } from "@/lib/utils";

// 주 그룹: 일상 흐름(결과·수집·검수·작업·설정). 보조 그룹: 진단·개발 도구(상태·API 테스트).
const primaryNavItems = [
  { href: "/", label: "결과", icon: MapIcon },
  { href: "/collect", label: "수집", icon: DownloadCloudIcon },
  { href: "/review", label: "검수", icon: ClipboardCheckIcon },
  { href: "/jobs", label: "작업", icon: ListChecksIcon },
  { href: "/settings", label: "설정", icon: SettingsIcon },
] as const;

const secondaryNavItems = [
  { href: "/status", label: "상태", icon: ActivityIcon },
  { href: "/api-test", label: "API", icon: PlugIcon },
] as const;

const navHrefs = [
  ...primaryNavItems.map((item) => item.href),
  ...secondaryNavItems.map((item) => item.href),
];

export function AppShell({
  title,
  description,
  actions,
  children,
  contentClassName,
  viewportLocked,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
  viewportLocked?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = pickActiveNavHref(pathname, navHrefs);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  const renderNavLink = (item: {
    href: string;
    label: string;
    icon: typeof MapIcon;
  }) => {
    const Icon = item.icon;
    const active = item.href === activeHref;
    return (
      <Link
        className={cn(
          "group flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-bold no-underline transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-white/70 lg:h-10 lg:flex-row lg:justify-start lg:gap-2 lg:px-3 lg:py-0 lg:text-[13px]",
          active
            ? "bg-white text-[var(--shell-rail)] shadow-[0_1px_2px_rgb(0_0_0_/_0.12)]"
            : "text-[var(--shell-rail-muted)] hover:bg-white/10 hover:text-white",
        )}
        href={item.href}
        key={item.href}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <main className="min-h-dvh bg-surface-page text-text-primary">
      <div className="grid min-h-dvh min-w-0 lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:grid-cols-[16.5rem_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-[color:var(--sidebar-border)] bg-[var(--shell-rail)] text-[var(--shell-rail-text)] lg:border-r lg:border-b-0">
          <div className="flex h-full min-w-0 flex-col gap-3 px-3 py-3 lg:gap-7 lg:p-5">
            <div className="flex min-w-0 items-center gap-2 lg:gap-3">
              <Link
                className="group flex min-w-0 flex-1 items-center gap-2 text-[var(--shell-rail-text)] no-underline lg:gap-3"
                href="/"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition-[background-color,border-color] duration-150 group-hover:border-white/30 group-hover:bg-white/15 lg:size-10">
                  <MapIcon className="size-4 lg:size-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-extrabold tracking-[-0.02em] lg:text-[14px]">
                    Korea Travel
                  </span>
                  <span className="block truncate text-[10px] font-medium tracking-[0.08em] text-[var(--shell-rail-muted)] uppercase">
                    Concierge
                  </span>
                </span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={logout}
                aria-label="로그아웃"
                title="로그아웃"
                className="border border-white/12 text-[var(--shell-rail-muted)] hover:bg-white/10 hover:text-white"
              >
                <LogOutIcon className="size-4" />
              </Button>
            </div>
            <nav
              aria-label="주요 탐색"
              className="grid grid-cols-4 gap-1 sm:grid-cols-7 lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col lg:overflow-y-auto lg:pr-1"
            >
              {primaryNavItems.map(renderNavLink)}
              <div
                aria-hidden
                className="hidden lg:my-1 lg:block lg:border-t lg:border-white/10"
              />
              {secondaryNavItems.map(renderNavLink)}
            </nav>
            <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <p className="text-[10px] font-bold tracking-[0.1em] text-[var(--shell-rail-muted)] uppercase">
                  운영 흐름
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/85">
                  수집한 여행 단서를 검수하고 공급 가능한 장소 데이터로 정리합니다.
                </p>
              </div>
              <JobStatusLink variant="menu" />
            </div>
          </div>
        </aside>
        <div
          className={cn(
            "flex min-h-dvh min-w-0 flex-col",
            viewportLocked && "ktc-viewport-locked",
          )}
        >
          <header className="flex shrink-0 flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-surface-muted bg-card/85 px-4 py-4 backdrop-blur-sm lg:px-8 lg:py-5">
            <div className="min-w-0">
              <p className="ktc-eyebrow mb-1">운영 작업면</p>
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="min-w-0 text-[22px] leading-none font-extrabold tracking-[-0.035em] lg:text-[25px]">
                  {title}
                </h1>
                {description ? (
                  <span className="max-w-prose text-[12px] leading-relaxed text-text-secondary lg:text-[13px]">
                    {description}
                  </span>
                ) : null}
              </div>
            </div>
            {actions ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2 sm:flex-none sm:justify-end">
                {actions}
              </div>
            ) : null}
          </header>
          <div
            className={cn(
              "min-h-0 min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-7",
              viewportLocked && "ktc-viewport-locked-content",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
