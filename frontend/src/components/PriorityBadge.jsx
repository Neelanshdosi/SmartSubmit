const styles = {
  HIGH: "bg-red-100 text-red-800 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-green-100 text-green-800 border-green-200",
};

const labels = {
  HIGH: "🔴 HIGH",
  MEDIUM: "🟡 MEDIUM",
  LOW: "🟢 LOW",
};

function PriorityBadge({ priority }) {
  const style = styles[priority] || styles.LOW;
  const label = labels[priority] || "LOW";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}

export default PriorityBadge;
