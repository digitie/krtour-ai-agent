import { Suspense } from "react";

import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-surface-page px-4 py-10 before:absolute before:inset-x-0 before:top-0 before:h-2 before:bg-[var(--shell-rail)]">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
