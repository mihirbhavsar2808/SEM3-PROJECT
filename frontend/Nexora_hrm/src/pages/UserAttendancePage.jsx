import React, { useState } from "react";
import { Clock, CalendarCheck, CheckCircle2, AlertTriangle, Home, Calendar } from "lucide-react";
import { C } from "../constants/theme";
import { Card, PageHeader, Table, Pill } from "../components/ui";
import { getCurrentStoredUser } from "../api/auth";

const SAMPLE_ATTENDANCE = [
  { date: "2026-10-23", checkIn: "09:25 AM", checkOut: "06:30 PM", hours: "9h 05m", status: "Present" },
  { date: "2026-10-22", checkIn: "09:30 AM", checkOut: "06:45 PM", hours: "9h 15m", status: "Present" },
  { date: "2026-10-21", checkIn: "09:55 AM", checkOut: "06:30 PM", hours: "8h 35m", status: "Late" },
  { date: "2026-10-20", checkIn: "09:30 AM", checkOut: "06:30 PM", hours: "9h 00m", status: "WFH" },
  { date: "2026-10-19", checkIn: "09:20 AM", checkOut: "06:25 PM", hours: "9h 05m", status: "Present" },
  { date: "2026-10-18", checkIn: "--", checkOut: "--", hours: "--", status: "Weekend" },
  { date: "2026-10-17", checkIn: "--", checkOut: "--", hours: "--", status: "Weekend" },
  { date: "2026-10-16", checkIn: "09:28 AM", checkOut: "06:32 PM", hours: "9h 04m", status: "Present" },
  { date: "2026-10-15", checkIn: "09:30 AM", checkOut: "06:30 PM", hours: "9h 00m", status: "Present" },
];

export default function UserAttendancePage() {
  const user = getCurrentStoredUser();
  const empName = user?.employee?.name || user?.full_name || "Employee";

  return (
    <div className="page-enter">
      <PageHeader
        title="My Attendance Record"
        subtitle={`Attendance tracking and shift logs for ${empName}`}
      />

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Card accent={C.teal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.slate }}>Days Present</span>
            <CheckCircle2 size={16} color={C.teal} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: C.ink }}>
            21 <span style={{ fontSize: 12, color: C.slateLight }}>/ 24 days</span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: C.slateLight }}>91.3% Attendance Rate</p>
        </Card>

        <Card accent={C.amber}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.slate }}>Late Check-ins</span>
            <AlertTriangle size={16} color={C.amber} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: C.amber }}>1</div>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: C.slateLight }}>Grace period: 15 mins</p>
        </Card>

        <Card accent={C.blue}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.slate }}>Work from Home</span>
            <Home size={16} color={C.blue} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: C.blue }}>2</div>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: C.slateLight }}>Remote approved</p>
        </Card>

        <Card accent={C.ink}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.slate }}>Designated Shift</span>
            <Clock size={16} color={C.ink} />
          </div>
          <div style={{ fontFamily: "Sora, sans-serif", fontSize: 18, fontWeight: 700, color: C.ink }}>
            General Shift
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 11.5, color: C.slateLight }}>09:30 AM &ndash; 06:30 PM</p>
        </Card>
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        <Table
          columns={["Date", "Check In", "Check Out", "Logged Hours", "Status"]}
          rows={SAMPLE_ATTENDANCE}
          renderRow={(row, idx) => (
            <tr key={idx} className="hoverable" style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: "12px 14px", fontWeight: 600, color: C.ink }}>{row.date}</td>
              <td style={{ padding: "12px 14px", color: C.slate, fontFamily: "IBM Plex Mono, monospace", fontSize: 12.5 }}>
                {row.checkIn}
              </td>
              <td style={{ padding: "12px 14px", color: C.slate, fontFamily: "IBM Plex Mono, monospace", fontSize: 12.5 }}>
                {row.checkOut}
              </td>
              <td style={{ padding: "12px 14px", color: C.slate }}>{row.hours}</td>
              <td style={{ padding: "12px 14px" }}>
                <Pill
                  tone={
                    row.status === "Present"
                      ? "green"
                      : row.status === "Late"
                      ? "amber"
                      : row.status === "WFH"
                      ? "blue"
                      : "slate"
                  }
                >
                  {row.status}
                </Pill>
              </td>
            </tr>
          )}
        />
      </Card>
    </div>
  );
}
