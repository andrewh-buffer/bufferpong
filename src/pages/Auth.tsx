import { useState, type FormEvent } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

type Status = "idle" | "sending" | "sent" | "error";

export default function Auth() {
  const { session, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to="/my-match" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@buffer.com")) {
      setError("Use your @buffer.com email.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError(null);
    const { error } = await signInWithEmail(email);
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-bp-green">BufferPong</h1>
        <p className="mt-1 text-sm text-bp-muted">Retreat '26</p>
      </div>

      {status === "sent" ? (
        <div className="space-y-3">
          <p className="text-bp-ink">
            Magic link sent. Check{" "}
            <span className="font-medium text-bp-green">{email}</span> and click
            the link to sign in.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setEmail("");
            }}
            className="text-sm text-bp-muted underline"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="w-full space-y-3">
          <p className="text-sm text-bp-muted">
            Sign in with your Buffer email. Signing in registers you for the
            tournament.
          </p>
          <input
            type="email"
            required
            placeholder="you@buffer.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            className="w-full rounded-md border border-bp-cream-dark bg-white px-4 py-3 text-base outline-none focus:border-bp-green"
            autoComplete="email"
            autoFocus
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-md bg-bp-green px-5 py-3 text-sm font-medium text-bp-cream shadow-sm hover:bg-bp-green-50 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>
      )}

      <p className="text-xs text-bp-muted">
        Anyone can browse the{" "}
        <Link to="/bracket" className="underline">
          bracket
        </Link>{" "}
        and{" "}
        <Link to="/rules" className="underline">
          rules
        </Link>{" "}
        without signing in.
      </p>
    </div>
  );
}
