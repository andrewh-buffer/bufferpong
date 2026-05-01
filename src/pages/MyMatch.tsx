import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

type TournamentState = {
  bracket_generated: boolean;
  registration_deadline: string | null;
};

export default function MyMatch() {
  const { user } = useAuth();
  const [state, setState] = useState<TournamentState | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("tournament_state")
      .select("bracket_generated, registration_deadline")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) setState(data as TournamentState);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-bp-green">My match</h2>

      {state && !state.bracket_generated ? (
        <div className="rounded-lg border border-bp-cream-dark bg-white/50 p-5 text-sm text-bp-muted">
          You're registered. Your match will appear here once the bracket is
          generated after the registration deadline.{" "}
          <Link to="/bracket" className="text-bp-green underline">
            Browse the bracket
          </Link>{" "}
          •{" "}
          <Link to="/profile" className="text-bp-green underline">
            Edit your profile
          </Link>
        </div>
      ) : (
        <p className="text-bp-muted">Loading…</p>
      )}

      <p className="text-xs text-bp-muted">
        Signed in as <span className="text-bp-ink">{user?.email}</span>
      </p>
    </div>
  );
}
