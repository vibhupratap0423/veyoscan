"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Owner & emergency numbers
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      setEmail(user.email ?? "");

      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, phone, emergency_phone")
        .eq("id", user.id)
        .single();

      if (p) {
        setName(p.full_name ?? "");
        setPhone(p.phone ?? "");
        setEmergencyPhone(p.emergency_phone ?? "");
      }

      setLoading(false);
    }

    load();
  }, []);

  async function save() {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        phone: phone,
        emergency_phone: emergencyPhone,
      })
      .eq("id", user.id);

    if (error) {
      alert("Something went wrong");
      return;
    }

    alert("Profile updated successfully");
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-zinc-500">Loading profile...</div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="text-sm text-zinc-400">Email: {email}</div>

      {/* Name */}
      <div>
        <label className="text-sm text-zinc-400">Full Name</label>
        <input
          className="w-full mt-1 p-2 rounded bg-zinc-900 border border-zinc-700"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>

      {/* Owner Number */}
      <div>
        <label className="text-sm text-zinc-400">Owner Mobile Number</label>
        <input
          className="w-full mt-1 p-2 rounded bg-zinc-900 border border-zinc-700"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Owner phone number"
        />
      </div>

      {/* Emergency Number */}
      <div>
        <label className="text-sm text-zinc-400">Emergency Contact Number</label>
        <input
          className="w-full mt-1 p-2 rounded bg-zinc-900 border border-zinc-700"
          type="tel"
          value={emergencyPhone}
          onChange={(e) => setEmergencyPhone(e.target.value)}
          placeholder="Emergency phone number"
        />
      </div>

      <button
        className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded"
        onClick={save}
      >
        Save
      </button>
    </div>
  );
}
