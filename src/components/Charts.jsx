import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, Typography, Box } from '@mui/material';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Reusable chart wrapper components for the dashboard.
 *
 * Usage:
 *   <AreaChartCard title="Revenue" data={[{name: 'Jan', value: 400}]} dataKey="value" />
 *   <BarChartCard title="Expenses" data={data} dataKey="amount" />
 *   <PieChartCard title="Categories" data={[{name: 'A', value: 40}]} />
 */

export const AreaChartCard = ({ title, data = [], dataKey = 'value', color = '#16a34a', height = 280 }) => (
  <Card elevation={0} className="border border-slate-200 rounded-2xl p-5">
    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', mb: 2 }}>{title}</Typography>
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#gradient-${dataKey})`} strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

export const BarChartCard = ({ title, data = [], dataKey = 'value', color = '#0ea5e9', height = 280 }) => (
  <Card elevation={0} className="border border-slate-200 rounded-2xl p-5">
    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', mb: 2 }}>{title}</Typography>
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </Card>
);

export const PieChartCard = ({ title, data = [], height = 280 }) => (
  <Card elevation={0} className="border border-slate-200 rounded-2xl p-5">
    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', mb: 2 }}>{title}</Typography>
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }} />
        <Legend wrapperStyle={{ fontSize: '0.8rem', fontWeight: 600 }} />
      </PieChart>
    </ResponsiveContainer>
  </Card>
);
