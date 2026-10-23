import React, { useState, useEffect } from "react";
import {
  Wallet, Clock, TrendingUp, Download, Pencil, Play, RefreshCw,
  Mail, Send, CheckCircle2, AlertCircle, FileText, CheckCheck,
  Calendar, Building2, UserCheck, ShieldCheck
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { C } from "../constants/theme";
import { statusTone, fmtMoney, exportToCSV } from "../utils/helpers";
import { Card, PageHeader, StatCard, Button, Table, Modal, Avatar, Pill } from "../components/ui";
import { useToast } from "../context/ToastContext";
import {
  fetchPayroll,
  updatePayroll,
  markPayrollPaid,
  generatePayroll,
  sendPayslipEmail,
  bulkSendPayslips,
  bulkMarkPayrollPaid,
} from "../api/payrollApi";

export default function PayrollPage() {
  const toast = useToast();
  const [payroll,        setPayroll]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [slip,           setSlip]           = useState(null);
  const [search,         setSearch]         = useState("");
  const [edit,           setEdit]           = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [showGenerate,   setShowGenerate]   = useState(false);
  const [genMonth,       setGenMonth]       = useState("October");
  const [genYear,        setGenYear]        = useState("2026");
  const [generating,     setGenerating]     = useState(false);
  const [selectedMonth,  setSelectedMonth]  = useState("October 2026");
  const [sendingId,      setSendingId]      = useState(null);
  const [bulkSending,    setBulkSending]    = useState(false);
  const [bulkPaying,     setBulkPaying]     = useState(false);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const YEARS  = ["2024", "2025", "2026", "2027", "2028"];

  const loadData = async () => {
    try {
      const res = await fetchPayroll();
      const items = Array.isArray(res) ? res : res?.results || [];
      setPayroll(items);
      // If selectedMonth not present in existing records, check if we should default to latest
      if (items.length > 0) {
        const uniqueMonths = Array.from(new Set(items.map((p) => p.month).filter(Boolean)));
        if (uniqueMonths.includes("October 2026")) {
          setSelectedMonth("October 2026");
        } else if (uniqueMonths.length > 0 && selectedMonth === "October 2026") {
          // If October 2026 doesn't exist yet, pick latest or keep October 2026 for generation
          setSelectedMonth(uniqueMonths[0]);
        }
      }
    } catch (err) {
      console.warn("Payroll fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute available months
  const existingMonths = Array.from(new Set(payroll.map((p) => p.month).filter(Boolean)));
  const allMonthOptions = Array.from(new Set(["October 2026", "September 2026", "July 2026", ...existingMonths]));

  // Month-filtered items
  const monthFiltered = selectedMonth === "All"
    ? payroll
    : payroll.filter((p) => p.month?.toLowerCase() === selectedMonth.toLowerCase());

  // Search filtered items
  const filtered = monthFiltered.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.employeeId || "").toLowerCase().includes(q) ||
      (p.department || "").toLowerCase().includes(q)
    );
  });

  // Month stats & live top calculations
  const totalNet           = monthFiltered.reduce((s, p) => s + (Number(p.net) || 0), 0);
  const totalBasic         = monthFiltered.reduce((s, p) => s + (Number(p.basic) || 0), 0);
  const totalDeductions    = monthFiltered.reduce((s, p) => s + (Number(p.deductions) || 0), 0);
  const paidItems          = monthFiltered.filter((p) => (p.status || "").toLowerCase() === "paid");
  const pendingItems       = monthFiltered.filter((p) => (p.status || "").toLowerCase() !== "paid");
  const paidCount          = paidItems.length;
  const pendingCount       = pendingItems.length;
  const totalPaidAmount    = paidItems.reduce((s, p) => s + (Number(p.net) || 0), 0);
  const totalPendingAmount = pendingItems.reduce((s, p) => s + (Number(p.net) || 0), 0);
  const avgSalary          = monthFiltered.length > 0 ? Math.round(totalNet / monthFiltered.length) : 0;
  const progressPercent    = monthFiltered.length > 0 ? Math.round((paidCount / monthFiltered.length) * 100) : 0;

  // Change payment status for an employee (Paid, Pending, Processed)
  async function handleStatusChange(id, newStatus) {
    // 1. Immediately update local state so top calculations update instantaneously
    setPayroll((list) =>
      list.map((p) => (String(p.id) === String(id) ? { ...p, status: newStatus } : p))
    );
    if (slip && String(slip.id) === String(id)) {
      setSlip((prev) => ({ ...prev, status: newStatus }));
    }
    toast(`Payment marked as ${newStatus}.`, "success");
    window.dispatchEvent(new Event("orbit_notifications_refresh"));

    // 2. Persist to backend
    try {
      if (newStatus === "Paid") {
        await markPayrollPaid(id);
      } else {
        await updatePayroll(id, { status: newStatus });
      }
    } catch (err) {
      console.warn("Backend status update note:", err?.message);
    }
  }

  // Single: mark paid
  async function markPaid(id) {
    await handleStatusChange(id, "Paid");
  }

  // Single: send payslip email to employee
  async function handleSendPayslip(p) {
    if (!p || !p.id) return;
    const recipientEmail = p.email || "the registered employee email";
    setSendingId(p.id);
    try {
      const res = await sendPayslipEmail(p.id);
      toast(
        res?.detail || `Salary payslip for ${p.month} emailed successfully to ${recipientEmail}!`,
        "success"
      );
    } catch (err) {
      toast(
        err?.message || `Failed to send payslip email to ${recipientEmail}.`,
        "error"
      );
    } finally {
      setSendingId(null);
    }
  }

  // Bulk: complete all payments for month
  async function handleBulkMarkPaid() {
    if (selectedMonth === "All") {
      toast("Please select a specific month first to complete payments.", "info");
      return;
    }
    if (pendingCount === 0) {
      toast(`All payments for ${selectedMonth} are already marked as Paid!`, "info");
      return;
    }
    if (!window.confirm(`Complete all ${pendingCount} pending salary payments for ${selectedMonth}?`)) {
      return;
    }

    setBulkPaying(true);
    // 1. Immediately update all records in local state so top calculations update instantaneously
    setPayroll((prev) =>
      prev.map((p) =>
        p.month?.toLowerCase() === selectedMonth.toLowerCase()
          ? { ...p, status: "Paid" }
          : p
      )
    );
    toast(`All ${pendingCount} salary payments for ${selectedMonth} marked as Paid!`, "success");
    window.dispatchEvent(new Event("orbit_notifications_refresh"));

    // 2. Persist to backend
    try {
      await bulkMarkPayrollPaid(selectedMonth);
    } catch (err) {
      console.warn("Backend bulk mark paid note:", err);
    } finally {
      setBulkPaying(false);
    }
  }

  // Bulk: send payslips to all employees for month
  async function handleBulkSendPayslips() {
    if (selectedMonth === "All") {
      toast("Please select a specific month to send payslips for.", "info");
      return;
    }
    if (monthFiltered.length === 0) {
      toast(`No payroll records found for ${selectedMonth}. Please generate payroll first.`, "info");
      return;
    }
    if (!window.confirm(`Email official salary payslips to all ${monthFiltered.length} employees for ${selectedMonth}?`)) {
      return;
    }

    setBulkSending(true);
    try {
      const res = await bulkSendPayslips(selectedMonth);
      toast(
        res?.detail || `Salary payslips sent to ${res?.sent_count || monthFiltered.length} employees for ${selectedMonth}!`,
        "success"
      );
    } catch (err) {
      toast(err?.message || "Failed to send payslips to all employees.", "error");
    } finally {
      setBulkSending(false);
    }
  }

  // Generate / Sync Month Payroll
  async function handleGenerate() {
    const monthStr = `${genMonth} ${genYear}`;
    setGenerating(true);
    try {
      const res = await generatePayroll(monthStr);
      toast(res.detail || `Payroll generated for all active employees for ${monthStr}!`, "success");
      setSelectedMonth(monthStr);
      await loadData();
      setShowGenerate(false);
    } catch (err) {
      toast("Failed to generate payroll: " + (err.message || "Unknown error"), "error");
      console.error("Generate payroll error:", err);
    } finally {
      setGenerating(false);
    }
  }

  // Edit Handlers
  function openEdit(p) {
    setEdit({
      ...p,
      basic:      Number(p.basic)      || 0,
      allowances: Number(p.allowances) || 0,
      deductions: Number(p.deductions) || 0,
    });
  }

  function handleEditChange(field, value) {
    setEdit((prev) => {
      const updated = { ...prev, [field]: value };
      const b = Number(updated.basic) || 0;
      const a = Number(updated.allowances) || 0;
      const d = Number(updated.deductions) || 0;
      updated.net = Math.max(0, b + a - d);
      return updated;
    });
  }

  async function saveEdit() {
    if (!edit) return;
    setSaving(true);
    try {
      const payload = {
        basic:      Number(edit.basic),
        allowances: Number(edit.allowances),
        deductions: Number(edit.deductions),
        net:        Number(edit.net),
      };
      await updatePayroll(edit.id, payload);
      setPayroll((list) =>
        list.map((p) =>
          p.id === edit.id
            ? { ...p, ...payload }
            : p
        )
      );
      toast("Payroll updated successfully", "success");
      setEdit(null);
    } catch (err) {
      toast("Failed to save payroll changes", "error");
      console.error("Payroll update error:", err);
    } finally {
      setSaving(false);
    }
  }

  const ranges = [
    { label: "< 40k",    min: 0,      max: 40000   },
    { label: "40-60k",   min: 40000,  max: 60000   },
    { label: "60-80k",   min: 60000,  max: 80000   },
    { label: "80-100k",  min: 80000,  max: 100000  },
    { label: "> 100k",   min: 100000, max: Infinity },
  ];
  const distData = ranges.map((r) => ({
    label: r.label,
    count: monthFiltered.filter((p) => {
      const netVal = Number(p.net) || 0;
      return netVal >= r.min && netVal < r.max;
    }).length,
  }));

  const inputStyle = {
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 14px",
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    color: C.ink,
    background: C.panel,
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: C.slate, fontFamily: "Inter, sans-serif" }}>
        <RefreshCw size={32} className="spin" style={{ margin: "0 auto 16px", color: C.teal, display: "block" }} />
        <p style={{ fontSize: 16, fontWeight: 600, color: C.ink, margin: "0 0 6px" }}>Loading Payroll Records...</p>
        <span style={{ fontSize: 13 }}>Fetching month-wise salary computations</span>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Admin Payroll"
        subtitle="Manage all employee salaries month-wise, complete payments, and email official payslips"
        action={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              variant="primary"
              icon={Play}
              small
              onClick={() => {
                const parts = selectedMonth !== "All" ? selectedMonth.split(" ") : ["October", "2026"];
                if (parts[0]) setGenMonth(parts[0]);
                if (parts[1]) setGenYear(parts[1]);
                setShowGenerate(true);
              }}
            >
              Generate / Sync Payroll
            </Button>

            {selectedMonth !== "All" && pendingCount > 0 && (
              <Button
                variant="teal"
                icon={bulkPaying ? RefreshCw : CheckCheck}
                small
                disabled={bulkPaying}
                onClick={handleBulkMarkPaid}
                title="Mark all pending salaries for this month as Paid"
              >
                {bulkPaying ? "Processing..." : `Complete All Payments (${pendingCount})`}
              </Button>
            )}

            {selectedMonth !== "All" && monthFiltered.length > 0 && (
              <Button
                variant="outline"
                icon={bulkSending ? RefreshCw : Mail}
                small
                disabled={bulkSending}
                onClick={handleBulkSendPayslips}
                title="Send official payslips to all employees for this month"
              >
                {bulkSending ? "Sending Mails..." : "Email All Payslips"}
              </Button>
            )}

            <Button
              variant="outline"
              icon={Download}
              small
              onClick={() => exportToCSV(filtered.length ? filtered : payroll, `payroll_${selectedMonth.replace(/\s+/g, "_")}.csv`)}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Month Selection Bar & Quick Controls */}
      <Card style={{ padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          {/* Month Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: C.slate, display: "flex", alignItems: "center", gap: 6, marginRight: 4 }}>
              <Calendar size={15} color={C.teal} /> Pay Period:
            </span>
            {allMonthOptions.map((m) => {
              const isSelected = selectedMonth === m;
              const countForMonth = payroll.filter((p) => p.month?.toLowerCase() === m.toLowerCase()).length;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  style={{
                    border: isSelected ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
                    background: isSelected ? `${C.teal}12` : C.panel,
                    color: isSelected ? C.teal : C.slate,
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 12.5,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{m}</span>
                  {countForMonth > 0 && (
                    <span style={{
                      background: isSelected ? C.teal : `${C.slate}20`,
                      color: isSelected ? "#fff" : C.slate,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 10,
                    }}>
                      {countForMonth}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              onClick={() => setSelectedMonth("All")}
              style={{
                border: selectedMonth === "All" ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
                background: selectedMonth === "All" ? `${C.teal}12` : C.panel,
                color: selectedMonth === "All" ? C.teal : C.slate,
                fontWeight: selectedMonth === "All" ? 700 : 500,
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12.5,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              All Months
            </button>
          </div>

          {/* Quick Notice */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5, color: C.slate, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#059669", display: "inline-block" }}></span>
              Paid: <strong style={{ color: "#059669" }}>{paidCount}</strong> ({fmtMoney(totalPaidAmount)})
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#d97706", display: "inline-block" }}></span>
              Pending: <strong style={{ color: "#d97706" }}>{pendingCount}</strong> ({fmtMoney(totalPendingAmount)})
            </span>
            <span style={{ borderLeft: `1px solid ${C.border}`, height: 16, margin: "0 2px" }}></span>
            <span style={{ fontWeight: 700, color: C.ink }}>
              Total: {monthFiltered.length} Staff ({fmtMoney(totalNet)})
            </span>
          </div>
        </div>
      </Card>

      {/* Overview StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 14 }}>
        <StatCard
          label={`Total Net Payroll (${selectedMonth})`}
          value={fmtMoney(totalNet)}
          delta={`${monthFiltered.length} employees on roster`}
          positive
          icon={Wallet}
          accent={C.teal}
        />
        <StatCard
          label="Paid Salaries"
          value={fmtMoney(totalPaidAmount)}
          delta={`${paidCount} of ${monthFiltered.length} paid (${progressPercent}%)`}
          positive={paidCount > 0}
          icon={CheckCircle2}
          accent="#059669"
        />
        <StatCard
          label="Pending Payments"
          value={fmtMoney(totalPendingAmount)}
          delta={pendingCount === 0 ? "Zero pending — All Paid ✓" : `${pendingCount} staff awaiting payment`}
          positive={pendingCount === 0}
          icon={Clock}
          accent={pendingCount === 0 ? "#059669" : C.amber}
        />
        <StatCard
          label="Average Take-Home"
          value={fmtMoney(avgSalary)}
          delta="Per employee in pay cycle"
          positive
          icon={TrendingUp}
          accent={C.blue}
        />
      </div>

      {/* Dynamic Disbursal Progress Banner */}
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>Month Disbursal Progress:</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: progressPercent === 100 ? "#059669" : C.teal,
                background: progressPercent === 100 ? "#ecfdf5" : `${C.teal}15`,
                padding: "2px 8px",
                borderRadius: 12,
              }}
            >
              {progressPercent}% Complete
            </span>
            <span style={{ fontSize: 12, color: C.slate }}>
              • {paidCount} Paid, {pendingCount} Pending
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: C.slate }}>
            Disbursed: <strong style={{ color: "#059669" }}>{fmtMoney(totalPaidAmount)}</strong> / Total: <strong style={{ color: C.ink }}>{fmtMoney(totalNet)}</strong>
          </div>
        </div>
        <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: progressPercent === 100 ? "#059669" : "linear-gradient(90deg, #1F8A70, #10b981)",
              transition: "width 0.4s ease",
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* Salary Distribution Chart */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <p style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: C.ink, margin: "0 0 2px" }}>
              Net Salary Distribution ({selectedMonth})
            </p>
            <p style={{ fontSize: 12, color: C.slate, margin: 0 }}>
              Breakdown of take-home pay across salary brackets
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.teal, background: `${C.teal}10`, padding: "4px 10px", borderRadius: 12 }}>
            Active Period: {selectedMonth}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={distData} barSize={36}>
            <CartesianGrid stroke={C.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: "Inter" }} stroke="transparent" />
            <YAxis tick={{ fontSize: 12, fontFamily: "Inter" }} stroke="transparent" allowDecimals={false} />
            <Tooltip contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {distData.map((_, i) => <Cell key={i} fill={[C.teal, C.blue, C.amber, C.coral, "#6B46A8"][i % 5]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Search Input Bar */}
      <Card style={{ padding: "12px 18px", marginBottom: 16 }}>
        <input
          placeholder="Search by employee name, registered email, department, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            fontFamily: "Inter, sans-serif",
            fontSize: 13.5,
            width: "100%",
            color: C.ink,
            background: "transparent",
          }}
        />
      </Card>

      {/* Main Payroll Table */}
      <Card style={{ padding: 0 }}>
        <Table
          columns={[
            "Employee & Email",
            "Department",
            "Month",
            "Basic Pay",
            "Allowances",
            "Deductions",
            "Net Salary",
            "Status",
            "Actions",
          ]}
          rows={filtered}
          renderRow={(p) => {
            const isSending = sendingId === p.id;
            const empEmail = p.email || "--";
            const empCode = p.employeeId || `E${p.employee || p.id}`;
            const isPaid = p.status === "Paid";

            return (
              <tr key={p.id} className="hoverable" style={{ borderBottom: `1px solid ${C.border}` }}>
                {/* Employee Info */}
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={p.name} size={34} />
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <strong style={{ color: C.ink, fontSize: 13.5, fontWeight: 700 }}>{p.name}</strong>
                        <span style={{
                          fontSize: 10.5,
                          fontFamily: "Courier New, monospace",
                          background: `${C.slate}15`,
                          color: C.slate,
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontWeight: 700,
                        }}>
                          {empCode}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.slate, fontSize: 11.5, marginTop: 2 }}>
                        <Mail size={11} color={C.teal} />
                        <span style={{ color: C.slate }}>{empEmail}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td style={{ padding: "13px 16px", color: C.slate, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: C.ink }}>{p.department || "Operations"}</div>
                  {p.role && <div style={{ fontSize: 11.5, color: C.slate }}>{p.role}</div>}
                </td>

                {/* Month */}
                <td style={{ padding: "13px 16px", fontSize: 12.5, color: C.ink, fontWeight: 600 }}>
                  <span style={{ background: `${C.teal}10`, color: C.teal, padding: "3px 8px", borderRadius: 6 }}>
                    {p.month}
                  </span>
                </td>

                {/* Basic Pay */}
                <td style={{ padding: "13px 16px", color: C.ink, fontSize: 13, fontWeight: 500 }}>
                  {fmtMoney(p.basic)}
                </td>

                {/* Allowances */}
                <td style={{ padding: "13px 16px", color: C.slate, fontSize: 13 }}>
                  {fmtMoney(p.allowances)}
                </td>

                {/* Deductions */}
                <td style={{ padding: "13px 16px", color: Number(p.deductions) > 0 ? C.coral : C.slate, fontSize: 13, fontWeight: 500 }}>
                  {Number(p.deductions) > 0 ? `-${fmtMoney(p.deductions)}` : fmtMoney(0)}
                </td>

                {/* Net Salary */}
                <td style={{ padding: "13px 16px", fontWeight: 800, color: C.teal, fontSize: 14, fontFamily: "Sora, sans-serif" }}>
                  {fmtMoney(p.net)}
                </td>

                {/* Status Column with Interactive Select */}
                <td style={{ padding: "13px 16px" }}>
                  <select
                    value={p.status || "Pending"}
                    onChange={(e) => handleStatusChange(p.id, e.target.value)}
                    title="Change payment status"
                    style={{
                      padding: "5px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1.5px solid ${(p.status || "").toLowerCase() === "paid" ? "#10b981" : "#f59e0b"}`,
                      background: (p.status || "").toLowerCase() === "paid" ? "#ecfdf5" : "#fef3c7",
                      color: (p.status || "").toLowerCase() === "paid" ? "#047857" : "#92400e",
                      cursor: "pointer",
                      outline: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <option value="Paid">✓ Paid</option>
                    <option value="Pending">⏳ Pending</option>
                    <option value="Processed">⚙ Processed</option>
                  </select>
                </td>

                {/* Actions */}
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Send Payslip Button */}
                    <button
                      onClick={() => handleSendPayslip(p)}
                      disabled={isSending}
                      title={`Send salary payslip directly to ${empEmail}`}
                      style={{
                        background: isSending ? `${C.teal}30` : `${C.teal}15`,
                        border: `1px solid ${C.teal}40`,
                        color: C.teal,
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        cursor: isSending ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isSending ? (
                        <>
                          <RefreshCw size={13} className="spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Send Payslip</span>
                        </>
                      )}
                    </button>

                    {/* Mark Paid / Complete Payment Button */}
                    {!isPaid ? (
                      <button
                        onClick={() => markPaid(p.id)}
                        title="Mark payment as complete"
                        style={{
                          background: "#05966915",
                          border: "1px solid #05966940",
                          color: "#059669",
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Paid</span>
                      </button>
                    ) : (
                      <span
                        style={{
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          color: "#059669",
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Paid ✓</span>
                      </span>
                    )}

                    {/* View Slip */}
                    <Button small variant="ghost" onClick={() => setSlip(p)}>
                      View Slip
                    </Button>

                    {/* Edit */}
                    <Button small variant="ghost" onClick={() => openEdit(p)} icon={Pencil}>
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            );
          }}
        />

        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: C.slate }}>
            <FileText size={38} color={C.slate} style={{ margin: "0 auto 12px", opacity: 0.5, display: "block" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: C.ink, margin: "0 0 6px" }}>
              No payroll records found for {selectedMonth}
            </p>
            <p style={{ fontSize: 13, maxWidth: 440, margin: "0 auto 16px", lineHeight: 1.5 }}>
              Click <strong>"Generate / Sync Payroll"</strong> above to calculate and set up monthly payroll for all active employees.
            </p>
            <Button
              variant="teal"
              small
              icon={Play}
              onClick={() => {
                const parts = selectedMonth !== "All" ? selectedMonth.split(" ") : ["October", "2026"];
                if (parts[0]) setGenMonth(parts[0]);
                if (parts[1]) setGenYear(parts[1]);
                setShowGenerate(true);
              }}
            >
              Generate for {selectedMonth !== "All" ? selectedMonth : "October 2026"}
            </Button>
          </div>
        )}
      </Card>

      {/* View Payslip Modal */}
      {slip && (
        <Modal title={`Payslip — ${slip.name}`} onClose={() => setSlip(null)} width={520}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, background: `${C.panel}`, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={slip.name} size={46} />
                <div>
                  <div style={{ fontWeight: 800, color: C.ink, fontFamily: "Sora, sans-serif", fontSize: 16 }}>{slip.name}</div>
                  <div style={{ color: C.slate, fontSize: 12.5, marginTop: 2 }}>
                    {slip.department || "General"} · {slip.employeeId || `E${slip.employee || slip.id}`}
                  </div>
                </div>
              </div>
              <Pill tone={statusTone(slip.status)}>
                {slip.status === "Paid" ? "PAID · COMPLETED" : "PENDING"}
              </Pill>
            </div>

            {/* Email Dispatch Notice */}
            <div style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}25`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <Mail size={14} color={C.teal} />
              <span style={{ color: C.slate }}>
                Destination Email: <strong style={{ color: C.ink }}>{slip.email || "Not specified"}</strong>
              </span>
            </div>

            {/* Pay Period & Reference */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5, marginBottom: 14, color: C.slate }}>
              <div>Pay Period: <strong style={{ color: C.ink }}>{slip.month}</strong></div>
              <div>Reference: <strong style={{ color: C.ink, fontFamily: "Courier New, monospace" }}>PAY-{String(slip.id).padStart(5, "0")}</strong></div>
              <div>Bank: <strong style={{ color: C.ink }}>{slip.bank_name || "Registered Bank"}</strong></div>
              <div>Account: <strong style={{ color: C.ink }}>{slip.account_no || "--"}</strong></div>
            </div>

            {/* Salary Breakdown Items */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
              {[
                ["Basic Salary", slip.basic, false],
                ["Allowances", slip.allowances, false],
                ["Leave Deductions", slip.deductions, true],
              ].map(([label, val, isDeduction]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontFamily: "Inter, sans-serif", fontSize: 13.5 }}>
                  <span style={{ color: C.slate }}>{label}</span>
                  <span style={{ color: isDeduction && Number(val) > 0 ? C.coral : C.ink, fontWeight: 600 }}>
                    {isDeduction && Number(val) > 0 ? "-" : ""}{fmtMoney(val)}
                  </span>
                </div>
              ))}
            </div>

            {/* Net Total */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              paddingTop: 12,
              borderTop: `2px solid ${C.teal}`,
              background: `${C.teal}08`,
              borderRadius: 8,
              padding: "12px 14px",
            }}>
              <div>
                <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 14, color: C.ink }}>
                  NET SALARY PAYABLE
                </span>
                <div style={{ fontSize: 11, color: C.slate }}>Full take-home amount</div>
              </div>
              <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 20, color: C.teal }}>
                {fmtMoney(slip.net)}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {slip.status === "Pending" && (
                <Button
                  variant="teal"
                  icon={CheckCircle2}
                  onClick={() => markPaid(slip.id)}
                >
                  Mark as Paid
                </Button>
              )}
              <Button
                variant="primary"
                icon={sendingId === slip.id ? RefreshCw : Send}
                disabled={sendingId === slip.id}
                onClick={async () => {
                  await handleSendPayslip(slip);
                }}
              >
                {sendingId === slip.id ? "Sending..." : "Send to Employee Email"}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setSlip(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Edit Payroll Modal */}
      {edit && (
        <Modal title="Edit Payroll" onClose={() => setEdit(null)} width={480}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <Avatar name={edit.name} size={48} />
            <div>
              <div style={{ fontWeight: 700, color: C.ink, fontFamily: "Sora, sans-serif", fontSize: 16 }}>{edit.name}</div>
              <div style={{ color: C.slate, fontSize: 13 }}>{edit.department} · {edit.month}</div>
              <div style={{ color: C.teal, fontSize: 12 }}>{edit.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, display: "block" }}>Basic Pay (₹)</label>
              <input type="number" value={edit.basic} onChange={(e) => handleEditChange("basic", e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.teal} onBlur={(e) => e.target.style.borderColor = C.border} />
            </div>
            <div>
              <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, display: "block" }}>Allowances (₹)</label>
              <input type="number" value={edit.allowances} onChange={(e) => handleEditChange("allowances", e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.teal} onBlur={(e) => e.target.style.borderColor = C.border} />
            </div>
            <div>
              <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, display: "block" }}>Deductions (₹)</label>
              <input type="number" value={edit.deductions} onChange={(e) => handleEditChange("deductions", e.target.value)} style={inputStyle} onFocus={(e) => e.target.style.borderColor = C.coral} onBlur={(e) => e.target.style.borderColor = C.border} />
            </div>
            <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 14, color: C.ink }}>Net Pay</span>
              <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 20, color: C.teal }}>{fmtMoney(edit.net)}</span>
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.slate, marginTop: -8 }}>
              Net Pay = Basic + Allowances − Deductions (auto-calculated)
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
            <Button variant="teal" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </Modal>
      )}

      {/* Generate / Synchronize Monthly Payroll Modal */}
      {showGenerate && (
        <Modal title="Generate / Synchronize Monthly Payroll" onClose={() => setShowGenerate(false)} width={480}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.slate, marginBottom: 18, lineHeight: 1.6 }}>
            This calculates and sets up payroll for <strong>all active employees</strong> for the selected month.
          </div>

          <div style={{ background: `${C.teal}08`, border: `1px solid ${C.teal}20`, borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontFamily: "Inter, sans-serif", fontSize: 12.5, color: C.ink, lineHeight: 1.7 }}>
            • <strong>Basic Pay</strong> = Employee's base salary from profile<br />
            • <strong>Leave Deductions</strong> = (Salary ÷ 30) × Approved leave days in month<br />
            • <strong>Net Take-Home</strong> = Basic + Allowances − Deductions<br />
            • Syncs all users and generates payslips ready to send!
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <div>
              <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, display: "block" }}>Month</label>
              <select value={genMonth} onChange={(e) => setGenMonth(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, display: "block" }}>Year</label>
              <select value={genYear} onChange={(e) => setGenYear(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button variant="teal" icon={generating ? RefreshCw : Play} onClick={handleGenerate} disabled={generating}>
              {generating ? "Processing..." : `Process for ${genMonth} ${genYear}`}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
