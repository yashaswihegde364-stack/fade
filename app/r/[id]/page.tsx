import type { Metadata } from "next";
import Link from "next/link";

async function getSession(id: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    const res = await fetch(`${base}/api/share/${id}`, { cache: "no-store" });
    const data = await res.json();
    return data.session;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "A fade session",
    description: "Starts loud. Gets quiet. You keep going.",
    openGraph: {
      title: "A fade session",
      description: "Starts loud. Gets quiet. You keep going.",
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(id);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-2xl font-semibold">fade</p>
      <p className="mt-2 text-[var(--muted)]">Starts loud. Gets quiet. You keep going.</p>

      {session ? (
        <div className="mt-8 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left">
          <p className="font-display text-lg font-semibold">{session.task}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Reached {session.deepest_zone} · {Math.round(session.quiet_seconds / 60)}m quiet ·{" "}
            {session.drifts} drifts
          </p>
        </div>
      ) : (
        <div className="mt-8 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
          This share link needs the backend connected to load the session's stats — but you can
          still try Fade yourself.
        </div>
      )}

      <Link
        href="/"
        className="mt-8 cursor-pointer rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-medium text-[#1a1206]"
      >
        Try Fade
      </Link>
    </main>
  );
}
