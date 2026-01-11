
import React from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { teachers, students, studentPayments, schedules } = useStore();

  const stats = [
    { label: 'Active Students', value: students.filter(s => s.status === 'Active').length, icon: 'fa-user-graduate', color: 'bg-blue-500' },
    { label: 'Teachers', value: teachers.length, icon: 'fa-chalkboard-user', color: 'bg-indigo-500' },
    // Fixed: Corrected property name to paidAmount
    { label: 'Total Revenue', value: formatCurrency(studentPayments.reduce((acc, p) => acc + p.paidAmount, 0)), icon: 'fa-sack-dollar', color: 'bg-emerald-500' },
    { label: 'Classes this Month', value: schedules.length, icon: 'fa-calendar-check', color: 'bg-amber-500' },
  ];

  const chartData = [
    { name: 'Grade 6', count: students.filter(s => s.grade === '6').length },
    { name: 'Grade 7', count: students.filter(s => s.grade === '7').length },
    { name: 'Grade 8', count: students.filter(s => s.grade === '8').length },
    { name: 'Grade 9', count: students.filter(s => s.grade === '9').length },
    { name: 'Grade 10', count: students.filter(s => s.grade === '10').length },
    { name: 'Grade 11', count: students.filter(s => s.grade === '11').length },
  ];

  const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome to MECDA Class Management System.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
           <i className="fa-solid fa-clock text-indigo-500"></i>
           <span className="font-medium text-gray-600">{new Date().toLocaleDateString('en-GB', { dateStyle: 'long' })}</span>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`${stat.color} w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl`}>
              <i className={`fa-solid ${stat.icon}`}></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Students Distribution by Grade</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Recent Payments</h3>
          <div className="space-y-4">
            {studentPayments.slice(-5).reverse().map((p, i) => {
              const student = students.find(s => s.id === p.studentId);
              return (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {student?.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{student?.name}</p>
                    <p className="text-xs text-gray-500">{p.month}</p>
                  </div>
                  <div className="text-right">
                    {/* Fixed: Corrected property name to paidAmount */}
                    <p className="text-sm font-bold text-emerald-600">+{formatCurrency(p.paidAmount)}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{p.date}</p>
                  </div>
                </div>
              );
            })}
            {!studentPayments.length && <p className="text-gray-400 text-center py-10">No recent payments</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
