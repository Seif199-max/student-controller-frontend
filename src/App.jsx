import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000/api";

const MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"
];

const GRADES = [
  { value: "P4", label: "رابعة ابتدائي" },
  { value: "P5", label: "خامسة ابتدائي" },
  { value: "P6", label: "سادسة ابتدائي" },
  { value: "S1", label: "أولى إعدادي" },
  { value: "S2", label: "ثانية إعدادي" },
  { value: "S3", label: "ثالثة إعدادي" },
  { value: "H1", label: "أولى ثانوي" },
  { value: "H2", label: "ثانية ثانوي" },
  { value: "H3", label: "ثالثة ثانوي" },
];

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportYear, setReportYear] = useState(currentYear);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: "", grade: "", notes: "" });
  const [editingStudent, setEditingStudent] = useState(null);
  const [payForm, setPayForm] = useState({ student_id: "", month: currentMonth, year: currentYear });
  const [toast, setToast] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ──────────────────────────────────────────
  const fetchStudents = async () => {
    try {
      let url = `${API}/students/?`;
      if (search) url += `search=${search}&`;
      if (filterGrade) url += `grade=${filterGrade}&`;
      const res = await axios.get(url);
      setStudents(res.data.results || res.data);
    } catch { showToast("فشل تحميل الطلاب", "error"); }
  };

  const fetchGrades = async () => {
    try {
      const res = await axios.get(`${API}/grades/`);
      setGrades(res.data.results || res.data);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/students/stats/`);
      setStats(res.data);
    } catch {}
  };

  useEffect(() => { fetchStudents(); }, [search, filterGrade]);
  useEffect(() => { fetchGrades(); fetchStats(); }, []);

  // ── Student CRUD ───────────────────────────────────
  const submitStudent = async () => {
    try {
      if (editingStudent) {
        await axios.put(`${API}/students/${editingStudent.id}/`, studentForm);
        showToast("تم تعديل الطالب ✏️");
      } else {
        await axios.post(`${API}/students/`, studentForm);
        showToast("تم إضافة الطالب ✅");
      }
      setStudentForm({ name: "", grade: "", notes: "" });
      setEditingStudent(null);
      setShowStudentModal(false);
      fetchStudents(); fetchStats();
    } catch { showToast("حصل خطأ!", "error"); }
  };

  const deleteStudent = async (id) => {
    if (!confirm("مسح الطالب؟")) return;
    try {
      await axios.delete(`${API}/students/${id}/`);
      showToast("تم الحذف 🗑️");
      fetchStudents(); fetchStats();
    } catch { showToast("فشل الحذف", "error"); }
  };

  const openEdit = (s) => {
    setEditingStudent(s);
    setStudentForm({ name: s.name, grade: s.grade, notes: s.notes });
    setShowStudentModal(true);
  };

  // ── Payment ────────────────────────────────────────
  const submitPayment = async () => {
    try {
      await axios.post(`${API}/payments/`, {
        student: payForm.student_id,
        month: payForm.month,
        year: payForm.year,
      });
      showToast("تم تسجيل الدفع 💰");
      fetchStudents(); fetchStats();
    } catch (e) {
      const msg = e.response?.data?.non_field_errors?.[0] || "حصل خطأ!";
      showToast(msg, "error");
    }
  };

  // ── Report ─────────────────────────────────────────
  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await axios.get(
        `${API}/students/payment_report/?month=${reportMonth}&year=${reportYear}`
      );
      setReport(res.data);
    } catch { showToast("فشل تحميل التقرير", "error"); }
    setLoadingReport(false);
  };

  // ── UI ─────────────────────────────────────────────
  const tabs = [
    { id: "dashboard", icon: "🏠", label: "الرئيسية" },
    { id: "students", icon: "👥", label: "الطلاب" },
    { id: "payment", icon: "💰", label: "تسجيل دفع" },
    { id: "report", icon: "📊", label: "التقارير" },
    { id: "grades", icon: "🏫", label: "المراحل" },
  ];

  return (
    <div style={s.root}>
      {/* ── TOAST ── */}
      {toast && (
        <div style={{ ...s.toast, background: toast.type === "error" ? "#ef4444" : "#22c55e" }}>
          {toast.msg}
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={{ fontSize: 32 }}>📚</span>
          <span style={s.logoText}>منصة المدرس</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ ...s.navBtn, ...(tab === t.id ? s.navBtnActive : {}) }}
            >
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        {stats && (
          <div style={s.sideStats}>
            <div style={s.sideStatItem}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>إجمالي الطلاب</span>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>{stats.total_students}</span>
            </div>
            <div style={s.sideStatItem}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>دفعوا الشهر</span>
              <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 22 }}>{stats.paid_this_month}</span>
            </div>
            <div style={s.sideStatItem}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>لسه مدفعوش</span>
              <span style={{ color: "#f87171", fontWeight: 700, fontSize: 22 }}>{stats.unpaid_this_month}</span>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>

        {/* ════ DASHBOARD ════ */}
        {tab === "dashboard" && (
          <div>
            <h1 style={s.pageTitle}>لوحة التحكم</h1>
            {stats && (
              <div style={s.statGrid}>
                <StatCard icon="👥" label="إجمالي الطلاب" value={stats.total_students} color="#6366f1" />
                <StatCard icon="✅" label="دفعوا الشهر ده" value={stats.paid_this_month} color="#22c55e" />
                <StatCard icon="❌" label="لسه مدفعوش" value={stats.unpaid_this_month} color="#ef4444" />
                <StatCard
                  icon="📈"
                  label="نسبة الدفع"
                  value={stats.total_students ? Math.round((stats.paid_this_month / stats.total_students) * 100) + "%" : "0%"}
                  color="#f59e0b"
                />
              </div>
            )}
            <div style={{ marginTop: 32 }}>
              <h2 style={s.sectionTitle}>آخر الطلاب المضافين</h2>
              <div style={s.cardGrid}>
                {students.slice(0, 6).map(st => (
                  <StudentCard key={st.id} student={st} onEdit={openEdit} onDelete={deleteStudent} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════ STUDENTS ════ */}
        {tab === "students" && (
          <div>
            <div style={s.pageHeader}>
              <h1 style={s.pageTitle}>الطلاب</h1>
              <button style={s.primaryBtn} onClick={() => { setEditingStudent(null); setStudentForm({ name: "", grade: "", notes: "" }); setShowStudentModal(true); }}>
                + طالب جديد
              </button>
            </div>

            {/* Filters */}
            <div style={s.filterRow}>
              <input
                placeholder="🔍 ابحث باسم الطالب..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={s.input}
              />
              <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} style={s.select}>
                <option value="">كل المراحل</option>
                {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>

            <div style={s.cardGrid}>
              {students.length === 0
                ? <p style={{ color: "#94a3b8" }}>مفيش طلاب</p>
                : students.map(st => (
                  <StudentCard key={st.id} student={st} onEdit={openEdit} onDelete={deleteStudent} />
                ))}
            </div>
          </div>
        )}

        {/* ════ PAYMENT ════ */}
        {tab === "payment" && (
          <div>
            <h1 style={s.pageTitle}>تسجيل دفع</h1>
            <div style={s.formCard}>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>الطالب</label>
                  <select
                    style={s.select}
                    value={payForm.student_id}
                    onChange={e => setPayForm(p => ({ ...p, student_id: e.target.value }))}
                  >
                    <option value="">اختار الطالب</option>
                    {students.map(st => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>الشهر</label>
                  <select style={s.select} value={payForm.month} onChange={e => setPayForm(p => ({ ...p, month: +e.target.value }))}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>السنة</label>
                  <select style={s.select} value={payForm.year} onChange={e => setPayForm(p => ({ ...p, year: +e.target.value }))}>
                    {[2024, 2025, 2026, 2027, 2028, 2029].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <button style={{ ...s.primaryBtn, marginTop: 16, width: "100%" }} onClick={submitPayment}>
                💰 تسجيل الدفع
              </button>
            </div>

            {/* Quick payment status */}
            <h2 style={{ ...s.sectionTitle, marginTop: 32 }}>حالة الطلاب - {MONTHS[currentMonth - 1]} {currentYear}</h2>
            <div style={s.cardGrid}>
              {students.map(st => (
                <div key={st.id} style={{ ...s.studentCard, borderRight: `4px solid ${st.has_paid_current_month === "Paid" ? "#22c55e" : "#ef4444"}` }}>
                  <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{st.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{GRADES.find(g => g.value === st.grade)?.label}</div>
                  <div style={{ marginTop: 8, fontWeight: 600, color: st.has_paid_current_month === "Paid" ? "#4ade80" : "#f87171" }}>
                    {st.has_paid_current_month === "Paid" ? "✅ دفع" : "❌ لسه"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ REPORT ════ */}
        {tab === "report" && (
          <div>
            <h1 style={s.pageTitle}>تقرير الدفع</h1>
            <div style={s.formCard}>
              <div style={s.filterRow}>
                <select style={s.select} value={reportMonth} onChange={e => setReportMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select style={s.select} value={reportYear} onChange={e => setReportYear(+e.target.value)}>
                  {[2024, 2025, 2026, 2027, 2028, 2029].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button style={s.primaryBtn} onClick={fetchReport}>
                  {loadingReport ? "جاري..." : "📊 عرض التقرير"}
                </button>
              </div>
            </div>

            {report && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
                <div style={s.reportColumn}>
                  <h2 style={{ ...s.sectionTitle, color: "#4ade80" }}>✅ دفعوا ({report.paid?.length})</h2>
                  {report.paid?.map(st => (
                    <div key={st.id} style={s.reportItem}>
                      <span style={{ color: "#f1f5f9" }}>{st.name}</span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{GRADES.find(g => g.value === st.grade)?.label}</span>
                    </div>
                  ))}
                  {report.paid?.length === 0 && <p style={{ color: "#94a3b8" }}>محدش دفع</p>}
                </div>
                <div style={s.reportColumn}>
                  <h2 style={{ ...s.sectionTitle, color: "#f87171" }}>❌ مدفعوش ({report.unpaid?.length})</h2>
                  {report.unpaid?.map(st => (
                    <div key={st.id} style={s.reportItem}>
                      <span style={{ color: "#f1f5f9" }}>{st.name}</span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{GRADES.find(g => g.value === st.grade)?.label}</span>
                    </div>
                  ))}
                  {report.unpaid?.length === 0 && <p style={{ color: "#94a3b8" }}>الكل دفع 🎉</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ GRADES ════ */}
        {tab === "grades" && (
          <div>
            <h1 style={s.pageTitle}>المراحل الدراسية</h1>
            <div style={s.cardGrid}>
              {grades.map(g => (
                <div key={g.grade} style={s.gradeCard}>
                  <div style={s.gradeTitle}>{g.grade}</div>
                  <div style={s.gradeCount}>{g.students?.length ?? 0} طالب</div>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {g.students?.slice(0, 4).map(st => (
                      <div key={st.id} style={s.gradeStudent}>
                        <span>{st.name}</span>
                        <span style={{ color: st.has_paid_current_month === "Paid" ? "#4ade80" : "#f87171", fontSize: 12 }}>
                          {st.has_paid_current_month === "Paid" ? "✅" : "❌"}
                        </span>
                      </div>
                    ))}
                    {(g.students?.length ?? 0) > 4 && (
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>+{g.students.length - 4} أكتر...</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── STUDENT MODAL ── */}
      {showStudentModal && (
        <div style={s.overlay} onClick={() => setShowStudentModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#f1f5f9", marginBottom: 20 }}>
              {editingStudent ? "تعديل الطالب" : "طالب جديد"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={s.formGroup}>
                <label style={s.label}>الاسم</label>
                <input
                  style={s.input}
                  placeholder="اسم الطالب"
                  value={studentForm.name}
                  onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>المرحلة</label>
                <select
                  style={s.select}
                  value={studentForm.grade}
                  onChange={e => setStudentForm(p => ({ ...p, grade: e.target.value }))}
                >
                  <option value="">اختار المرحلة</option>
                  {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>ملاحظات</label>
                <textarea
                  style={{ ...s.input, height: 80, resize: "vertical" }}
                  placeholder="ملاحظات (اختياري)"
                  value={studentForm.notes}
                  onChange={e => setStudentForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button style={{ ...s.primaryBtn, flex: 1 }} onClick={submitStudent}>
                {editingStudent ? "حفظ التعديلات" : "إضافة الطالب"}
              </button>
              <button style={{ ...s.dangerBtn, flex: 1 }} onClick={() => setShowStudentModal(false)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{label}</div>
      <div style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function StudentCard({ student, onEdit, onDelete }) {
  const paid = student.has_paid_current_month === "Paid";
  const gradeName = GRADES.find(g => g.value === student.grade)?.label || student.grade;
  return (
    <div style={{ ...s.studentCard, borderRight: `4px solid ${paid ? "#22c55e" : "#ef4444"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 16 }}>{student.name}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{gradeName}</div>
        </div>
        <span style={{ color: paid ? "#4ade80" : "#f87171", fontSize: 13, fontWeight: 600 }}>
          {paid ? "✅ دفع" : "❌ لسه"}
        </span>
      </div>
      {student.notes && <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>{student.notes}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button style={s.editBtn} onClick={() => onEdit(student)}>تعديل</button>
        <button style={s.deleteBtn} onClick={() => onDelete(student.id)}>حذف</button>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────
const s = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f172a",
    fontFamily: "'Cairo', 'Segoe UI', sans-serif",
    direction: "rtl",
  },
  sidebar: {
    width: 240,
    background: "#1e293b",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    borderLeft: "1px solid #334155",
    flexShrink: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 8px 16px",
    borderBottom: "1px solid #334155",
  },
  logoText: {
    color: "#f1f5f9",
    fontWeight: 800,
    fontSize: 18,
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s",
    textAlign: "right",
    fontFamily: "'Cairo', sans-serif",
  },
  navBtnActive: {
    background: "#6366f1",
    color: "#fff",
  },
  sideStats: {
    marginTop: "auto",
    background: "#0f172a",
    borderRadius: 12,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sideStatItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  main: {
    flex: 1,
    padding: 32,
    overflowY: "auto",
  },
  pageTitle: {
    color: "#f1f5f9",
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 24,
    margin: "0 0 24px 0",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: 700,
    margin: "0 0 16px 0",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  statCard: {
    background: "#1e293b",
    borderRadius: 16,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
  },
  studentCard: {
    background: "#1e293b",
    borderRadius: 14,
    padding: 18,
    border: "1px solid #334155",
  },
  gradeCard: {
    background: "#1e293b",
    borderRadius: 14,
    padding: 20,
    border: "1px solid #334155",
  },
  gradeTitle: {
    color: "#6366f1",
    fontWeight: 800,
    fontSize: 18,
    marginBottom: 4,
  },
  gradeCount: {
    color: "#94a3b8",
    fontSize: 13,
    marginBottom: 8,
    borderBottom: "1px solid #334155",
    paddingBottom: 8,
  },
  gradeStudent: {
    display: "flex",
    justifyContent: "space-between",
    color: "#cbd5e1",
    fontSize: 13,
    padding: "4px 0",
  },
  formCard: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 24,
    border: "1px solid #334155",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    fontFamily: "'Cairo', sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  select: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    fontFamily: "'Cairo', sans-serif",
    cursor: "pointer",
    width: "100%",
  },
  filterRow: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  primaryBtn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "'Cairo', sans-serif",
    whiteSpace: "nowrap",
  },
  dangerBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "'Cairo', sans-serif",
  },
  editBtn: {
    background: "#334155",
    color: "#f1f5f9",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'Cairo', sans-serif",
  },
  deleteBtn: {
    background: "#450a0a",
    color: "#f87171",
    border: "none",
    borderRadius: 8,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "'Cairo', sans-serif",
  },
  reportColumn: {
    background: "#1e293b",
    borderRadius: 14,
    padding: 20,
    border: "1px solid #334155",
  },
  reportItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #1e293b",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#1e293b",
    borderRadius: 20,
    padding: 32,
    width: 420,
    border: "1px solid #334155",
  },
  toast: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    color: "#fff",
    padding: "12px 28px",
    borderRadius: 12,
    fontWeight: 700,
    zIndex: 9999,
    fontSize: 15,
    fontFamily: "'Cairo', sans-serif",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
};