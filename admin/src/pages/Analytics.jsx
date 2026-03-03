import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getAnalytics } from '../api/analytics';

const RANGES = [
  { label: '7 days',  value: 7  },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const SummaryCard = ({ label, value, prefix = '', color }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="stat-value" style={{ color }}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="content-card" style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
    {children}
  </div>
);

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
};

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [days, setDays]     = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    setLoading(true); setError('');
    getAnalytics(days)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Analytics</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Platform performance over time</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={'btn ' + (days === r.value ? 'btn-primary' : 'btn-ghost')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="stat-card" style={{ height: '90px', opacity: 0.4 }} />)}
        </div>
      ) : data && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <SummaryCard label={`Revenue (${days}d)`}  value={data.summary.revenue}  prefix="$" color="#10b981" />
            <SummaryCard label={`New Users (${days}d)`} value={data.summary.newUsers}             color="#38bdf8" />
            <SummaryCard label={`Jobs Posted (${days}d)`} value={data.summary.newJobs}            color="#a78bfa" />
            <SummaryCard label={`Bids Placed (${days}d)`} value={data.summary.newBids}            color="#fb923c" />
          </div>

          {/* Revenue Chart */}
          <ChartCard title="💰 Revenue Over Time (USD)">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.charts.revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} tickFormatter={v => '$' + v} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => ['$' + v, 'Revenue']} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* New Users Chart */}
          <ChartCard title="👥 New Users Over Time">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.charts.users}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'New Users']} />
                <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Jobs & Bids side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <ChartCard title="📋 Jobs Posted">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.charts.jobs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Jobs']} />
                  <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="📤 Bids Placed">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.charts.bids}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Bids']} />
                  <Bar dataKey="value" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
