import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  IconBrandTabler, IconUserBolt, IconSettings, IconArrowLeft,
} from "@tabler/icons-react";
import * as api from "../services/api";
import MetricCard from "../components/MetricCard";
import AssignmentList from "../components/AssignmentList";
import CalendarView from "../components/CalendarView";
import ProductivityInsights from "../components/ProductivityInsights";
import PriorityBadge from "../components/PriorityBadge";
import Grainient from "../components/Grainient";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import PillNav from "../components/PillNav";
import BlurText from "../components/BlurText";
import { ParticleCard, GlobalSpotlight } from "../components/MagicBento";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
};

function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState('dashboard');
  const metricGridRef = useRef(null);
  const dashboardContentRef = useRef(null);

  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    pending: 0,
    completion_rate: 0,
    late_assignments: 0,
    most_pending_course: null,
  });
  const [assignments, setAssignments] = useState([]);
  const [year, setYear] = useState(2026);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramToken, setTelegramToken] = useState(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [pendingListOpen, setPendingListOpen] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [totalListOpen, setTotalListOpen] = useState(false);
  const [totalAssignments, setTotalAssignments] = useState([]);
  const [totalLoading, setTotalLoading] = useState(false);

  const [submittedListOpen, setSubmittedListOpen] = useState(false);
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [submittedLoading, setSubmittedLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!email) {
      setLoading(false);
      setError("No email in URL. Please log in via Google.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchStats(email, year);
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to fetch stats");
      setStats({
        total: 0,
        submitted: 0,
        pending: 0,
        completion_rate: 0,
        late_assignments: 0,
        most_pending_course: null,
      });
    } finally {
      setLoading(false);
    }
  }, [email, year]);

  const fetchAssignments = useCallback(async () => {
    if (!email) return;
    setAssignmentsLoading(true);
    try {
      const data = await api.fetchAssignments(email, year);
      setAssignments(data.assignments || []);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [email, year]);

  const fetchWhatsappStatus = useCallback(async () => {
    if (!email) return;
    try {
      const data = await api.fetchWhatsappStatus(email);
      setWhatsappEnabled(data.enabled);
    } catch {
      /* ignore */
    }
  }, [email]);

  const fetchTelegramStatus = useCallback(async () => {
    if (!email) return;
    try {
      const data = await api.fetchTelegramStatus(email);
      setTelegramEnabled(data.enabled);
      setTelegramConnected(data.connected);
    } catch {
      /* ignore */
    }
  }, [email]);


  const fetchPendingList = async () => {
    if (!email) return;
    setPendingListOpen(true);
    setPendingLoading(true);
    try {
      const data = await api.fetchPendingAssignments(email, year);
      setPendingAssignments(data.assignments || []);
    } catch {
      setPendingAssignments([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchTotalList = async () => {
    if (!email) return;
    setTotalListOpen(true);
    setTotalLoading(true);
    try {
      const data = await api.fetchAllAssignments(email, year);
      setTotalAssignments(data.assignments || []);
    } catch {
      setTotalAssignments([]);
    } finally {
      setTotalLoading(false);
    }
  };

  const fetchSubmittedList = async () => {
    if (!email) return;
    setSubmittedListOpen(true);
    setSubmittedLoading(true);
    try {
      const data = await api.fetchSubmittedAssignments(email, year);
      setSubmittedAssignments(data.assignments || []);
    } catch {
      setSubmittedAssignments([]);
    } finally {
      setSubmittedLoading(false);
    }
  };

  const toggleWhatsapp = async () => {
    if (!email) return;
    setWhatsappLoading(true);
    try {
      const data = await api.toggleWhatsapp(email);
      setWhatsappEnabled(data.enabled);
    } catch (err) {
      setError(err.message || "Failed to toggle WhatsApp");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const toggleTelegram = async () => {
    if (!email) return;
    setTelegramLoading(true);
    try {
      const data = await api.toggleTelegram(email);
      setTelegramEnabled(data.enabled);
    } catch (err) {
      setError(err.message || "Failed to toggle Telegram");
    } finally {
      setTelegramLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchWhatsappStatus();
    fetchTelegramStatus();
  }, [fetchWhatsappStatus, fetchTelegramStatus]);

  useEffect(() => {
    let intervalId;
    if (showTelegramModal && !telegramConnected) {
      intervalId = setInterval(() => {
        fetchTelegramStatus();
      }, 3000);
    }
    return () => clearInterval(intervalId);
  }, [showTelegramModal, telegramConnected, fetchTelegramStatus]);

  useEffect(() => {
    if (telegramConnected && showTelegramModal) {
      setShowTelegramModal(false);
    }
  }, [telegramConnected, showTelegramModal]);

  const connectTelegram = async () => {
    if (!email) return;
    try {
      setTelegramLoading(true);
      const data = await api.generateTelegramToken(email);
      setTelegramToken(data.token);
      setShowTelegramModal(true);
    } catch (err) {
      setError(err.message || "Failed to generate Telegram token");
    } finally {
      setTelegramLoading(false);
    }
  };


  const chartData = [
    { name: "Submitted", count: stats.submitted, fill: "#14B8A6" },
    { name: "Pending", count: stats.pending, fill: "#F97316" },
  ];

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "#",
      icon: <IconBrandTabler style={{ width: 24, height: 24, flexShrink: 0, color: activePanel === 'dashboard' ? '#fff' : 'rgba(255,255,255,0.5)' }} />,
      onClick: (e) => { e.preventDefault(); setActivePanel("dashboard"); },
    },
    {
      label: "Profile",
      href: "#",
      icon: <IconUserBolt style={{ width: 24, height: 24, flexShrink: 0, color: activePanel === 'profile' ? '#fff' : 'rgba(255,255,255,0.5)' }} />,
      onClick: (e) => { e.preventDefault(); setActivePanel("profile"); },
    },
    {
      label: "Settings",
      href: "#",
      icon: <IconSettings style={{ width: 24, height: 24, flexShrink: 0, color: activePanel === 'settings' ? '#fff' : 'rgba(255,255,255,0.5)' }} />,
      onClick: (e) => { e.preventDefault(); setActivePanel("settings"); },
    },
    {
      label: "Logout",
      href: "/",
      icon: <IconArrowLeft style={{ width: 24, height: 24, flexShrink: 0, color: 'rgba(255,255,255,0.5)' }} />,
      onClick: (e) => { e.preventDefault(); navigate("/"); },
    },
  ];

  if (!email) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-2xl rounded-xl bg-amber-50 p-6 text-amber-800">
          <h2 className="text-lg font-semibold">No user session</h2>
          <p className="mt-2">
            Please log in with Google to access the dashboard.
          </p>
          <a
            href={`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/login`}
            className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
          >
            Log in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', background: '#0d0c0d', minHeight: '100vh', display: 'flex' }}>
      {/* Grainient fixed background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Grainient
          color1="#0d0c0d" color2="#525158" color3="#515053"
          timeSpeed={0.25} colorBalance={0} warpStrength={1} warpFrequency={5}
          warpSpeed={2} warpAmplitude={50} blendAngle={0} blendSoftness={0.05}
          rotationAmount={500} noiseScale={2} grainAmount={0.1} grainScale={2}
          grainAnimated={false} contrast={1.5} gamma={1} saturation={1}
          centerX={0} centerY={0} zoom={0.9}
        />
      </div>

      {/* Sidebar — fixed so it never scrolls */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 10 }}>
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarBody style={{ height: '100vh', paddingTop: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {/* Logo / Brand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px 20px', overflow: 'hidden' }}>
                <img
                  src="/logo.png"
                  alt="SmartSubmit"
                  style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
                />
                {sidebarOpen && (
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                    Smart<span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.6)' }}>Submit</span>
                  </span>
                )}
              </div>
              {sidebarLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            {/* User avatar at bottom */}
            <div style={{ padding: '12px 4px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <SidebarLink link={{
                label: email || "User",
                href: "#",
                icon: (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                    {(email[0] || "U").toUpperCase()}
                  </div>
                ),
                onClick: (e) => e.preventDefault(),
              }} />
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      {/* Main content — margin tracks sidebar open/close */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, overflowY: 'auto', padding: '24px', marginLeft: sidebarOpen ? '300px' : '80px', transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div className="mx-auto max-w-5xl">
          {/* PillNav top bar */}
          <PillNav
            logo="/logo.png"
            logoAlt="SmartSubmit"
            activeHref={`#${activePanel}`}
            baseColor="#000000"
            pillColor="#ffffff"
            hoveredPillTextColor="#ffffff"
            pillTextColor="#000000"
            initialLoadAnimation={false}
            items={[
              {
                label: 'Dashboard',
                href: '#dashboard',
                onClick: (e) => { e.preventDefault(); setActivePanel('dashboard'); },
              },
              {
                label: 'Contact',
                href: '#contact',
                onClick: (e) => { e.preventDefault(); setActivePanel('contact'); },
              },
              {
                label: 'About',
                href: '#about',
                onClick: (e) => { e.preventDefault(); setActivePanel('about'); },
              },
            ]}
          />

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="mb-bento-section" ref={dashboardContentRef}>
            <GlobalSpotlight gridRef={dashboardContentRef} spotlightRadius={500} />

            {/* Notification toggles */}
            <ParticleCard className="mb-8" clickEffect>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                {/* WhatsApp toggle row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', minWidth: '190px' }}>
                    WhatsApp reminders
                  </span>
                  <button
                    onClick={toggleWhatsapp}
                    disabled={whatsappLoading}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50`}
                    style={{
                      backgroundColor: whatsappEnabled ? '#3a404a' : 'transparent',
                      borderColor: whatsappEnabled ? '#3a404a' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <span
                      className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${whatsappEnabled ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                    {whatsappEnabled ? "ON" : "OFF"}
                  </span>
                </div>

                {/* Separator */}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', width: '100%' }} />

                {/* Telegram toggle row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#fff', minWidth: '190px' }}>
                      Telegram reminders
                    </span>
                    {!telegramConnected ? (
                      <button
                        onClick={connectTelegram}
                        disabled={telegramLoading}
                        style={{
                          background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'opacity 0.2s',
                          opacity: telegramLoading ? 0.7 : 1
                        }}
                      >
                        Connect Telegram
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={toggleTelegram}
                          disabled={telegramLoading}
                          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50`}
                          style={{
                            backgroundColor: telegramEnabled ? '#3a404a' : 'transparent',
                            borderColor: telegramEnabled ? '#3a404a' : 'rgba(255,255,255,0.3)',
                          }}
                        >
                          <span
                            className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${telegramEnabled ? "translate-x-6" : "translate-x-1"}`}
                          />
                        </button>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                          {telegramEnabled ? "ON" : "OFF"}
                          <span style={{
                            color: '#fff',
                            marginLeft: '8px',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                          }}>
                            Connected
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </ParticleCard>


            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
              </div>
            ) : (
              <>
                {/* Metrics cards */}
                <div ref={metricGridRef} className="mb-8 grid gap-4 sm:grid-cols-3">
                  <ParticleCard className="mb-metric-card rounded-xl" clickEffect>
                    <MetricCard
                      title="Total Assignments"
                      value={stats.total}
                      clickable
                      onClick={fetchTotalList}
                    />
                  </ParticleCard>
                  <ParticleCard className="mb-metric-card rounded-xl" clickEffect>
                    <MetricCard
                      title="Submitted"
                      value={stats.submitted}
                      clickable
                      onClick={fetchSubmittedList}
                    />
                  </ParticleCard>
                  <ParticleCard className="mb-metric-card rounded-xl" clickEffect>
                    <MetricCard
                      title="Pending"
                      value={stats.pending}
                      clickable
                      onClick={fetchPendingList}
                    />
                  </ParticleCard>
                </div>

                {/* Productivity Insights */}
                <ParticleCard className="mb-8" clickEffect>
                  <ProductivityInsights stats={stats} />
                </ParticleCard>

                {/* Bar chart */}
                {(stats.submitted > 0 || stats.pending > 0) && (
                  <ParticleCard className="mb-8" clickEffect>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '24px',
                    }}>
                      <h2 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>
                        Submitted vs Pending
                      </h2>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)" }} />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.5)" }} />
                            <Tooltip
                              contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                              itemStyle={{ color: '#fff' }}
                              labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                            />
                            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }} />
                            <Bar
                              dataKey="count"
                              name="Assignments"
                              radius={[4, 4, 0, 0]}
                            >
                              {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </ParticleCard>
                )}

                {/* Assignments section */}
                <ParticleCard className="mb-8" clickEffect>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                  }}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                      <h2 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600 }}>
                        Assignments
                      </h2>
                      <div className="flex flex-wrap items-center gap-3">
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex' }}>
                          <button
                            onClick={() => setViewMode("list")}
                            style={{
                              padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, borderRadius: '6px 0 0 6px',
                              background: viewMode === "list" ? 'rgba(255,255,255,0.1)' : 'transparent',
                              color: viewMode === "list" ? '#fff' : 'rgba(255,255,255,0.5)',
                              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            List View
                          </button>
                          <button
                            onClick={() => setViewMode("calendar")}
                            style={{
                              padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0 6px 6px 0',
                              background: viewMode === "calendar" ? 'rgba(255,255,255,0.1)' : 'transparent',
                              color: viewMode === "calendar" ? '#fff' : 'rgba(255,255,255,0.5)',
                              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            Calendar View
                          </button>
                        </div>
                        {viewMode === "list" && (
                          <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            style={{
                              background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px', padding: '8px 12px', fontSize: '0.875rem', outline: 'none'
                            }}
                          >
                            <option value="all" style={{ background: '#0d0c0d' }}>All</option>
                            <option value="HIGH" style={{ background: '#0d0c0d' }}>High</option>
                            <option value="MEDIUM" style={{ background: '#0d0c0d' }}>Medium</option>
                            <option value="LOW" style={{ background: '#0d0c0d' }}>Low</option>
                          </select>
                        )}
                      </div>
                    </div>
                    {viewMode === "list" ? (
                      <AssignmentList
                        assignments={assignments}
                        filter={priorityFilter}
                        loading={assignmentsLoading}
                      />
                    ) : (
                      <CalendarView
                        assignments={assignments}
                        loading={assignmentsLoading}
                      />
                    )}
                  </div>
                </ParticleCard>
              </>
            )}
          </div>{/* end dashboardContentRef */}

          {/* ── REUSABLE MODALS ── */}
          {[
            {
              open: totalListOpen,
              onClose: () => setTotalListOpen(false),
              title: `All Assignments (${stats.total})`,
              loading: totalLoading,
              items: totalAssignments,
              emptyMsg: "No assignments found",
              badgeColor: (a) => a.is_submitted ? "text-green-600" : "text-amber-600",
              badgeLabel: (a) => a.is_submitted ? "✔ Submitted" : "⏳ Pending",
            },
            {
              open: submittedListOpen,
              onClose: () => setSubmittedListOpen(false),
              title: `Submitted Assignments (${stats.submitted})`,
              loading: submittedLoading,
              items: submittedAssignments,
              emptyMsg: "No submitted assignments",
              badgeColor: () => "text-green-600",
              badgeLabel: () => "✔ Submitted",
            },
            {
              open: pendingListOpen,
              onClose: () => setPendingListOpen(false),
              title: `Pending Assignments (${stats.pending})`,
              loading: pendingLoading,
              items: pendingAssignments,
              emptyMsg: "No pending assignments",
              badgeColor: () => "text-amber-600",
              badgeLabel: () => "⏳ Pending",
              showPriority: true,
            },
          ].map((modal, mi) =>
            modal.open ? (
              <div
                key={mi}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={modal.onClose}
              >
                <div
                  className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-white/5 p-5">
                    <h3 className="text-xl font-bold text-white">
                      {modal.title}
                    </h3>
                    <button
                      onClick={modal.onClose}
                      className="text-white/40 hover:text-white transition-colors p-1"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-5 custom-scrollbar">
                    {modal.loading ? (
                      <div className="flex justify-center py-12">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-white" />
                      </div>
                    ) : modal.items.length === 0 ? (
                      <p className="py-12 text-center text-white/30 text-lg">
                        {modal.emptyMsg}
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {[...modal.items]
                          .sort((a, b) => {
                            if (!modal.showPriority) return 0;
                            const o = { HIGH: 0, MEDIUM: 1, LOW: 2 };
                            return (o[a.priority] ?? 2) - (o[b.priority] ?? 2);
                          })
                          .map((a, i) => (
                            <li
                              key={i}
                              className="rounded-xl border border-white/5 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-bold text-white text-lg">
                                  {a.title}
                                </p>
                                <div className="flex items-center gap-3">
                                  {modal.showPriority && a.priority && (
                                    <PriorityBadge priority={a.priority} />
                                  )}
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full bg-white/5 ${modal.badgeColor(a)}`}>
                                    {modal.badgeLabel(a)}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-2 text-white/50 font-medium">
                                {a.course}
                              </p>
                              <div className="mt-3 flex items-center gap-2 text-sm text-white/30">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>
                                <span>Due: {formatDate(a.due_date)}</span>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : null
          )}

          {/* ── PROFILE MODAL ── */}
          {activePanel === "profile" && (
            <div
              onClick={() => setActivePanel("dashboard")}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                backdropFilter: 'blur(32px)',
                background: 'rgba(0,0,0,0.65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px', cursor: 'pointer',
                marginLeft: sidebarOpen ? '300px' : '80px',
                transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)'
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                  cursor: 'default'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: '1.8rem', fontWeight: 700 }}>
                    {(email[0] || "U").toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{email.split("@")[0] || "User"}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', marginTop: '4px' }}>{email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: "Email", value: email },
                    { label: "Total Assignments", value: stats.total },
                    { label: "Completion Rate", value: `${stats.completion_rate ?? 0}%` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem', marginTop: '4px' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS MODAL ── */}
          {activePanel === "settings" && (
            <div
              onClick={() => setActivePanel("dashboard")}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                backdropFilter: 'blur(32px)',
                background: 'rgba(0,0,0,0.65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px', cursor: 'pointer',
                marginLeft: sidebarOpen ? '300px' : '80px',
                transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)'
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                  cursor: 'default'
                }}
              >
                <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    "Notification Preferences",
                    "Connected Accounts",
                    "Privacy & Data",
                    "Theme",
                    "Language",
                  ].map((item) => (
                    <div key={item} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 500 }}>{item}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>
                    </div>
                  ))}
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', textAlign: 'center', marginTop: '8px' }}>
                    More settings coming soon
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── TELEGRAM INSTRUCTIONS MODAL ── */}
          {showTelegramModal && (
            <div
              onClick={() => setShowTelegramModal(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 110,
                backdropFilter: 'blur(32px)',
                background: 'rgba(0,0,0,0.65)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px', cursor: 'pointer',
                marginLeft: sidebarOpen ? '300px' : '80px',
                transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)'
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '32px',
                  maxWidth: '400px',
                  width: '100%',
                  cursor: 'default',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>
                  Connect Your Telegram
                </h3>
                <ol style={{ textAlign: 'left', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', lineHeight: 1.6, paddingLeft: '20px', marginBottom: '24px' }}>
                  <li>Open Telegram on your device.</li>
                  <li>Search for our bot (e.g., <strong>@ClassroomReminderBot</strong>) or click the link if available.</li>
                  <li>Send the following exact message to the bot:</li>
                </ol>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '1.2rem',
                  color: '#fff',
                  letterSpacing: '1px',
                  marginBottom: '24px',
                  userSelect: 'all'
                }}>
                  /start {telegramToken}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Waiting for connection...</span>
                </div>
                <button
                  onClick={() => setShowTelegramModal(false)}
                  style={{
                    marginTop: '24px',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>{/* end max-w-5xl */}
      </div>{/* end flex-1 (main area) */}

      {/* ── CONTACT PANEL ── — fixed overlay respecting sidebar */}
      {activePanel === "contact" && (
        <div
          onClick={() => setActivePanel("dashboard")}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backdropFilter: 'blur(32px)',
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px', cursor: 'pointer', gap: '24px',
            marginLeft: sidebarOpen ? '300px' : '80px',
            transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)'
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center', cursor: 'default' }}>
            <BlurText text="neelanshdosi@gmail.com" delay={100} animateBy="words" direction="top" stepDuration={0.4} className="text-4xl font-semibold text-white" />
          </div>
          <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center', cursor: 'default' }}>
            <BlurText text="8319122246" delay={80} animateBy="characters" direction="top" stepDuration={0.35} className="text-4xl font-semibold text-white tracking-widest" />
          </div>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '20px' }}>
            <a href="https://www.linkedin.com/in/neelansh-dosi-866777282" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px', padding: '10px 24px', fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,102,194,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              LinkedIn
            </a>
            <a href="https://github.com/neelanshdosi" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '999px', padding: '10px 24px', fontSize: '1rem', fontWeight: 600, transition: 'all 0.2s', backdropFilter: 'blur(8px)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
              GitHub
            </a>
          </div>
          <p onClick={e => e.stopPropagation()} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Click anywhere to close</p>
        </div>
      )}

      {/* ── ABOUT PANEL ── — fixed overlay respecting sidebar */}
      {activePanel === "about" && (
        <div
          onClick={() => setActivePanel("dashboard")}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backdropFilter: 'blur(32px)',
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '40px', cursor: 'pointer',
            marginLeft: sidebarOpen ? '300px' : '80px',
            transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)'
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', textAlign: 'center', cursor: 'default' }}>
            <BlurText
              text="Stay ahead of your academic deadlines with real-time tracking and WhatsApp alerts. From new assignments to last-day reminders, everything is handled automatically so you can focus on getting the work done."
              delay={120} animateBy="words" direction="top" stepDuration={0.4}
              className="text-4xl font-semibold leading-relaxed text-white"
            />
            <p style={{ marginTop: '32px', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
