"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CallRow = {
  id: string;
  created_at: string;
  plate: string;
  owner_phone: string | null;
  emergency_phone: string | null;
  exotel_call_sid: string | null;
  status: string | null;
};

export default function CallsPage() {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return rows;
    return rows.filter((r) => (r.plate ?? "").toUpperCase().includes(s));
  }, [rows, q]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from("emergency_calls")
        .select("id,created_at,plate,owner_phone,emergency_phone,exotel_call_sid,status")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // data is unknown[] | null, safely cast after runtime check
      const safe: CallRow[] = Array.isArray(data) ? (data as CallRow[]) : [];
      setRows(safe);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load calls");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const channel = supabase
      .channel("calls-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "emergency_calls" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Calls</h1>
        <button
          className="rounded bg-white/10 hover:bg-white/15 px-3 py-2 text-sm"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <input
        className="w-full rounded bg-black/30 border border-white/10 px-3 py-2 outline-none"
        placeholder="Search by plate (e.g. UP16...)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {err && (
        <div className="rounded bg-red-600/20 text-red-200 px-3 py-2 text-sm">{err}</div>
      )}

      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Plate</th>
                <th className="p-3">Status</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Emergency</th>
                <th className="p-3">SID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-3 opacity-80">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 font-medium">{r.plate}</td>
                  <td className="p-3">{r.status ?? "—"}</td>
                  <td className="p-3">{r.owner_phone ?? "—"}</td>
                  <td className="p-3">{r.emergency_phone ?? "—"}</td>
                  <td className="p-3 text-xs opacity-80">{r.exotel_call_sid ?? "—"}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td className="p-3 opacity-60" colSpan={6}>
                    No calls found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs opacity-60">
        Webhook enabled: status will auto-update (ringing/answered/completed).
      </div>
    </div>
  );
}
