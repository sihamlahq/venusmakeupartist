"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ADMIN_API_LOGIN_PATH,
  ADMIN_LOGIN_PATH,
} from "@/lib/admin-path";

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(ADMIN_API_LOGIN_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Login failed.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          Admin password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full min-h-12 rounded-xl border border-rose-200 bg-white px-4 py-3 text-base outline-none ring-rose-300 focus:ring-2"
          placeholder="Enter your password"
          required
        />
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-rose-900 px-4 py-3 font-medium text-white transition hover:bg-rose-800 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    await fetch(ADMIN_API_LOGIN_PATH, { method: "DELETE" });
    router.push(ADMIN_LOGIN_PATH);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      aria-label={loading ? "Signing out" : "Sign out"}
      title="Sign out"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-200 text-rose-900 transition hover:bg-rose-50 disabled:opacity-60 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="hidden text-sm sm:inline">
        {loading ? "Signing out..." : "Sign out"}
      </span>
    </button>
  );
}
