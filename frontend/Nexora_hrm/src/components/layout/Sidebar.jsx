import React from "react";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { C, ADMIN_NAV, USER_NAV } from "../../constants/theme";

export default function Sidebar({ page, setPage, open, onToggle, onLogout, user }) {
  const W = open ? 228 : 64;
  const isEmployee = user?.role === "employee";
  const navItems = isEmployee ? USER_NAV : ADMIN_NAV;

  return (
    <div style={{ width: W, minWidth: W, background: C.ink, height: "100vh", position: "sticky", top: 0, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.22s ease", overflow: "hidden" }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: open ? "20px 20px 8px" : "20px 17px", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: C.teal, fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: 15 }}>O</span>
        </div>
        {open && <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 16.5, color: "#fff" }}>ORbit HRM</span>}
      </div>

      {/* Role Badge */}
      {open && (
        <div style={{ padding: "0 20px 14px", overflow: "hidden" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              padding: "3px 8px",
              borderRadius: 12,
              background: isEmployee ? "rgba(42,92,154,0.3)" : "rgba(31,138,112,0.3)",
              color: isEmployee ? "#93c5fd" : "#a7f3d0",
            }}
          >
            {isEmployee ? "👤 Employee Portal" : "🛡️ Admin Portal"}
          </span>
        </div>
      )}

      {/* Nav items */}
      <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = page === item.key;
          return (
            <div
              key={item.key}
              title={!open ? item.label : ""}
              onClick={() => setPage(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: open ? "9px 12px" : "9px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: active ? "rgba(31,138,112,0.18)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.65)",
                borderLeft: active ? `3px solid ${C.teal}` : "3px solid transparent",
                fontFamily: "Inter, sans-serif",
                fontWeight: active ? 600 : 500,
                fontSize: 13.5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {open && item.label}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          onClick={onToggle}
          title={open ? "Collapse" : "Expand"}
          style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.45)", cursor: "pointer", padding: "7px 10px", borderRadius: 7, fontFamily: "Inter, sans-serif", fontSize: 13 }}
        >
          {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          {open && "Collapse"}
        </div>
        <div
          onClick={onLogout}
          title="Sign out"
          style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.65)", cursor: "pointer", padding: "7px 10px", borderRadius: 7, fontFamily: "Inter, sans-serif", fontSize: 13 }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {open && "Sign out"}
        </div>
      </div>
    </div>
  );
}
