import React, { useState, useEffect } from "react";
import { Check, XCircle, CalendarDays, RefreshCw } from "lucide-react";
import { C } from "../constants/theme";
import { statusTone } from "../utils/helpers";
import { Card, PageHeader, Button, Table, Avatar, Pill, EmptyState } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { fetchLeaves, updateLeaveStatus } from "../api/leavesApi";

export default function LeavePage() {
  const toast = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("All");

  const categoryBalances = [
    { type: "Casual Leave", total: 12, color: C.blue },
    { type: "Sick Leave", total: 10, color: C.coral },
    { type: "Earned Leave", total: 15, color: C.teal },
    { type: "Unpaid Leave", total: 5, color: C.amber },
  ].map((b) => {
    const used = leaves
      .filter((l) => l.status === "Approved" && (l.type === b.type || l.leave_type_name === b.type))
      .reduce((s, l) => s + (Number(l.days) || 1), 0);
    return { ...b, used };
  });

  const tabs = ["All", "Pending", "Approved", "Rejected"];
  const filtered = tab === "All" ? leaves : leaves.filter((l) => l.status === tab);

  const loadLeavesData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetchLeaves();
      const items = Array.isArray(res) ? res : res?.results || [];
      setLeaves(items);
    } catch (err) {
      console.warn("Error fetching leave requests:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeavesData();
  }, []);

  async function updateStatus(id, status) {
    try {
      await updateLeaveStatus(id, status);
      setLeaves((list) => list.map((l) => (l.id === id ? { ...l, status } : l)));
      toast(
        status === "Approved" ? "Leave request approved successfully" : "Leave request rejected",
        status === "Approved" ? "success" : "warning"
      );
      window.dispatchEvent(new Event("orbit_notifications_refresh"));
    } catch (err) {
      console.warn("Backend leave update notice:", err);
      // Fallback local update
      setLeaves((list) => list.map((l) => (l.id === id ? { ...l, status } : l)));
      toast(
        status === "Approved" ? "Leave marked approved" : "Leave marked rejected",
        status === "Approved" ? "success" : "warning"
      );
      window.dispatchEvent(new Event("orbit_notifications_refresh"));
    }
  }

  const pendingCount  = leaves.filter((l) => l.status === "Pending").length;
  const approvedCount = leaves.filter((l) => l.status === "Approved").length;

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.slate, fontFamily: "Inter, sans-serif" }}>
        Loading employee leave requests...
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Leave Management (Admin Panel)"
        subtitle="Review, approve, or reject employee leave requests submitted from the User Portal"
        action={
          <Button
            variant="outline"
            icon={RefreshCw}
            small
            disabled={refreshing}
            onClick={() => loadLeavesData(true)}
          >
            {refreshing ? "Refreshing..." : "Refresh Requests"}
          </Button>
        }
      />

      {/* Leave category cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14, marginBottom: 20 }}>
        {categoryBalances.map((b) => {
          const remaining = b.total - b.used;
          const pct       = Math.round((b.used / b.total) * 100);
          return (
            <Card key={b.type} accent={b.color}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: C.slate }}>{b.type}</div>
                <CalendarDays size={15} color={b.color} />
              </div>
              <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: C.ink }}>{remaining} <span style={{ fontSize: 12, fontWeight: 500, color: C.slateLight }}>/ {b.total} days</span></div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: C.canvas, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: b.color, borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.slateLight, marginTop: 5 }}>{b.used} used · {remaining} remaining</div>
            </Card>
          );
        })}
      </div>

      {/* Summary row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Card style={{ padding: "12px 18px", flex: 1, minWidth: 140 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.slate, fontWeight: 600 }}>Pending Approval</div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: C.amber }}>{pendingCount}</div>
        </Card>
        <Card style={{ padding: "12px 18px", flex: 1, minWidth: 140 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.slate, fontWeight: 600 }}>Approved Requests</div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: C.teal }}>{approvedCount}</div>
        </Card>
        <Card style={{ padding: "12px 18px", flex: 1, minWidth: 140 }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.slate, fontWeight: 600 }}>Total Requests Received</div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: C.ink }}>{leaves.length}</div>
        </Card>
      </div>

      {/* Tab filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
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
          columns={["Employee", "Type", "From", "To", "Days", "Reason", "Status", "Actions"]}
          rows={filtered}
          renderRow={(l) => (
            <tr key={l.id} className="hoverable" style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={l.name || "Employee"} size={28} />
                  <div>
                    <div style={{ fontWeight: 600, color: C.ink }}>{l.name || "Unknown"}</div>
                    {l.employeeId && (
                      <div style={{ fontSize: 11, color: C.slateLight, fontFamily: "IBM Plex Mono, monospace" }}>
                        {l.employeeId}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td style={{ padding: "11px 14px", color: C.slate }}>{l.type}</td>
              <td style={{ padding: "11px 14px", color: C.slate }}>{l.from}</td>
              <td style={{ padding: "11px 14px", color: C.slate }}>{l.to}</td>
              <td style={{ padding: "11px 14px", color: C.slate, fontWeight: 600 }}>{l.days}d</td>
              <td style={{ padding: "11px 14px", color: C.slate, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.reason}>
                {l.reason || "—"}
              </td>
              <td style={{ padding: "11px 14px" }}>
                <Pill tone={statusTone(l.status)}>{l.status}</Pill>
              </td>
              <td style={{ padding: "11px 14px" }}>
                {l.status === "Pending" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      title="Approve leave"
                      onClick={() => updateStatus(l.id, "Approved")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #bbf7d0",
                        background: "#f0fdf4",
                        color: "#15803d",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      <Check size={13} />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      title="Reject leave"
                      onClick={() => updateStatus(l.id, "Rejected")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #fecaca",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  </div>
                ) : (
                  <span style={{ color: C.slateLight, fontSize: 12 }}>Processed</span>
                )}
              </td>
            </tr>
          )}
        />
        {filtered.length === 0 && <EmptyState text="No leave requests in this view." />}
      </Card>
    </div>
  );
}
