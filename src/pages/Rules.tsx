import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";

type RuleSection = {
  section_key: string;
  title: string;
  sort_order: number;
  body_md: string;
};

export default function Rules() {
  const [sections, setSections] = useState<RuleSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("rules_content")
      .select("section_key, title, sort_order, body_md")
      .order("sort_order")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setSections((data ?? []) as RuleSection[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!sections) {
    return <p className="text-bp-muted">Loading rules…</p>;
  }

  if (sections.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-bp-green">Rules</h2>
        <p className="text-bp-muted">No rules yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-bp-green">Rules</h2>
      {sections.map((s) => (
        <section key={s.section_key} className="space-y-2">
          <h3 className="text-lg font-medium text-bp-green">{s.title}</h3>
          <div className="prose prose-sm max-w-none text-bp-ink prose-headings:text-bp-green prose-strong:text-bp-green prose-code:rounded prose-code:bg-bp-cream-dark prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown>{s.body_md}</ReactMarkdown>
          </div>
        </section>
      ))}
    </div>
  );
}
