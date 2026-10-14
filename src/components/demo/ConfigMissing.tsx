"use client";

export function ConfigMissing() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-semibold">Supabase-configuratie ontbreekt</p>
      <p className="mt-2 text-sm">
        Definieer `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
      </p>
    </div>
  );
}
