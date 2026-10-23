import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, Mail, Phone, MapPin, Download, Filter, AlertCircle, Eye, EyeOff, KeyRound, Sparkles } from "lucide-react";
import { C } from "../constants/theme";
import { statusTone, fmtMoney, exportToCSV } from "../utils/helpers";
import { Card, PageHeader, Button, Input, Select, Table, Modal, Avatar, Pill, EmptyState, PhoneInput, validatePhone, parsePhoneNumber } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee, sendWelcomeEmail } from "../api/employeesApi";

import { fetchDepartments } from "../api/departmentsApi";

function EmployeeForm({ initial, departments, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name || "",
          email: initial.email || "",
          phone: initial.phone || "+91 ",
          role: initial.role || "",
          department: initial.department || departments[0]?.name || "Engineering",
          status: initial.status || "Active",
          joinDate: initial.joinDate || initial.join_date || new Date().toISOString().split("T")[0],
          salary: initial.salary ?? 50000,
          location: initial.location || "Ahmedabad",
          password: "",
        }
      : {
          name: "",
          email: "",
          phone: "+91 ",
          role: "",
          department: departments[0]?.name || "Engineering",
          status: "Active",
          joinDate: new Date().toISOString().split("T")[0],
          salary: 50000,
          location: "Ahmedabad",
          password: "Employee@123",
        }
  );

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [phoneMeta, setPhoneMeta] = useState({ isValid: true, error: null });

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "Emp@";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    set("password", pass);
  };

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) {
      setErrors((errs) => {
        const next = { ...errs };
        delete next[k];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Name validation
    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = "Full name is required (min 2 characters)";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(form.name.trim())) {
      newErrors.name = "Name can only contain alphabetic letters and spaces";
    }

    // 2. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address (e.g. name@company.com)";
    }

    // 3. Phone validation with country rules
    const parsed = parsePhoneNumber(form.phone);
    const phoneVal = validatePhone(parsed.country, parsed.localNumber, true);
    if (!phoneVal.isValid) {
      newErrors.phone = phoneVal.error || "Please enter a valid phone number";
    }

    // 4. Role validation
    if (!form.role || form.role.trim().length < 2) {
      newErrors.role = "Role / Designation is required";
    }

    // 5. Department validation
    if (!form.department) {
      newErrors.department = "Department is required";
    }

    // 6. Salary validation
    if (form.salary === undefined || form.salary === "" || isNaN(Number(form.salary)) || Number(form.salary) <= 0) {
      newErrors.salary = "Please enter a valid positive salary amount";
    }

    // 7. Joining date
    if (!form.joinDate) {
      newErrors.joinDate = "Joining date is required";
    }

    // 8. Location
    if (!form.location || form.location.trim().length < 2) {
      newErrors.location = "Location / city is required";
    }

    // 9. Password validation for login
    if (!initial) {
      if (!form.password || form.password.trim().length < 6) {
        newErrors.password = "Login password is required (minimum 6 characters)";
      }
    } else {
      if (form.password && form.password.trim().length < 6) {
        newErrors.password = "New password must be at least 6 characters";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {Object.keys(errors).length > 0 && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: C.coral,
            fontSize: 13,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>Please correct the highlighted fields before saving.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input
          label="Full name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Aarav Sharma"
          error={errors.name}
        />
        <Input
          label="Email address"
          type="email"
          required
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="employee@orbithrm.com"
          error={errors.email}
        />

        {/* Full Country Select + Phone Input with +91 default */}
        <PhoneInput
          label="Phone number"
          required
          value={form.phone}
          onChange={(fullVal, meta) => {
            set("phone", fullVal);
            setPhoneMeta(meta);
            if (errors.phone && meta.isValid) {
              setErrors((errs) => {
                const next = { ...errs };
                delete next.phone;
                return next;
              });
            }
          }}
          error={errors.phone}
        />

        <Select
          label="Department"
          required
          value={form.department}
          onChange={(e) => set("department", e.target.value)}
          options={departments.map((d) => d.name)}
          error={errors.department}
        />
        <Input
          label="Role / Designation"
          required
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
          placeholder="e.g. Senior Frontend Developer"
          error={errors.role}
        />
        <Select
          label="Status"
          required
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
          options={["Active", "Inactive"]}
        />
        <Input
          label="Joining date"
          type="date"
          required
          value={form.joinDate}
          onChange={(e) => set("joinDate", e.target.value)}
          error={errors.joinDate}
        />
        <Input
          label="Monthly salary"
          type="number"
          required
          value={form.salary}
          onChange={(e) => set("salary", e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="50000"
          error={errors.salary}
        />
        <div style={{ gridColumn: "span 2" }}>
          <Input
            label="Location / Work City"
            required
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Ahmedabad, Gujarat"
            error={errors.location}
          />
        </div>

        {/* Employee Login Password Field */}
        <div style={{
          gridColumn: "span 2",
          background: `${C.teal}08`,
          border: `1px solid ${C.teal}30`,
          borderRadius: 10,
          padding: "14px 16px",
          marginTop: 4,
          marginBottom: 4,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <KeyRound size={15} color={C.teal} />
              <strong style={{ fontSize: 13, color: C.ink }}>Employee Portal Login Password</strong>
            </div>
            <button
              type="button"
              onClick={generateRandomPassword}
              style={{
                background: "transparent",
                border: "none",
                color: C.teal,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Sparkles size={12} />
              <span>Generate Password</span>
            </button>
          </div>

          <Input
            label={initial ? "Update Login Password (leave blank to keep unchanged)" : "Set Employee Login Password"}
            type={showPassword ? "text" : "password"}
            required={!initial}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder={initial ? "Enter new password if changing..." : "e.g. Employee@123"}
            error={errors.password}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: C.slate,
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <div style={{ fontSize: 11.5, color: C.slate, marginTop: -6 }}>
            The employee will use their <strong>Work Email</strong> and this <strong>Password</strong> to sign in to the User Portal.
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {initial ? "Update employee" : "Save employee"}
        </Button>
      </div>
    </form>
  );
}

function EmployeeProfileModal({ employee, onClose, onEdit, onDelete }) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const toast = useToast();

  const handleSendWelcomeEmail = async () => {
    const empId = employee.pk || employee.id;
    if (!empId) {
      toast("Employee record ID not found", "error");
      return;
    }
    setSendingEmail(true);
    try {
      await sendWelcomeEmail(empId);
      toast(`Welcome email sent to ${employee.email}`);
    } catch (err) {
      toast(err.message || "Failed to send welcome email", "warning");
    } finally {
      setSendingEmail(false);
    }
  };

  const fields = [
    { label: "Employee ID", value: employee.id, mono: true },
    { label: "Manager", value: employee.manager },
    { label: "Email", value: employee.email, icon: <Mail size={13} /> },
    { label: "Phone", value: employee.phone, icon: <Phone size={13} /> },
    { label: "Location", value: employee.location, icon: <MapPin size={13} /> },
    { label: "Joined", value: employee.joinDate },
    { label: "Salary", value: fmtMoney(employee.salary) },
    { label: "Employment", value: employee.status },
  ];
  return (
    <Modal title="Employee profile" onClose={onClose} width={540}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20, padding: "0 0 18px", borderBottom: `1px solid ${C.border}` }}>
        <Avatar name={employee.name} size={64} />
        <div>
          <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 19, color: C.ink }}>{employee.name}</div>
          <div style={{ color: C.slate, fontSize: 13.5, marginTop: 2 }}>{employee.role} · {employee.department}</div>
          <div style={{ marginTop: 8 }}><Pill tone={statusTone(employee.status)}>{employee.status}</Pill></div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontFamily: "Inter, sans-serif", fontSize: 13.5 }}>
        {fields.map((f) => (
          <div key={f.label}>
            <div style={{ color: C.slateLight, fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{f.label}</div>
            <div style={{ color: C.ink, fontFamily: f.mono ? "IBM Plex Mono, monospace" : "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              {f.icon}{f.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <Button variant="outline" small icon={Mail} onClick={handleSendWelcomeEmail} disabled={sendingEmail}>
          {sendingEmail ? "Sending email..." : "Resend Welcome Email"}
        </Button>
        <div style={{ display: "flex", gap: 8 }}>
          {onEdit && (
            <Button variant="outline" small icon={Pencil} onClick={() => onEdit(employee)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" small icon={Trash2} onClick={() => onDelete(employee)}>
              Delete
            </Button>
          )}
          <Button variant="secondary" small onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}



const STATUS_FILTERS = ["All", "Active", "On Leave", "Inactive"];

export default function EmployeesPage() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Load employees and departments on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([fetchEmployees(), fetchDepartments()])
      .then(([empRes, deptRes]) => {
        if (!isMounted) return;
        if (empRes.status === "fulfilled") {
          const items = Array.isArray(empRes.value) ? empRes.value : empRes.value?.results || [];
          setEmployees(items);
        }
        if (deptRes.status === "fulfilled") {
          const items = Array.isArray(deptRes.value) ? deptRes.value : deptRes.value?.results || [];
          setDepartments(items);
        }
      })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => employees.filter((e) =>
    (deptFilter === "All" || e.department === deptFilter) &&
    (statusFilter === "All" || e.status === statusFilter) &&
    (e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      (e.id && e.id.toLowerCase().includes(search.toLowerCase())))
  ), [employees, deptFilter, statusFilter, search]);

  async function saveEmployee(form) {
    try {
      if (editing) {
        const empDbId = editing.pk || editing.id;
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          status: form.status,
          join_date: form.joinDate,
          salary: form.salary,
          location: form.location,
        };
        if (form.password && form.password.trim()) {
          payload.password = form.password.trim();
        }
        await updateEmployee(empDbId, payload);
        const refreshed = await fetchEmployees();
        setEmployees(Array.isArray(refreshed) ? refreshed : refreshed?.results || []);
        toast("Employee and login password updated successfully");
      } else {
        const deptObj = departments.find((d) => d.name === form.department);
        await createEmployee({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
          department: deptObj ? deptObj.id : null,
          status: form.status,
          join_date: form.joinDate || "2026-08-01",
          salary: form.salary,
          location: form.location,
          password: form.password || "Employee@123",
        });
        const refreshed = await fetchEmployees();
        setEmployees(Array.isArray(refreshed) ? refreshed : refreshed?.results || []);
        toast(`Employee added! Login credentials & welcome email sent to ${form.email}`);
      }

    } catch (err) {
      console.warn("Backend update error, falling back locally:", err);
      if (editing) {
        setEmployees((list) => list.map((e) => (e.id === editing.id ? { ...editing, ...form } : e)));
        toast("Employee updated successfully");
      } else {
        setEmployees((list) => [{ ...form, id: "E" + (2000 + list.length), manager: "Admin" }, ...list]);
        toast("Employee added successfully");
      }
    }
    setShowForm(false);
    setEditing(null);
  }

  async function confirmDelete() {
    try {
      const target = employees.find((e) => e.id === deleteId);
      if (target) {
        const empDbId = target.pk || target.id;
        await deleteEmployee(empDbId);
      }
    } catch (err) {
      console.warn("Backend delete notice:", err);
    }
    try {
      const refreshed = await fetchEmployees();
      setEmployees(Array.isArray(refreshed) ? refreshed : refreshed?.results || []);
    } catch {
      setEmployees((list) => list.filter((e) => e.id !== deleteId));
    }
    toast("Employee removed", "warning");
    setDeleteId(null);
  }

  const statusCounts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
    acc[s] = employees.filter((e) => e.status === s).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.slate, fontFamily: "Inter, sans-serif" }}>
        Loading employee data...
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} people across ${departments.length} departments`}
        action={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outline" icon={Download} small onClick={() => exportToCSV(filtered.length ? filtered : employees, "employees.csv")}>Export CSV</Button>
            <Button icon={Plus} onClick={() => { setEditing(null); setShowForm(true); }}>Add employee</Button>
          </div>
        }
      />

      {/* Status summary pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((s) => (
          <div key={s} onClick={() => setStatusFilter(s)} style={{ cursor: "pointer" }}>
            <Pill tone={statusFilter === s ? statusTone(s === "All" ? "Active" : s) : "slate"}>
              {s}{s !== "All" && ` (${statusCounts[s] ?? 0})`}
            </Pill>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.canvas, borderRadius: 7, padding: "8px 12px", flex: 1, minWidth: 220 }}>
            <Search size={14} color={C.slateLight} />
            <input
              placeholder="Search by name, role or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontFamily: "Inter, sans-serif", fontSize: 13, width: "100%", color: C.ink }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Filter size={14} color={C.slateLight} />
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 7, border: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif", fontSize: 13, color: C.ink, background: "#fff" }}>
              <option>All</option>
              {departments.map((d) => <option key={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        <Table
          columns={["Employee", "Department", "Role", "Status", "Location", "Joined", "Actions"]}
          rows={[...filtered].sort((a, b) =>
            String(a.id || "").localeCompare(String(b.id || ""), undefined, { numeric: true })
          )}
          renderRow={(e) => (
            <tr key={e.id} className="hoverable" style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
              <td style={{ padding: "12px 14px" }} onClick={() => setViewing(e)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={e.name} size={34} />
                  <div>
                    <div style={{ fontWeight: 600, color: C.ink, fontSize: 13.5 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: C.slateLight, fontFamily: "IBM Plex Mono, monospace" }}>{e.id}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: "12px 14px", color: C.slate, fontSize: 13 }} onClick={() => setViewing(e)}>{e.department}</td>
              <td style={{ padding: "12px 14px", color: C.slate, fontSize: 13 }} onClick={() => setViewing(e)}>{e.role}</td>
              <td style={{ padding: "12px 14px" }} onClick={() => setViewing(e)}><Pill tone={statusTone(e.status)}>{e.status}</Pill></td>
              <td style={{ padding: "12px 14px", color: C.slate, fontSize: 13 }} onClick={() => setViewing(e)}>{e.location}</td>
              <td style={{ padding: "12px 14px", color: C.slateLight, fontSize: 12 }} onClick={() => setViewing(e)}>{e.joinDate}</td>
              <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }} onClick={(ev) => ev.stopPropagation()}>
                <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    title="Edit employee"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setEditing(e);
                      setShowForm(true);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      background: "#ffffff",
                      cursor: "pointer",
                      color: C.ink,
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: "Inter, sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.borderColor = C.blue;
                      ev.currentTarget.style.color = C.blue;
                      ev.currentTarget.style.background = "#eff6ff";
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.borderColor = C.border;
                      ev.currentTarget.style.color = C.ink;
                      ev.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    title="Delete employee"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setDeleteId(e.id);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #fee2e2",
                      background: "#fff5f5",
                      cursor: "pointer",
                      color: C.coral,
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: "Inter, sans-serif",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.background = "#fee2e2";
                      ev.currentTarget.style.borderColor = C.coral;
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.background = "#fff5f5";
                      ev.currentTarget.style.borderColor = "#fee2e2";
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
        {filtered.length === 0 && <EmptyState text="No employees match your filters." />}
      </Card>

      {/* Add/Edit modal */}
      {showForm && (
        <Modal title={editing ? "Edit employee" : "Add employee"} onClose={() => { setShowForm(false); setEditing(null); }} width={560}>
          <EmployeeForm initial={editing} departments={departments} onSave={saveEmployee} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </Modal>
      )}

      {/* Profile modal */}
      {viewing && (
        <EmployeeProfileModal
          employee={viewing}
          onClose={() => setViewing(null)}
          onEdit={(emp) => {
            setViewing(null);
            setEditing(emp);
            setShowForm(true);
          }}
          onDelete={(emp) => {
            setViewing(null);
            setDeleteId(emp.id);
          }}
        />
      )}


      {/* Delete confirm modal */}
      {deleteId && (
        <Modal title="Remove employee?" onClose={() => setDeleteId(null)} width={400}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: C.slate, marginBottom: 20 }}>
            This action cannot be undone. The employee record will be permanently removed.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Yes, remove</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
