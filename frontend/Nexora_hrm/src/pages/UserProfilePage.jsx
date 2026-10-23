import React from "react";
import { Mail, Phone, MapPin, Building2, Calendar, ShieldCheck, Briefcase, CreditCard } from "lucide-react";
import { C } from "../constants/theme";
import { Card, PageHeader, Avatar, Pill } from "../components/ui";
import { getCurrentStoredUser } from "../api/auth";

export default function UserProfilePage() {
  const user = getCurrentStoredUser();
  const emp = user?.employee || {};
  const empName = emp.name || user?.full_name || "Employee";
  const empEmail = user?.email || "employee@orbithrm.com";
  const empCode = emp.id || "E1001";
  const role = emp.role || "Team Member";
  const department = emp.department || "Engineering";
  const phone = emp.phone || "+91 98765 43210";
  const location = emp.location || "Ahmedabad, India";
  const joinDate = emp.joinDate || "2026-01-15";
  const manager = emp.manager || "Admin";

  return (
    <div className="page-enter">
      <PageHeader
        title="My Employee Profile"
        subtitle="View your employment details and organization records"
      />

      {/* Top Identity Card */}
      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar name={empName} size={76} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: 22, fontWeight: 700, color: C.ink, margin: 0 }}>
                {empName}
              </h2>
              <span style={{ background: C.canvas, border: `1px solid ${C.border}`, fontFamily: "IBM Plex Mono, monospace", fontSize: 12, padding: "2px 8px", borderRadius: 6, color: C.slate }}>
                {empCode}
              </span>
              <Pill tone="green">Active Employee</Pill>
            </div>
            <div style={{ color: C.slate, fontSize: 14 }}>
              {role} &bull; <strong style={{ color: C.teal }}>{department}</strong>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 13, color: C.slateLight, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.slate }}>
                <Mail size={13} /> {empEmail}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.slate }}>
                <Phone size={13} /> {phone}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.slate }}>
                <MapPin size={13} /> {location}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Employment Details & Bank Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Employment Information */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
            <Briefcase size={16} color={C.teal} />
            <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>
              Employment Details
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Employee Code</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: C.ink }}>{empCode}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Department</span>
              <span style={{ fontWeight: 600, color: C.ink }}>{department}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Designation</span>
              <span style={{ fontWeight: 600, color: C.ink }}>{role}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Reporting Manager</span>
              <span style={{ fontWeight: 600, color: C.ink }}>{manager}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Joining Date</span>
              <span style={{ fontWeight: 600, color: C.ink }}>{joinDate}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Work Schedule</span>
              <span style={{ fontWeight: 600, color: C.teal }}>General Shift (09:30 AM &ndash; 06:30 PM)</span>
            </div>
          </div>
        </Card>

        {/* Security & Access Info */}
        <Card style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
            <ShieldCheck size={16} color={C.blue} />
            <h3 style={{ fontFamily: "Sora, sans-serif", fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>
              Portal Access & Security
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Account Role</span>
              <span style={{ fontWeight: 600, color: C.blue }}>Employee (Self-Service)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Registered Email</span>
              <span style={{ fontWeight: 600, color: C.ink }}>{empEmail}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Two-Factor Auth</span>
              <span style={{ color: C.teal, fontWeight: 600 }}>Enabled (Email)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.slateLight }}>Company Server</span>
              <span style={{ color: C.slate, fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}>ORbit Cloud (Asia-South)</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
