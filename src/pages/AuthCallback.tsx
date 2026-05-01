import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session) {
      navigate("/my-match", { replace: true });
      return;
    }
    const timeout = setTimeout(() => setStuck(true), 4000);
    return () => clearTimeout(timeout);
  }, [session, loading, navigate]);

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {stuck ? (
        <>
          <p className="text-bp-ink">Couldn't sign you in.</p>
          <button
            type="button"
            onClick={() => navigate("/auth", { replace: true })}
            className="rounded-md bg-bp-green px-4 py-2 text-sm font-medium text-bp-cream"
          >
            Try again
          </button>
        </>
      ) : (
        <p className="text-bp-muted">Signing you in…</p>
      )}
    </div>
  );
}
