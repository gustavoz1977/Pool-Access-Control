export default function StatsCard({ icon, label, value, color = '#667eea' }) {
  return (
    <div className="stats-card" style={{ borderLeftColor: color }}>
      <div className="stats-icon" style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
      <div className="stats-content">
        <p className="stats-label">{label}</p>
        <h3 className="stats-value">{value}</h3>
      </div>
    </div>
  );
}
