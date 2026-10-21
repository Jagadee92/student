import { useEffect, useState } from "react";
import { Activity, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import PageHeader from "../components/PageHeader.jsx";
import Notice from "../components/Notice.jsx";
import Loading from "../components/Loading.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Card from "../components/Card.jsx";
import { getProgramLabel } from "../utils/academicOptions.js";

const EMPTY_STATS = {
  totalStudents: 0,
  studentsByStatus: { enrolled: 0, completed: 0, withdrawn: 0 },
  departmentDistribution: [],
  recentStudents: [],
};

function StatCard({ title, value, note, icon: Icon, color }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${color}`}>
        <Icon size={21} />
      </span>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    async function loadDashboard() {
      setLoading(true);
      try {
        const data = await api("/dashboard");
        if (isActive) setStats({ ...EMPTY_STATS, ...data });
      } catch (loadError) {
        if (isActive) setError(loadError.message);
      } finally {
        if (isActive) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      isActive = false;
    };
  }, []);

  const enrollmentTotal = Object.values(stats.studentsByStatus || {}).reduce(
    (total, count) => total + count,
    0,
  );
  const biggestDepartmentCount = Math.max(
    1,
    ...stats.departmentDistribution.map((department) => department.count),
  );

  return (
    <div className="container workspace-container">
      <PageHeader
        eyebrow="OVERVIEW"
        title="Dashboard"
        description="A quick overview of student records, departments, and recent activity."
        action={
          <Link to="/students" className="button button-primary">
            Manage students
          </Link>
        }
      />
      <Notice type="error">{error}</Notice>
      {loading ? (
        <Loading label="Loading dashboard statistics..." />
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              title="Registered students"
              value={stats.totalStudents}
              note="Student records"
              icon={Users}
              color="purple"
            />
            <StatCard
              title="Enrolled students"
              value={stats.studentsByStatus.enrolled || 0}
              note="Current enrolments"
              icon={GraduationCap}
              color="green"
            />
            <StatCard
              title="Departments"
              value={stats.departmentDistribution.length}
              note="Branch and course or program groups"
              icon={Activity}
              color="blue"
            />
          </div>

          <div className="dashboard-grid">
            <Card
              title="Branch and course distribution"
              description="Students grouped by branch or department and course or program"
              className="dashboard-chart"
              action={
                <Link to="/students" className="text-link">
                  Manage students →
                </Link>
              }
            >
              {stats.departmentDistribution.length ? (
                <div className="bar-list">
                  {stats.departmentDistribution.map((item) => (
                    <div
                      className="bar-row"
                      key={`${item.department}-${item.degree}`}
                    >
                      <div className="bar-label">
                        <span>
                          {item.department} · {getProgramLabel(item.degree)}
                        </span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="bar-track">
                        <span
                          style={{
                            width: `${(item.count / biggestDepartmentCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-inline">
                  <GraduationCap size={26} />
                  <strong>No course or branch statistics yet</strong>
                  <span>
                    Add student records with branches and courses or programs to see distribution.
                  </span>
                </div>
              )}
            </Card>

            <Card
              title="Enrolment status"
              description="Student records by current status"
              className="dashboard-chart"
            >
              <div className="status-summary">
                {[
                  ["enrolled", "Enrolled"],
                  ["completed", "Completed"],
                  ["withdrawn", "Withdrawn"],
                ].map(([key, label]) => {
                  const count = stats.studentsByStatus[key] || 0;
                  const percent = enrollmentTotal
                    ? Math.round((count / enrollmentTotal) * 100)
                    : 0;
                  return (
                    <div className="status-summary-row" key={key}>
                      <div className="status-summary-label">
                        <StatusBadge value={key} />
                        <span>{count} students</span>
                      </div>
                      <div className="mini-bar-track">
                        <span
                          className={`mini-bar-${key}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <strong>{percent}%</strong>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <section className="panel recent-panel">
            <div className="panel-heading">
              <div>
                <h2>Recently registered students</h2>
                <p>Latest student records from the database</p>
              </div>
              <Link to="/students" className="text-link">
                Open student directory →
              </Link>
            </div>
            {stats.recentStudents.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Branch / course</th>
                      <th>Status</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="student-cell">
                            <div className="student-avatar">
                              {student.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <strong>{student.name}</strong>
                              <small>{student.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{student.department} · {getProgramLabel(student.degree)}</td>
                        <td>
                          <StatusBadge value={student.status} />
                        </td>
                        <td>
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-inline">
                <Users size={26} />
                <strong>No students registered yet</strong>
                <span>New records will appear here when they are added.</span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
