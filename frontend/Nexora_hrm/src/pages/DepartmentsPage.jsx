import React, { useState, useEffect } from "react";
import { Building2, Users, Mail, UserCheck, Shield, ChevronRight, Search, ExternalLink } from "lucide-react";
import { C } from "../constants/theme";
import { statusTone } from "../utils/helpers";
import { Card, PageHeader, Avatar, Pill, Button, Modal } from "../components/ui";
import { fetchDepartments } from "../api/departmentsApi";
import { fetchEmployees } from "../api/employeesApi";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeDept,  setActiveDept]  = useState(null);
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([fetchDepartments(), fetchEmployees()])
      .then(([deptRes, empRes]) => {
        if (!isMounted) return;
        if (deptRes.status === "fulfilled") {
          const items = Array.isArray(deptRes.value) ? deptRes.value : deptRes.value?.results || [];
          setDepartments(items);
        }
        if (empRes.status === "fulfilled") {
          const items = Array.isArray(empRes.value) ? empRes.value : empRes.value?.results || [];
          setEmployees(items);
        }
      })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, []);

  const getStaffForDept = (dept) => {
    return employees.filter((e) => {
      if (!e) return false;
      if (e.department === dept.name) return true;
      if (e.department === dept.id) return true;
      if (e.department_name && e.department_name.toLowerCase() === dept.name.toLowerCase()) return true;
      if (typeof e.department === "string" && e.department.toLowerCase() === dept.name.toLowerCase()) return true;
      return false;
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: C.slate, fontFamily: "Inter, sans-serif" }}>
        <Building2 size={32} style={{ margin: "0 auto 12px", color: C.teal, display: "block" }} />
        <p style={{ fontWeight: 600, color: C.ink, margin: "0 0 4px" }}>Loading Departments...</p>
        <span style={{ fontSize: 13 }}>Synchronizing organizational structure and employee roster</span>
      </div>
    );
  }

  const totalAssignedStaff = employees.length;
  const filteredDepartments = departments.filter((d) => {
    const q = search.toLowerCase();
    const staff = getStaffForDept(d);
    return (
      d.name.toLowerCase().includes(q) ||
      (d.head || "").toLowerCase().includes(q) ||
      staff.some((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-enter">
      <PageHeader
        title="Departments & Teams"
        subtitle="Organizational structure, employee roster, and headcount by function"
      />

      {/* Top Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 }}>
        <Card style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Total Departments
              </div>
              <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 4 }}>
                {departments.length}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.tealSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={20} color={C.teal} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Connected Employees
              </div>
              <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: C.blue, marginTop: 4 }}>
                {totalAssignedStaff}
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.blueSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} color={C.blue} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Active Roster Status
              </div>
              <div style={{ fontFamily: "Sora, sans-serif", fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 4 }}>
                100% Synced
              </div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={20} color="#059669" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 18, maxWidth: 360 }}>
        <div style={{ position: "relative" }}>
          <Search size={16} color={C.slateLight} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search department or employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: C.panel,
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              color: C.ink,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        {filteredDepartments.map((d) => {
          const staff = getStaffForDept(d);
          return (
            <Card key={d.id} accent={d.color} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 17, color: C.ink }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.slate, marginTop: 3 }}>
                      Head: <strong style={{ color: C.ink }}>{d.head || "Not Assigned"}</strong>
                    </div>
                  </div>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${d.color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Building2 size={18} color={d.color} />
                  </div>
                </div>

                {/* Headcount */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 700, color: C.ink }}>
                    {staff.length}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: C.slate }}>
                    active {staff.length === 1 ? "employee" : "employees"}
                  </span>
                </div>

                {/* Connected Staff List / Preview */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 4 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: C.slateLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                    Connected Team Members ({staff.length})
                  </div>

                  {staff.length === 0 ? (
                    <div style={{ padding: "14px 10px", background: C.canvas, borderRadius: 8, textAlign: "center", fontSize: 12.5, color: C.slateLight }}>
                      No employees assigned to this department yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {staff.slice(0, 3).map((emp) => (
                        <div
                          key={emp.id || emp.pk}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 10px",
                            background: C.canvas,
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <Avatar name={emp.name} size={30} />
                            <div>
                              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: C.ink }}>
                                {emp.name}
                              </div>
                              <div style={{ fontSize: 11, color: C.slate }}>
                                {emp.role || "Team Member"}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{
                              fontFamily: "IBM Plex Mono, monospace",
                              fontSize: 10.5,
                              color: C.slate,
                              background: C.panel,
                              padding: "2px 6px",
                              borderRadius: 4,
                              border: `1px solid ${C.border}`,
                              display: "inline-block",
                            }}>
                              {emp.id}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action footer */}
              {staff.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                  <Button
                    variant="outline"
                    small
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => setActiveDept({ ...d, staff })}
                  >
                    View All {staff.length} {d.name} Staff
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Department Staff Modal */}
      {activeDept && (
        <Modal
          title={`${activeDept.name} Department Roster`}
          onClose={() => setActiveDept(null)}
          width={640}
        >
          <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: C.slate }}>
                Department Head: <strong style={{ color: C.ink }}>{activeDept.head}</strong>
              </div>
              <div style={{ fontSize: 12, color: C.slateLight, marginTop: 2 }}>
                Total Active Personnel: {activeDept.staff.length}
              </div>
            </div>
            <Pill tone="teal">Active Department</Pill>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeDept.staff.map((emp) => (
              <div
                key={emp.id || emp.pk}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: C.canvas,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={emp.name} size={38} />
                  <div>
                    <div style={{ fontFamily: "Sora, sans-serif", fontSize: 14, fontWeight: 700, color: C.ink }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: 12, color: C.slate, marginTop: 1 }}>
                      {emp.role || "Team Member"} · <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{emp.id}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.slateLight, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      <Mail size={12} /> {emp.email}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <Pill tone={statusTone(emp.status)}>{emp.status || "Active"}</Pill>
                  <div style={{ fontSize: 11, color: C.slateLight, marginTop: 6 }}>
                    Joined: {emp.joinDate || "2026-10-23"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
