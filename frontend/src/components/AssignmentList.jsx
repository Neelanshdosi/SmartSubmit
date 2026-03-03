import PriorityBadge from "./PriorityBadge";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
};

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function sortByPriority(assignments) {
  return [...assignments].sort(
    (a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );
}

function filterByPriority(assignments, filter) {
  if (!filter || filter === "all") return assignments;
  return assignments.filter((a) => a.priority === filter);
}

function AssignmentList({ assignments, filter = "all", loading }) {
  const filtered = filterByPriority(assignments, filter);
  const sorted = sortByPriority(filtered);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-slate-500">No assignments to show</p>
    );
  }

  return (
    <ul className="space-y-4 transition-opacity duration-200">
      {sorted.map((a, i) => (
        <li
          key={`${a.title}-${a.course}-${a.due_date}-${i}`}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${a.priority === "HIGH"
              ? 'rgba(239, 68, 68, 0.2)'
              : a.priority === "MEDIUM"
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '12px',
            padding: '16px',
          }}
          className="transition-all hover:bg-white/[0.06] hover:border-white/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>{a.title}</p>
            <PriorityBadge priority={a.priority} />
          </div>
          <p style={{ marginTop: '4px', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
            {a.course}
          </p>
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Due: {formatDate(a.due_date)}
            </p>
            {a.is_submitted && (
              <span style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                Done
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default AssignmentList;
export { sortByPriority, filterByPriority };
