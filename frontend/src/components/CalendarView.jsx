import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import PriorityBadge from "./PriorityBadge";

function CalendarView({ assignments, loading }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  const assignmentsByDate = {};
  for (const a of assignments || []) {
    const d = a.due_date;
    if (!assignmentsByDate[d]) assignmentsByDate[d] = [];
    assignmentsByDate[d].push(a);
  }

  const offsetDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
  const dateStr = offsetDate.toISOString().slice(0, 10);
  const displayDateStr = dateStr.split('-').length === 3
    ? `${dateStr.split('-')[2]}/${dateStr.split('-')[1]}/${dateStr.split('-')[0].slice(-2)}`
    : dateStr;
  const dayAssignments = assignmentsByDate[dateStr] || [];
  const dayAssignmentsSorted = [...dayAssignments].sort((a, b) =>
    a.priority === "HIGH"
      ? -1
      : b.priority === "HIGH"
        ? 1
        : a.priority === "MEDIUM"
          ? -1
          : 1
  );

  const tileClassName = ({ date }) => {
    const tileOffset = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const d = tileOffset.toISOString().slice(0, 10);
    const hasAssignments = assignmentsByDate[d]?.length > 0;
    const hasHigh = assignmentsByDate[d]?.some((a) => a.priority === "HIGH");
    if (hasHigh) return "has-high-priority";
    if (hasAssignments) return "has-assignments";
    return null;
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '16px',
      }}>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={tileClassName}
          className="rounded-lg border-0"
        />
      </div>
      <div className="min-w-0 flex-1" style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.125rem', fontWeight: 600, color: '#fff' }}>
          Assignments for {displayDateStr}
        </h3>
        {dayAssignmentsSorted.length === 0 ? (
          <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No assignments due this day</p>
        ) : (
          <ul className="space-y-3">
            {dayAssignmentsSorted.map((a, i) => (
              <li
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${a.priority === "HIGH"
                    ? 'rgba(239, 68, 68, 0.2)'
                    : a.priority === "MEDIUM"
                      ? 'rgba(245, 158, 11, 0.2)'
                      : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  padding: '12px',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontWeight: 500, color: '#fff' }}>{a.title}</span>
                  <PriorityBadge priority={a.priority} />
                </div>
                <p style={{ marginTop: '4px', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {a.course}
                </p>
                {a.is_submitted && (
                  <span style={{
                    marginTop: '8px',
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    color: '#4ade80',
                    background: 'rgba(34, 197, 94, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    ✓ Submitted
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`
        .react-calendar {
          background: transparent !important;
          border: none !important;
          color: #fff !important;
          font-family: inherit !important;
        }
        .react-calendar__navigation button {
          color: #fff !important;
          min-width: 44px;
          background: none;
          font-size: 16px;
          margin-top: 8px;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-radius: 8px;
        }
        .react-calendar__month-view__weekdays {
          color: rgba(255, 255, 255, 0.4) !important;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.75em;
        }
        .react-calendar__tile {
          color: #fff !important;
          border-radius: 8px;
          padding: 12px 6px !important;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
        .react-calendar__tile--now {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #fff !important;
        }
        .react-calendar__tile--active {
          background: #fff !important;
          color: #000 !important;
        }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #fff !important;
        }
        .react-calendar__tile.has-assignments {
          background: rgba(245, 158, 11, 0.2) !important;
          color: #fbbf24 !important;
        }
        .react-calendar__tile.has-high-priority {
          background: rgba(239, 68, 68, 0.2) !important;
          color: #f87171 !important;
        }
        .react-calendar__month-view__days__day--neighboringMonth {
          color: rgba(255, 255, 255, 0.15) !important;
        }
      `}</style>
    </div>
  );
}

export default CalendarView;
