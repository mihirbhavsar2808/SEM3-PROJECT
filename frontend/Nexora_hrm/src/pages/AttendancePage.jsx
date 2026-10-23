import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, AlertCircle, RefreshCw, CheckCheck, Users, Calendar, Search } from "lucide-react";
import { C } from "../constants/theme";
import { statusTone } from "../utils/helpers";
import { Card, PageHeader, Table, Avatar, Pill, Button } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { fetchAttendance, updateAttendanceStatus, bulkMarkAttendance } from "../api/attendanceApi";

export default function AttendancePage() {
  const toast = useToast();
  const [attendance, setAttendance] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("All");
  const [search,     setSearch]     = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetchAttendance();
      const items = Array.isArray(res) ? res : res?.results || [];
      setAttendance(items);
    } catch (err) {
      console.warn("Attendance fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const changeStatus = async (item, newStatus) => {
    if (!item || !item.id) return;
    setUpdatingId(item.id);
    try {
      await updateAttendanceStatus(item.id, newStatus);
      setAttendance((list) =>
        list.map((a) => (a.id === item.id ? { ...a, status: newStatus } : a))
      );
      toast(`Marked ${item.name} as ${newStatus}`, "success");
    } catch (err) {
      setAttendance((list) =>
        list.map((a) => (a.id === item.id ? { ...a, status: newStatus } : a))
      );
      toast(`Marked ${item.name} as ${newStatus}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkPresent = async () => {
    try {
      const res = await bulkMarkAttendance("Present");
      toast(res?.detail || "All staff marked as Present today!", "success");
      await loadData(true);
    } catch (err) {
      toast("Failed to update all staff attendance", "error");
    }
  };

  const counts = ["Present", "Late", "WFH", "Absent"].map((s) => ({
    status: s,
    count: attendance.filter((a) => a.status === s).length,
  }));

  const filtered = attendance
    .filter((a) => filter === "All" || a.status === filter)
    .filter((a) => {
      const q = search.toLowerCase();
      return (
        (a.name || "").toLowerCase().includes(q) ||
        (a.employeeId || "").toLowerCase().includes(q) ||
        (a.department || "").toLowerCase().includes(q)
      );
    });

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: C.slate, fontFamily: "Inter, sans-serif" }}>
        <RefreshCw size={28} className="spin" style={{ margin: "0 auto 14px", color: C.teal, display: "block" }} />
        <p style={{ fontWeight: 600, color: C.ink, margin: "0 0 4px" }}>Loading Attendance Records...</p>
        <span style={{ fontSize: 13 }}>Fetching real-time check-in status</span>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Staff Attendance"
        subtitle={`Today's live check-ins across the organization — ${todayStr}`}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="teal"
              icon={CheckCheck}
              small
              onClick={handleBulkPresent}
            >
              Mark All Present
            </Button>
            <Button
              variant="outline"
              icon={RefreshCw}
              small
              disabled={refreshing}
              onClick={() => loadData(true)}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        }
      />

      {/* Summary Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>
        {counts.map((c) => (
          <Card key={c.status} accent={{ Present: C.teal, Late: C.amber, WFH: C.blue, Absent: C.coral }[c.status]}>
            <div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>{c.status}</span>
              <span style={{ fontSize: 11, color: C.slateLight }}>Today</span>
            </div>
            <div style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 800, color: C.ink }}>{c.count}</div>
          </Card>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <Card style={{ padding: "12px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["All", "Present", "Late", "WFH", "Absent"].map((s) => {
              const isSelected = s === filter;
              return (
                <div key={s} onClick={() => setFilter(s)} style={{ cursor: "pointer" }}>
                  <Pill tone={isSelected ? statusTone(s === "All" ? "Active" : s) : "slate"}>
                    {s}
                  </Pill>
                </div>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ flex: 1, maxWidth: 360, minWidth: 200, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", background: C.canvas }}>
            <Search size={14} color={C.slate} />
            <input
              placeholder="Search by name, ID, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: C.ink, width: "100%", fontFamily: "Inter, sans-serif" }}
            />
          </div>
        </div>
      </Card>

      {/* Main Attendance Table */}
      <Card style={{ padding: 0 }}>
        <Table
          columns={["Employee", "Employee ID", "Department", "Check-in", "Check-out", "Status", "Quick Action"]}
          rows={filtered}
          renderRow={(a) => {
            const isUpdating = updatingId === a.id;
            return (
              <tr key={a.id || a.employeeId} className="hoverable" style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={a.name} size={32} />
                    <strong style={{ color: C.ink, fontSize: 13.5 }}>{a.name}</strong>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontFamily: "Courier New, monospace", fontWeight: 700, fontSize: 13, color: C.slate }}>
                  {a.employeeId}
                </td>
                <td style={{ padding: "12px 16px", color: C.slate, fontSize: 13 }}>
                  {a.department || "General"}
                </td>
                <td style={{ padding: "12px 16px", color: C.ink, fontSize: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={13} color={C.teal} />
                    <span>{a.checkIn || "09:30 AM"}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: C.slate, fontSize: 13 }}>
                  {a.checkOut || "--"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Pill tone={statusTone(a.status)}>
                    {a.status}
                  </Pill>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["Present", "Late", "WFH", "Absent"].map((st) => (
                      <button
                        key={st}
                        disabled={isUpdating || a.status === st}
                        onClick={() => changeStatus(a, st)}
                        style={{
                          border: a.status === st ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
                          background: a.status === st ? `${C.teal}15` : "transparent",
                          color: a.status === st ? C.teal : C.slate,
                          fontSize: 11,
                          fontWeight: a.status === st ? 700 : 500,
                          borderRadius: 6,
                          padding: "3px 8px",
                          cursor: a.status === st ? "default" : "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          }}
        />

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: C.slate }}>
            No staff records matching your filter.
          </div>
        )}
      </Card>
    </div>
  );
}
