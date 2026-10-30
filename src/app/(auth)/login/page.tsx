"use client";

/**
 * Login page for MDview.
 *
 * This file exports a Server Component wrapper (default export) and contains
 * the interactive LoginForm as a Client Component in the same file, following
 * the pattern described in the design document.
 *
 * Requirements: 1.1, 1.2, 7.4
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// LoginForm — Client Component (needs state and event handlers)
// ---------------------------------------------------------------------------

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Requirement 1.1: redirect to home on success
        router.push("/");
      } else if (response.status === 429) {
        // Requirement 1.7: rate limit — inform user of temporary block
        setError(
          "Muitas tentativas de login. Tente novamente em 15 minutos."
        );
      } else {
        // Requirement 1.2: generic error that doesn't reveal which field is wrong
        setError("Credenciais inválidas");
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
      aria-label="Formulário de login"
    >
      {/* Error message */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="seu@email.com"
          className="
            w-full rounded-lg border border-gray-300 bg-white px-4
            text-base text-gray-900 placeholder:text-gray-400
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30
            disabled:cursor-not-allowed disabled:opacity-50
            min-h-[44px]
          "
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          placeholder="••••••••"
          className="
            w-full rounded-lg border border-gray-300 bg-white px-4
            text-base text-gray-900 placeholder:text-gray-400
            focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30
            disabled:cursor-not-allowed disabled:opacity-50
            min-h-[44px]
          "
        />
      </div>

      {/* Submit button — minimum 44×44px touch target (Requirement 7.4) */}
      <button
        type="submit"
        disabled={isLoading}
        className="
          flex w-full items-center justify-center rounded-lg
          bg-blue-600 px-6 text-base font-semibold text-white
          hover:bg-blue-700 active:bg-blue-800
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          transition-colors duration-150
          min-h-[44px]
        "
      >
        {isLoading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page — Server Component wrapper
// ---------------------------------------------------------------------------

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            MDview
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar suas apostilas
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 py-10 shadow-sm ring-1 ring-gray-200">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
