import React, { useState, useEffect } from "react";
import {
  CalendarDays, CalendarCheck, Clock, User, ArrowRight,
  Sparkles, CheckCircle2, AlertCircle, Building2, MapPin
} from "lucide-react";
import { C } from "../constants/theme";
import { Card, PageHeader, Button, Avatar, Pill } from "../components/ui";
import { getCurrentStoredUser } from "../api/auth";
import { fetchLeaves } from "../api/leavesApi";

const UPCOMING_HOLIDAYS = [
  { name: "Diwali Festival", date: "Nov 01, 2026", type: "Public Holiday" },
  { name: "New Year Celebration", date: "Jan 01, 2027", type: "Company Holiday" },
  { name: "Republic Day", date: "Jan 26, 2027", type: "National Holiday" },
];

export default function UserDashboardPage({ setPage }) {
  const user = getCurrentStoredUser();
  const emp = user?.employee || {};
  const empName = emp.name || user?.full_name || "Employee";
  const empCode = emp.id || "E1001";
  const role = emp.role || "Team Member";
  const department = emp.department || "Engineering";
  const location = emp.location || "Ahmedabad, India";

  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);

  useEffect(() => {
    fetchLeaves()
      .then((res) => {
        const allItems = Array.isArray(res) ? res : res?.results || [];
        const myItems = allItems.filter(
          (l) =>
            (empCode && l.employeeId === empCode) ||
            (user?.email && l.name?.toLowerCase().includes(user.email.split("@")[0].toLowerCase()))
        );
        setRecentLeaves(myItems.slice(0, 3));
      })
      .catch((err) => console.warn(err))
      .finally(() => setLoadingLeaves(false));
  }, [empCode]);

  return (
    <div className="page-enter">
      {/* Welcome Banner Card */}
      <Card
        style={{
          background: "linear-gradient(135deg, #14213D 0%, #1E2E52 65%, #1F8A70 100%)",
          color: "#fff",
          padding: "26px 30px",
          marginBottom: 24,
          border: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar name={empName} size={58} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ background: "rgba(255,255,255,0.18)", color: "#a7f3d0", fontSize: 11.5, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
                  ✦ Employee Self-Service Portal
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "IBM Plex Mono, monospace" }}>
                  {empCode}
                </span>
              </div>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>
                Welcome, {empName} 👋
              </h2>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span>{role} &bull; {department}</span>
                <span>&bull;</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={13} /> {location}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Button
              variant="outline"
              icon={CalendarDays}
              onClick={() => setPage("user-leave")}
              style={{ background: "#ffffff", color: C.ink, borderColor: "#ffffff", fontWeight: 600 }}
            >
              Apply for Leave
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
        <Card accent={C.teal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: C.slate }}>
              Available Leave Days
            </span>
            <CalendarDays size={18} color={C.teal} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 700, color: C.ink }}>
            24 <span style={{ fontSize: 13, fontWeight: 500, color: C.slateLight }}>Days</span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: C.slateLight }}>
            Casual: 10 &bull; Sick: 9 &bull; Earned: 5
          </p>
        </Card>

        <Card accent={C.blue}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: C.slate }}>
              Today's Attendance
            </span>
            <Clock size={18} color={C.blue} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: "#166534" }}>
            Present (On Duty)
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: C.slateLight }}>
            General Shift &bull; 09:30 AM &ndash; 06:30 PM
          </p>
        </Card>

        <Card accent={C.amber}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: C.slate }}>
              Pending Approvals
            </span>
            <AlertCircle size={18} color={C.amber} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 700, color: C.amber }}>
            {recentLeaves.filter((l) => l.status === "Pending").length}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: C.slateLight }}>
            Awaiting Admin / HR review
          </p>
        </Card>

        <Card accent={C.coral}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, color: C.slate }}>
              Manager
            </span>
            <Building2 size={18} color={C.coral} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 19, fontWeight: 700, color: C.ink }}>
            {emp.manager || "Priya Nair"}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: C.slateLight }}>
            Reporting Lead &bull; {department}
          </p>
        </Card>
      </div>

      {/* Main Grid: Recent Leaves & Holidays */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        {/* Recent Leave Requests Card */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>
              My Recent Leave Requests
            </h3>
            <span
              onClick={() => setPage("user-leave")}
              style={{ fontSize: 13, color: C.teal, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              View all <ArrowRight size={14} />
            </span>
          </div>

          {recentLeaves.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: C.slateLight, fontSize: 13 }}>
              No leave requests yet. Click <strong>Apply for Leave</strong> to submit one.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentLeaves.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: C.canvas,
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: C.ink, fontSize: 13.5 }}>{l.type}</div>
                    <div style={{ fontSize: 12, color: C.slateLight, marginTop: 2 }}>
                      {l.from} &rarr; {l.to} ({l.days} day{l.days > 1 ? "s" : ""})
                    </div>
                  </div>
                  <div>
                    {l.status === "Pending" ? (
                      <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>
                        ⏳ Pending Admin Review
                      </span>
                    ) : l.status === "Approved" ? (
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>
                        ✓ Approved
                      </span>
                    ) : (
                      <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>
                        ✕ Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming Holidays & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 22 }}>
            <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 14px" }}>
              Upcoming Holidays
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {UPCOMING_HOLIDAYS.map((h) => (
                <div
                  key={h.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{h.name}</div>
                    <div style={{ fontSize: 11.5, color: C.slateLight }}>{h.type}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.teal, background: C.tealSoft, padding: "3px 8px", borderRadius: 6 }}>
                    {h.date}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Links Card */}
          <Card style={{ padding: 18, background: "#f8fafc" }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, marginBottom: 10 }}>
              Quick Navigation
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button small variant="outline" onClick={() => setPage("user-leave")}>
                My Leaves
              </Button>
              <Button small variant="outline" onClick={() => setPage("user-attendance")}>
                My Attendance
              </Button>
              <Button small variant="outline" onClick={() => setPage("user-profile")}>
                My Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
