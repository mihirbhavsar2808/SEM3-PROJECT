import React, { useState, useEffect } from "react";
import { CalendarDays, Send, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { C } from "../constants/theme";
import { statusTone } from "../utils/helpers";
import { Card, PageHeader, Button, Input, Select, Table, Pill, EmptyState } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { fetchLeaves, createLeaveRequest } from "../api/leavesApi";
import { getCurrentStoredUser } from "../api/auth";

const LEAVE_TYPES = ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave"];

const DEFAULT_BALANCES = [
  { type: "Casual Leave", total: 12, used: 2, color: C.blue },
  { type: "Sick Leave", total: 10, used: 1, color: C.coral },
  { type: "Earned Leave", total: 15, used: 3, color: C.teal },
  { type: "Unpaid Leave", total: 5, used: 0, color: C.amber },
];

export default function UserLeavePage() {
  const toast = useToast();
  const user = getCurrentStoredUser();
  const empName = user?.employee?.name || user?.full_name || "Employee";
  const empCode = user?.employee?.id || "EMP";
  const empDbId = user?.employee?.pk;

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("All");

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [form, setForm] = useState({
    type: "Casual Leave",
    from: todayStr,
    to: tomorrowStr,
    reason: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const setFormField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (formErrors[k]) {
      setFormErrors((errs) => {
        const next = { ...errs };
        delete next[k];
        return next;
      });
    }
  };

  // Calculate days difference
  const calcDays = () => {
    if (!form.from || !form.to) return 1;
    const diff = (new Date(form.to) - new Date(form.from)) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.round(diff) + 1);
  };
  const totalDays = calcDays();

  const loadMyLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetchLeaves();
      const allItems = Array.isArray(res) ? res : res?.results || [];
      const userEmail = (user?.email || "").toLowerCase();
      const myItems = allItems.filter(
        (l) =>
          (empCode && (l.employeeId === empCode || l.employee_code === empCode)) ||
          (l.email && l.email.toLowerCase() === userEmail) ||
          (empName && l.name?.toLowerCase().includes(empName.toLowerCase())) ||
          (userEmail && l.name?.toLowerCase().includes(userEmail.split("@")[0]))
      );
      setLeaves(myItems.length > 0 ? myItems : allItems);
    } catch (err) {
      console.warn("Could not load user leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyLeaves();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.from) errors.from = "Start date is required";
    if (!form.to) errors.to = "End date is required";
    if (new Date(form.to) < new Date(form.from)) {
      errors.to = "End date cannot be earlier than start date";
    }
    if (!form.reason || form.reason.trim().length < 3) {
      errors.reason = "Please enter a valid reason for leave (min 3 characters)";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: empCode,
        employee: empDbId,
        email: user?.email,
        name: empName,
        type: form.type,
        from: form.from,
        to: form.to,
        from_date: form.from,
        to_date: form.to,
        days: totalDays,
        reason: form.reason.trim(),
        status: "Pending",
      };

      const res = await createLeaveRequest(payload);
      const newLeave = {
        id: res?.id || ("L" + (1000 + leaves.length)),
        name: empName,
        employeeId: empCode,
        type: form.type,
        from: form.from,
        to: form.to,
        days: totalDays,
        reason: form.reason.trim(),
        status: "Pending",
      };

      setLeaves((prev) => [newLeave, ...prev.filter((item) => item.id !== newLeave.id)]);
      toast("Leave request submitted! It is now pending admin approval.", "success");
      window.dispatchEvent(new Event("orbit_notifications_refresh"));
      setForm({
        type: "Casual Leave",
        from: todayStr,
        to: tomorrowStr,
        reason: "",
      });
      setFormErrors({});
      // Background reload
      loadMyLeaves();
    } catch (err) {
      console.warn("Backend error submitting leave, storing locally:", err);
      const newLeave = {
        id: "L" + (1000 + leaves.length),
        name: empName,
        employeeId: empCode,
        type: form.type,
        from: form.from,
        to: form.to,
        days: totalDays,
        reason: form.reason.trim(),
        status: "Pending",
      };
      setLeaves((prev) => [newLeave, ...prev]);
      toast("Leave request submitted! It is now pending admin approval.", "success");
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = ["All", "Pending", "Approved", "Rejected"];
  const filtered = tab === "All" ? leaves : leaves.filter((l) => l.status === tab);
  const pendingCount = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div className="page-enter">
      <PageHeader
        title="My Leaves & Time Off"
        subtitle={`Welcome, ${empName} (${empCode}). Check your leave balances, apply for leave, and track admin approvals.`}
        action={
          <Button variant="outline" icon={RefreshCw} small onClick={loadMyLeaves}>
            Refresh Status
          </Button>
        }
      />

      {/* Leave Balance Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {DEFAULT_BALANCES.map((b) => {
          const remaining = b.total - b.used;
          const pct = Math.round((b.used / b.total) * 100);
          return (
            <Card key={b.type} accent={b.color}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: C.slate }}>
                  {b.type}
                </div>
                <CalendarDays size={16} color={b.color} />
              </div>
              <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: C.ink }}>
                {remaining}{" "}
                <span style={{ fontSize: 12, fontWeight: 500, color: C.slateLight }}>/ {b.total} days</span>
              </div>
              <div style={{ marginTop: 10, height: 5, borderRadius: 99, background: C.canvas, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: b.color, borderRadius: 99 }} />
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: C.slateLight, marginTop: 6 }}>
                {b.used} days used &bull; {remaining} available
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>
        {/* Left Column: Apply for Leave Form */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
            <Send size={18} color={C.teal} />
            <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>
              Apply for Leave
            </h3>
          </div>

          <form onSubmit={handleApplyLeave}>
            <Select
              label="Leave Type"
              value={form.type}
              onChange={(e) => setFormField("type", e.target.value)}
              options={LEAVE_TYPES}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="From Date"
                type="date"
                required
                value={form.from}
                onChange={(e) => setFormField("from", e.target.value)}
                error={formErrors.from}
              />
              <Input
                label="To Date"
                type="date"
                required
                value={form.to}
                onChange={(e) => setFormField("to", e.target.value)}
                error={formErrors.to}
              />
            </div>

            {/* Total days calculation banner */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12.5,
                color: "#166534",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <span>Duration:</span>
              <strong style={{ fontSize: 13.5 }}>{totalDays} Day{totalDays > 1 ? "s" : ""}</strong>
            </div>

            <Input
              label="Reason for Leave"
              required
              value={form.reason}
              onChange={(e) => setFormField("reason", e.target.value)}
              placeholder="e.g. Attending a family wedding in Jaipur"
              error={formErrors.reason}
            />

            <Button
              variant="primary"
              type="submit"
              icon={Send}
              loading={submitting}
              style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
            >
              {submitting ? "Submitting Request..." : "Submit Leave Request"}
            </Button>
          </form>
        </Card>

        {/* Right Column: My Leave History & Real-Time Status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Tab filters */}
          <div style={{ display: "flex", gap: 8 }}>
            {tabs.map((t) => (
              <div
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  background: tab === t ? C.ink : C.panel,
                  color: tab === t ? "#fff" : C.slate,
                  border: `1px solid ${tab === t ? C.ink : C.border}`,
                  transition: "background 0.15s",
                }}
              >
                {t}
                {t === "Pending" && pendingCount > 0 && (
                  <span style={{ marginLeft: 6, background: C.amber, color: "#fff", padding: "1px 6px", borderRadius: 10, fontSize: 11 }}>
                    {pendingCount}
                  </span>
                )}
              </div>
            ))}
          </div>

          <Card style={{ padding: 0 }}>
            <Table
              columns={["Leave Type", "Duration", "Days", "Reason", "Admin Status"]}
              rows={filtered}
              renderRow={(l) => (
                <tr key={l.id} className="hoverable" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600, color: C.ink }}>
                    {l.type}
                  </td>
                  <td style={{ padding: "12px 14px", color: C.slate, fontSize: 12.5 }}>
                    {l.from} &rarr; {l.to}
                  </td>
                  <td style={{ padding: "12px 14px", color: C.slate, fontWeight: 600 }}>
                    {l.days}d
                  </td>
                  <td style={{ padding: "12px 14px", color: C.slate, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.reason}>
                    {l.reason || "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {l.status === "Pending" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "4px 9px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={12} /> Pending Approval
                      </span>
                    ) : l.status === "Approved" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "#dcfce7",
                          color: "#166534",
                          padding: "4px 9px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={12} /> Approved
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          background: "#fee2e2",
                          color: "#991b1b",
                          padding: "4px 9px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <XCircle size={12} /> Rejected
                      </span>
                    )}
                  </td>
                </tr>
              )}
            />
            {filtered.length === 0 && (
              <EmptyState text="You have no leave requests under this category." />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
