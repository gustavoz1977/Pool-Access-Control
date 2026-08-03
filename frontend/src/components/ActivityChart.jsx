import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ActivityChart({ data }) {
  return (
    <div className="activity-chart">
      <h3>📊 Actividad Últimos 7 Días</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="logins" 
            stroke="#667eea" 
            strokeWidth={2}
            dot={{ fill: '#667eea', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
