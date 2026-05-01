import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { flagFor } from "@/lib/flag";

type Profile = {
  id: string;
  email: string;
  real_name: string;
  nickname: string | null;
  country: string | null;
  avatar_url: string | null;
  opted_out: boolean;
};

type Status = "idle" | "saving" | "saved" | "error";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else if (data) {
          setProfile(data as Profile);
        }
        setLoading(false);
      });
  }, [user]);

  const onChange = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
    if (status === "saved") setStatus("idle");
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setStatus("saving");
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        real_name: profile.real_name.trim(),
        nickname: profile.nickname?.trim() || null,
        country: profile.country?.trim().toUpperCase() || null,
      })
      .eq("id", profile.id);
    if (error) {
      setError(error.message);
      setStatus("error");
    } else {
      setStatus("saved");
    }
  };

  if (loading) {
    return <p className="text-bp-muted">Loading…</p>;
  }

  if (!profile) {
    return (
      <div className="space-y-3">
        <p className="text-red-700">{error ?? "Profile not found."}</p>
        <button
          type="button"
          onClick={signOut}
          className="text-sm text-bp-muted underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <h2 className="text-2xl font-semibold text-bp-green">Profile</h2>

      <div className="text-xs text-bp-muted">
        Signed in as{" "}
        <span className="font-medium text-bp-ink">{profile.email}</span>
      </div>

      <Field label="Real name" hint="Always shown alongside your nickname.">
        <input
          required
          value={profile.real_name}
          onChange={(e) => onChange("real_name", e.target.value)}
          className="input"
        />
      </Field>

      <Field label="Pong nickname" hint="Optional. Shown on the bracket.">
        <input
          value={profile.nickname ?? ""}
          onChange={(e) => onChange("nickname", e.target.value)}
          className="input"
          placeholder="e.g. The Spinster"
        />
      </Field>

      <Field
        label="Country"
        hint="2-letter code like GB, US, BR. Shows the flag."
      >
        <div className="flex items-center gap-2">
          <input
            value={profile.country ?? ""}
            onChange={(e) =>
              onChange("country", e.target.value.toUpperCase().slice(0, 2))
            }
            className="input w-24"
            maxLength={2}
            placeholder="GB"
          />
          <span className="text-3xl leading-none" aria-hidden>
            {flagFor(profile.country) || "🏳️"}
          </span>
        </div>
      </Field>

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full rounded-md bg-bp-green px-4 py-3 text-sm font-medium text-bp-cream disabled:opacity-60"
      >
        {status === "saving" ? "Saving…" : "Save profile"}
      </button>

      {status === "saved" && (
        <p className="text-sm text-bp-green">Saved.</p>
      )}
      {status === "error" && error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={signOut}
        className="w-full rounded-md border border-bp-cream-dark px-4 py-2 text-sm text-bp-muted"
      >
        Sign out
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-bp-ink">{label}</span>
      {children}
      {hint && <span className="block text-xs text-bp-muted">{hint}</span>}
    </label>
  );
}
