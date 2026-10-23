import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell, ChevronDown, User, LogOut, CheckCheck, Check,
  ChevronRight, Sparkles, Clock, CalendarDays, CreditCard,
  Building2, RefreshCw, Inbox, AlertCircle, Trash2, X, Plus,
  RotateCcw, Send
} from "lucide-react";
import { C } from "../../constants/theme";
import { Avatar, Modal, Button } from "../ui";
import { fetchNotifications } from "../../api/notificationsApi";
import { createAnnouncement } from "../../api/hrmApi";

const STORAGE_KEY = "orbit_read_notifications";
const CLEARED_STORAGE_KEY = "orbit_cleared_notifications";

export default function TopBar({ onMenu, currentUser, user, setPage, onLogout }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifsTab, setNotifsTab] = useState("all"); // "all" | "unread"
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Read notification IDs
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Cleared / Dismissed notification IDs
  const [clearedIds, setClearedIds] = useState(() => {
    try {
      const stored = localStorage.getItem(CLEARED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modal to Add New Notification (Admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [postingNotif, setPostingNotif] = useState(false);
  const [newNotifForm, setNewNotifForm] = useState({
    title: "",
    content: "",
    priority: "High",
  });

  const userMenuRef = useRef(null);
  const notifsRef = useRef(null);

  const isEmployee = user?.role === "employee";
  const roleLabel = isEmployee ? "Employee Portal" : "HR Administrator";

  // Provide initial role-aware fallback items so UI is instantly ready
  const getFallbackNotifications = useCallback(() => {
    if (isEmployee) {
      return [
        {
          id: "fb-emp-att",
          title: "Today's Attendance Status",
          message: "Check your daily punch-in time and attendance status.",
          category: "attendance",
          target: "user-attendance",
          time: "Today",
          dot: "#1F8A70",
          badge: "Attendance",
          priority: "normal",
        },
        {
          id: "fb-emp-leave",
          title: "Leave Applications & Status",
          message: "Track your pending leave applications and holiday calendar.",
          category: "leave",
          target: "user-leave",
          time: "Leave Portal",
          dot: "#B9790A",
          badge: "Leave",
          priority: "normal",
        },
        {
          id: "fb-emp-pay",
          title: "Monthly Salary & Payslip",
          message: "View your current take-home pay and compensation summary.",
          category: "payroll",
          target: "user-dashboard",
          time: "Payroll",
          dot: "#2A5C9A",
          badge: "Payslip",
          priority: "normal",
        },
        {
          id: "fb-emp-prof",
          title: "My Profile Details",
          message: "Review personal designation, department, and contact information.",
          category: "profile",
          target: "user-profile",
          time: "Profile",
          dot: "#059669",
          badge: "Profile",
          priority: "normal",
        },
      ];
    } else {
      return [
        {
          id: "fb-adm-leave",
          title: "Leave Requests Review",
          message: "Review and approve employee leave applications.",
          category: "leave",
          target: "leave",
          time: "Needs Approval",
          dot: "#B9790A",
          badge: "Leave",
          priority: "high",
        },
        {
          id: "fb-adm-att",
          title: "Today's Workforce Attendance",
          message: "Monitor team attendance logs, clock-ins, and late arrivals.",
          category: "attendance",
          target: "attendance",
          time: "Today",
          dot: "#1F8A70",
          badge: "Attendance",
          priority: "normal",
        },
        {
          id: "fb-adm-pay",
          title: "Monthly Payroll Status",
          message: "Review employee salary disbursements and send email payslips.",
          category: "payroll",
          target: "payroll",
          time: "Disbursals",
          dot: "#2A5C9A",
          badge: "Payroll",
          priority: "high",
        },
        {
          id: "fb-adm-dept",
          title: "Department Roster & Headcount",
          message: "Manage connected organization staff and department allocations.",
          category: "departments",
          target: "departments",
          time: "Roster",
          dot: "#6B46A8",
          badge: "Departments",
          priority: "normal",
        },
      ];
    }
  }, [isEmployee]);

  // Fetch real notifications from backend
  const loadNotifications = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingNotifs(true);
    try {
      const data = await fetchNotifications();
      const results = Array.isArray(data) ? data : data?.results || [];
      if (results.length > 0) {
        setNotifications(results);
      } else {
        setNotifications(getFallbackNotifications());
      }
    } catch (err) {
      console.warn("Notifications sync:", err?.message);
      setNotifications((prev) => (prev.length > 0 ? prev : getFallbackNotifications()));
    } finally {
      if (!quiet) setLoadingNotifs(false);
    }
  }, [getFallbackNotifications]);

  // Initial load & automatic refresh listener
  useEffect(() => {
    loadNotifications(true);

    const handleRefresh = () => {
      loadNotifications(true);
    };

    window.addEventListener("orbit_notifications_refresh", handleRefresh);

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications(true);
    }, 30000);

    return () => {
      window.removeEventListener("orbit_notifications_refresh", handleRefresh);
      clearInterval(interval);
    };
  }, [loadNotifications]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifsRef.current && !notifsRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save readIds to localStorage
  const saveReadIds = (nextIds) => {
    setReadIds(nextIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    } catch (e) {
      console.warn("Failed to persist notification read state:", e);
    }
  };

  // Save clearedIds to localStorage
  const saveClearedIds = (nextIds) => {
    setClearedIds(nextIds);
    try {
      localStorage.setItem(CLEARED_STORAGE_KEY, JSON.stringify(nextIds));
    } catch (e) {
      console.warn("Failed to persist notification cleared state:", e);
    }
  };

  const markAsRead = (id) => {
    const sId = String(id);
    if (!readIds.includes(sId)) {
      const next = [...readIds, sId];
      saveReadIds(next);
    }
  };

  const markAllAsRead = (e) => {
    if (e) e.stopPropagation();
    const allIds = Array.from(new Set([...readIds, ...notifications.map((n) => String(n.id))]));
    saveReadIds(allIds);
  };

  // Clear single notification (Dismiss)
  const clearSingleNotification = (e, id) => {
    e.stopPropagation();
    const sId = String(id);
    const next = Array.from(new Set([...clearedIds, sId]));
    saveClearedIds(next);
    markAsRead(sId);
  };

  // Clear all notifications
  const clearAllNotifications = (e) => {
    if (e) e.stopPropagation();
    const allIds = notifications.map((n) => String(n.id));
    const next = Array.from(new Set([...clearedIds, ...allIds]));
    saveClearedIds(next);
    saveReadIds(Array.from(new Set([...readIds, ...allIds])));
  };

  // Restore cleared notifications
  const restoreAllNotifications = (e) => {
    if (e) e.stopPropagation();
    saveClearedIds([]);
    loadNotifications(true);
  };

  // Direct move to target page when a notification is clicked
  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setShowNotifs(false);

    if (n.target && setPage) {
      setPage(n.target);
    }
  };

  // Broadcast new notification (Admin)
  const handleCreateNewNotification = async (e) => {
    e.preventDefault();
    if (!newNotifForm.title.trim() || !newNotifForm.content.trim()) return;

    setPostingNotif(true);
    try {
      await createAnnouncement({
        title: newNotifForm.title.trim(),
        content: newNotifForm.content.trim(),
        priority: newNotifForm.priority,
        is_active: true,
      });

      // Clear any cleared state for announcements so everyone sees it
      saveClearedIds(clearedIds.filter((id) => !id.startsWith("ann-")));
      setNewNotifForm({ title: "", content: "", priority: "High" });
      setShowAddModal(false);
      await loadNotifications(false);
      window.dispatchEvent(new Event("orbit_notifications_refresh"));
    } catch (err) {
      console.warn("Failed to create notification:", err);
    } finally {
      setPostingNotif(false);
    }
  };

  // Category Icon & Color Mapping
  const getCategoryMeta = (category) => {
    switch (category) {
      case "leave":
        return { icon: CalendarDays, bg: "#fef3c7", color: "#b45309" };
      case "attendance":
        return { icon: Clock, bg: "#ecfdf5", color: "#047857" };
      case "payroll":
        return { icon: CreditCard, bg: "#eff6ff", color: "#1d4ed8" };
      case "departments":
        return { icon: Building2, bg: "#f5f3ff", color: "#6d28d9" };
      case "profile":
        return { icon: User, bg: "#ecfdf5", color: "#059669" };
      case "announcement":
      default:
        return { icon: Sparkles, bg: "#fff1f2", color: "#be123c" };
    }
  };

  // Non-cleared notifications
  const activeNotifications = notifications.filter((n) => !clearedIds.includes(String(n.id)));
  const unreadItems = activeNotifications.filter((n) => !readIds.includes(String(n.id)));
  const unreadCount = unreadItems.length;
  const displayedItems = notifsTab === "unread" ? unreadItems : activeNotifications;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "12px 26px",
        borderBottom: `1px solid ${C.border}`,
        background: C.panel,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Right side items */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* Role badge */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 20,
            background: isEmployee ? "#eff6ff" : "#ecfdf5",
            color: isEmployee ? "#1d4ed8" : "#047857",
            border: `1px solid ${isEmployee ? "#bfdbfe" : "#a7f3d0"}`,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span>{isEmployee ? "👤" : "🛡️"}</span>
          <span>{isEmployee ? "Employee Portal" : "Admin Panel"}</span>
        </span>

        {/* Dynamic Interactive Notifications */}
        <div ref={notifsRef} style={{ position: "relative" }}>
          <button
            type="button"
            id="notification-bell-btn"
            onClick={() => {
              setShowNotifs((v) => {
                const next = !v;
                if (next) loadNotifications(true);
                return next;
              });
            }}
            aria-label="Notifications"
            style={{
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: `1.5px solid ${showNotifs ? C.ink : C.border}`,
              background: showNotifs ? "#f1f5f9" : "#fff",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!showNotifs) e.currentTarget.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              if (!showNotifs) e.currentTarget.style.background = "#fff";
            }}
          >
            <Bell size={19} color={unreadCount > 0 ? C.ink : C.slate} />

            {/* Unread badge count counter */}
            {unreadCount > 0 ? (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 19,
                  height: 19,
                  borderRadius: 10,
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: 10.5,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  boxShadow: "0 2px 6px rgba(239,68,68,0.45)",
                  border: "2px solid #fff",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : (
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  right: 4,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#94a3b8",
                  opacity: 0.6,
                }}
              />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifs && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: 400,
                maxWidth: "calc(100vw - 32px)",
                background: "#fff",
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                boxShadow: "0 14px 45px rgba(15, 23, 42, 0.16)",
                zIndex: 200,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                animation: "dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Dropdown Header */}
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: `1px solid ${C.border}`,
                  background: "#f8fafc",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: 15, color: C.ink }}>
                      Notifications
                    </span>
                    {unreadCount > 0 ? (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          background: "#fee2e2",
                          color: "#b91c1c",
                          padding: "2px 8px",
                          borderRadius: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }}></span>
                        {unreadCount} New
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: "#ecfdf5",
                          color: "#047857",
                          padding: "2px 8px",
                          borderRadius: 12,
                        }}
                      >
                        All caught up
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Admin quick add notice button */}
                    {!isEmployee && (
                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        title="Broadcast new notification"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 700,
                          background: `${C.teal}15`,
                          color: C.teal,
                          border: `1px solid ${C.teal}30`,
                          padding: "3px 8px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={12} />
                        <span>Add Notice</span>
                      </button>
                    )}

                    {/* Clear All Notifications Button */}
                    {activeNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        title="Clear all notifications from view"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: "#ef4444",
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          cursor: "pointer",
                          padding: "3px 8px",
                          borderRadius: 6,
                        }}
                      >
                        <Trash2 size={12} />
                        <span>Clear All</span>
                      </button>
                    )}

                    {/* Refresh */}
                    <button
                      type="button"
                      onClick={() => loadNotifications(false)}
                      title="Refresh notifications"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: C.slateLight,
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 4,
                      }}
                    >
                      <RefreshCw size={13} className={loadingNotifs ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs & Quick Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setNotifsTab("all")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 16,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        background: notifsTab === "all" ? C.ink : "#e2e8f0",
                        color: notifsTab === "all" ? "#fff" : C.slate,
                        transition: "all 0.15s ease",
                      }}
                    >
                      All ({activeNotifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifsTab("unread")}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 16,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        background: notifsTab === "unread" ? "#ef4444" : "#e2e8f0",
                        color: notifsTab === "unread" ? "#fff" : C.slate,
                        transition: "all 0.15s ease",
                      }}
                    >
                      New ({unreadCount})
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: 11,
                        color: C.teal,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <CheckCheck size={13} />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List (Scrollable) */}
              <div style={{ maxHeight: 390, overflowY: "auto" }}>
                {displayedItems.length === 0 ? (
                  <div style={{ padding: "36px 20px", textAlign: "center" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        color: C.slateLight,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Inbox size={24} />
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13.5, color: C.ink }}>
                      {clearedIds.length > 0 && notifications.length > 0
                        ? "All notifications cleared!"
                        : notifsTab === "unread"
                        ? "No new notifications"
                        : "No notifications right now"}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: C.slateLight, marginTop: 4 }}>
                      {clearedIds.length > 0 && notifications.length > 0
                        ? "You dismissed your notification list."
                        : notifsTab === "unread"
                        ? "You have viewed all updates."
                        : "Everything is running smoothly."}
                    </div>

                    {clearedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={restoreAllNotifications}
                        style={{
                          marginTop: 12,
                          background: "#fff",
                          border: `1px solid ${C.border}`,
                          color: C.teal,
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>Restore Cleared Notifications</span>
                      </button>
                    )}
                  </div>
                ) : (
                  displayedItems.map((n) => {
                    const isRead = readIds.includes(String(n.id));
                    const meta = getCategoryMeta(n.category);
                    const IconComponent = meta.icon;

                    return (
                      <div
                        key={n.id}
                        id={`notif-item-${n.id}`}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "13px 18px",
                          borderBottom: `1px solid ${C.border}`,
                          cursor: "pointer",
                          background: isRead ? "#fff" : "#f0fdf4",
                          transition: "background 0.15s ease",
                          position: "relative",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isRead ? "#f8fafc" : "#e6f9ed")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isRead ? "#fff" : "#f0fdf4")}
                      >
                        {/* Category Icon Badge */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: meta.bg,
                            color: meta.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          <IconComponent size={18} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 2 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              {/* Bright NEW Badge for unread */}
                              {!isRead && (
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 900,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: "#ef4444",
                                    color: "#fff",
                                    letterSpacing: 0.5,
                                    boxShadow: "0 1px 4px rgba(239,68,68,0.35)",
                                  }}
                                >
                                  NEW
                                </span>
                              )}

                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  background: meta.bg,
                                  color: meta.color,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.3,
                                }}
                              >
                                {n.badge || n.category}
                              </span>

                              {n.priority === "high" && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    background: "#fee2e2",
                                    color: "#b91c1c",
                                  }}
                                >
                                  High
                                </span>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.slateLight, flexShrink: 0 }}>
                                {n.time}
                              </span>

                              {/* Dismiss single notification button */}
                              <button
                                type="button"
                                title="Dismiss notification"
                                onClick={(e) => clearSingleNotification(e, n.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: C.slateLight,
                                  padding: "2px",
                                  display: "flex",
                                  alignItems: "center",
                                  borderRadius: "50%",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = C.slateLight)}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: 13,
                              fontWeight: isRead ? 500 : 700,
                              color: C.ink,
                              lineHeight: 1.35,
                            }}
                          >
                            {n.title}
                          </div>

                          <div
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: 12,
                              color: C.slate,
                              lineHeight: 1.4,
                              marginTop: 3,
                            }}
                          >
                            {n.message}
                          </div>

                          {/* Direct Navigation Action Prompt */}
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              marginTop: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: C.teal,
                            }}
                          >
                            <span>Open {n.target ? `/${n.target}` : "Page"}</span>
                            <ChevronRight size={13} />
                          </div>
                        </div>

                        {/* Unread indicator dot */}
                        {!isRead && (
                          <div
                            title="New & Unread"
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#ef4444",
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dropdown Footer */}
              <div
                style={{
                  padding: "10px 18px",
                  background: "#f8fafc",
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11.5,
                  color: C.slateLight,
                }}
              >
                <span>Click any notification to navigate directly</span>
                {activeNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Clear all</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={userMenuRef} style={{ position: "relative" }}>
          <div
            onClick={() => setShowUserMenu((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              cursor: "pointer",
              padding: "5px 8px",
              borderRadius: 8,
              transition: "background 0.15s ease",
              background: showUserMenu ? C.canvas : "transparent",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              if (!showUserMenu) e.currentTarget.style.background = C.canvas;
            }}
            onMouseLeave={(e) => {
              if (!showUserMenu) e.currentTarget.style.background = "transparent";
            }}
          >
            <Avatar name={currentUser} size={32} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: C.ink }}>
                {currentUser}
              </div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: C.slateLight }}>
                {roleLabel}
              </div>
            </div>
            <ChevronDown
              size={14}
              color={C.slateLight}
              style={{
                transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </div>

          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 220,
                background: "#fff",
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                boxShadow: "0 10px 30px rgba(20,33,61,0.12)",
                zIndex: 200,
                overflow: "hidden",
                padding: "6px 0",
              }}
            >
              {/* Header Info */}
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: C.ink }}>
                  {currentUser}
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, color: C.slateLight }}>
                  Signed in as {isEmployee ? "Employee" : "Administrator"}
                </div>
              </div>

              {/* Profile Option */}
              <div
                onClick={() => {
                  setShowUserMenu(false);
                  if (setPage) setPage(isEmployee ? "user-profile" : "settings");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: C.ink,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.canvas)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <User size={15} color={C.slate} />
                <span>My Profile</span>
              </div>

              <div style={{ height: 1, background: C.border, margin: "4px 0" }} />

              {/* Logout Button */}
              <div
                onClick={() => {
                  setShowUserMenu(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  color: C.coral,
                  fontWeight: 600,
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.coralSoft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={15} color={C.coral} />
                <span>Sign out</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Broadcast New Notification Modal */}
      {showAddModal && (
        <Modal
          title="Broadcast New Notification"
          onClose={() => setShowAddModal(false)}
          width={480}
        >
          <form onSubmit={handleCreateNewNotification}>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: C.slate, marginBottom: 16 }}>
              Send an official notice or alert. It will immediately show up as a <strong>NEW</strong> notification for all users and staff.
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
                Notification Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Diwali Holiday Announcement / Urgent Meeting"
                value={newNotifForm.title}
                onChange={(e) => setNewNotifForm({ ...newNotifForm, title: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13.5,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
                Priority Level
              </label>
              <select
                value={newNotifForm.priority}
                onChange={(e) => setNewNotifForm({ ...newNotifForm, priority: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13.5,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="Normal">Normal</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
                Message Content *
              </label>
              <textarea
                rows={4}
                placeholder="Write the full notification message to be displayed to employees..."
                value={newNotifForm.content}
                onChange={(e) => setNewNotifForm({ ...newNotifForm, content: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 13.5,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button variant="ghost" onClick={() => setShowAddModal(false)} type="button">
                Cancel
              </Button>
              <Button
                variant="teal"
                icon={postingNotif ? RefreshCw : Send}
                disabled={postingNotif || !newNotifForm.title.trim()}
                type="submit"
              >
                {postingNotif ? "Broadcasting..." : "Broadcast Notification"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
