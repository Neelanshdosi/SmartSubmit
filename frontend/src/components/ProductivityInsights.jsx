import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

function ProductivityInsights({ stats }) {
  const completionRate = stats.completion_rate ?? 0;
  const lateAssignments = stats.late_assignments ?? 0;
  const mostPendingCourse = stats.most_pending_course ?? "—";

  const pieData = [
    { name: "Submitted", value: stats.submitted || 0, color: "#14B8A6" },
    { name: "Pending", value: stats.pending || 0, color: "#F97316" },
  ].filter((d) => d.value > 0);

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '24px',
    }}>
      <h2 style={{ color: '#fff', fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>
        Productivity Insights
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Completion Rate", value: `${completionRate}%`, color: "#fff" },
          { label: "Late Assignments", value: lateAssignments, color: "#fff" },
          { label: "Most Pending Course", value: mostPendingCourse, color: "#fff", truncate: true },
        ].map(({ label, value, color, truncate }) => (
          <div key={label} style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
              {label}
            </p>
            <p className={truncate ? "truncate" : ""} style={{
              marginTop: '4px',
              fontSize: truncate ? '1.125rem' : '1.5rem',
              fontWeight: 700,
              color: color
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>
      {pieData.length > 0 && (
        <div className="mt-6 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(0,0,0,0.85)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default ProductivityInsights;
