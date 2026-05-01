import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type TournamentState = {
  bracket_generated: boolean;
  registration_deadline: string | null;
};

const BARCELONA_FMT: Intl.DateTimeFormatOptions = {
  timeZone: "Europe/Madrid",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
};

export default function Bracket() {
  const [state, setState] = useState<TournamentState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    const { data, error } = await supabase
      .from("tournament_state")
      .select("bracket_generated, registration_deadline")
      .eq("id", 1)
      .single();
    if (error) setError(error.message);
    else if (data) setState(data as TournamentState);
  }, []);

  useEffect(() => {
    fetchState();

    // Realtime: refetch when tournament_state changes (e.g. admin generates bracket)
    const channel = supabase
      .channel("tournament_state_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_state" },
        () => fetchState(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchState]);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!state) {
    return <p className="text-bp-muted">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-bp-green">Bracket</h2>
      {state.bracket_generated ? (
        <BracketView />
      ) : (
        <EmptyBracket deadline={state.registration_deadline} />
      )}
    </div>
  );
}

function EmptyBracket({ deadline }: { deadline: string | null }) {
  return (
    <div className="space-y-3 rounded-lg border border-bp-cream-dark bg-white/50 p-5">
      <p className="text-bp-ink">
        Bracket will be formed after the registration deadline.
      </p>
      {deadline ? (
        <p className="text-sm text-bp-muted">
          Registration closes:{" "}
          <span className="font-medium text-bp-ink">
            {new Date(deadline).toLocaleString("en-GB", BARCELONA_FMT)}
          </span>{" "}
          (Barcelona time)
        </p>
      ) : (
        <p className="text-sm text-bp-muted">
          Registration deadline not set yet.
        </p>
      )}
    </div>
  );
}

function BracketView() {
  // Phase 3 lights this up: query matches + players, render rounds.
  return (
    <p className="text-sm text-bp-muted">
      Bracket rendering arrives in Phase 3.
    </p>
  );
}
