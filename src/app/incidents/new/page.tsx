"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function toLocalDateTimeInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function NewIncidentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const originalAppointment = new Date(now.getTime() - 20 * 60_000);
    const revisedEta = new Date(now.getTime() + 40 * 60_000);

    return {
      load_ref: `DG-${String(Date.now()).slice(-4)}`,
      carrier: "Summit Logistics",
      origin: "Indianapolis, IN",
      destination: "Columbus, OH",
      dock_name: "Buckeye Regional Logistics",
      dock_contact_name: "Receiving Coordinator",
      dock_phone: "",
      driver_contact_name: "Samir Khan",
      driver_phone: "",
      original_appointment: toLocalDateTimeInput(originalAppointment),
      updated_eta: toLocalDateTimeInput(revisedEta),
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        original_appointment: new Date(formData.original_appointment).toISOString(),
        updated_eta: new Date(formData.updated_eta).toISOString(),
      };

      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create incident");
      } else {
        const data = await res.json();
        router.push(`/incidents/${data.incident.id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create incident");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-sm text-ink-muted">
        <Link href="/" className="hover:text-ink-primary">&larr; Shipments Desk</Link>
        <span>/</span>
        <span>Register Late Arrival</span>
      </div>

      <div className="bg-canvas-paper border border-edge rounded-lg p-6 shadow-sm space-y-5">
        <div className="border-b border-edge pb-3">
          <h1 className="text-xl font-bold text-ink-primary">Register Shipment Delay</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Input verified load and contact details to open a dedicated coordination workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-secondary font-medium mb-1">Load Reference</label>
              <input
                type="text"
                value={formData.load_ref}
                onChange={(e) => setFormData({ ...formData, load_ref: e.target.value })}
                className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-ink-secondary font-medium mb-1">Carrier Name</label>
              <input
                type="text"
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-secondary font-medium mb-1">Origin Facility</label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary"
                required
              />
            </div>

            <div>
              <label className="block text-ink-secondary font-medium mb-1">Destination Facility</label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ink-secondary font-medium mb-1">Original Appointment Slot</label>
              <input
                type="datetime-local"
                value={formData.original_appointment}
                onChange={(e) => setFormData({ ...formData, original_appointment: e.target.value })}
                className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-ink-secondary font-medium mb-1">Revised Driver ETA</label>
              <input
                type="datetime-local"
                value={formData.updated_eta}
                onChange={(e) => setFormData({ ...formData, updated_eta: e.target.value })}
                className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary font-medium"
                required
              />
            </div>
          </div>

          <div className="border-t border-edge pt-4 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink-primary">
              Facility &amp; Driver Contacts
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-ink-secondary font-medium mb-1">Receiving Facility Name</label>
                <input
                  type="text"
                  value={formData.dock_name}
                  onChange={(e) => setFormData({ ...formData, dock_name: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-ink-secondary font-medium mb-1">Dock Phone</label>
                <input
                  type="tel"
                  value={formData.dock_phone}
                  onChange={(e) => setFormData({ ...formData, dock_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-ink-secondary font-medium mb-1">Driver Name</label>
                <input
                  type="text"
                  value={formData.driver_contact_name}
                  onChange={(e) => setFormData({ ...formData, driver_contact_name: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-ink-secondary font-medium mb-1">Driver Phone</label>
                <input
                  type="tel"
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-edge bg-white text-ink-primary font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-action-primary text-white font-semibold text-sm hover:bg-action-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Registering..." : "Create Coordination Desk &rarr;"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
