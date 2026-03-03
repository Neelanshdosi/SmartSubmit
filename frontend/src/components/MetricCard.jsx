function MetricCard({ title, value, color = "", onClick, clickable }) {
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => e.key === "Enter" && onClick?.() : undefined}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: clickable ? 'pointer' : 'default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
      className={`hover:bg-white/[0.06] hover:border-white/20 transition-all ${color}`}
    >
      <p style={{
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'rgba(255, 255, 255, 0.5)',
        margin: 0
      }}>
        {title}
      </p>
      <p style={{
        fontSize: '2.25rem',
        fontWeight: 800,
        color: '#ffffff',
        marginTop: '8px',
        margin: 0
      }}>
        {value}
      </p>
    </div>
  );
}

export default MetricCard;
