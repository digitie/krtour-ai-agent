"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

// 클립보드 복사 버튼(작업 로그·생성된 API 키 등 공용).
export function CopyButton({
  text,
  label = "복사",
  copiedLabel = "복사됨",
  size = "sm",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: "xs" | "sm";
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size={size}
        variant="outline"
        onClick={async () => {
          setCopyError(false);
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          } catch {
            setCopied(false);
            setCopyError(true);
          }
        }}
      >
        {copied ? (
          <CheckIcon data-icon="inline-start" />
        ) : (
          <CopyIcon data-icon="inline-start" />
        )}
        {copied ? copiedLabel : label}
      </Button>
      {copyError ? (
        <p role="alert" className="text-[11px] text-destructive">
          클립보드 복사에 실패했습니다. 오류 상세를 직접 선택해 복사하세요.
        </p>
      ) : null}
    </div>
  );
}
