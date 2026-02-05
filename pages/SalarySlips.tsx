
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { formatCurrency, exportDualReports } from '../utils';
import { Teacher, Grade, PaymentType } from '../types';

const SalarySlips: React.FC = () => {
  const { teachers, schedules, teacherPayments, academyInfo } = useStore();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const YEARS = ['2024', '2025', '2026', '2027'];

  const selectedTeacher = useMemo(() => teachers.find(t => t.id === selectedTeacherId), [selectedTeacherId, teachers]);

  const teacherHistory = useMemo(() => {
    if (!selectedTeacherId) return [];
    return teacherPayments
      .filter(p => p.teacherId === selectedTeacherId)
      .sort((a,b) => b.date.localeCompare(a.date));
  }, [selectedTeacherId, teacherPayments]);

  const monthlyBreakdown = useMemo(() => {
    if (!selectedTeacherId) return [];
    return schedules.filter(s => 
      s.teacherId === selectedTeacherId && 
      s.month === selectedMonth && 
      s.year === selectedYear
    ).sort((a,b) => a.date.localeCompare(b.date));
  }, [selectedTeacherId, selectedMonth, selectedYear, schedules]);

  const summary = useMemo(() => {
    const totalHours = monthlyBreakdown.reduce((acc, s) => acc + s.totalHours, 0);
    const totalPayable = monthlyBreakdown.reduce((acc, s) => {
      const rate = s.rateOverride || selectedTeacher?.rate || 0;
      return acc + (selectedTeacher?.paymentType === PaymentType.HOURLY ? s.totalHours * rate : rate / (monthlyBreakdown.length || 1));
    }, 0);
    return { totalHours, totalPayable, count: monthlyBreakdown.length };
  }, [monthlyBreakdown, selectedTeacher]);

  const handleDownloadSlip = () => {
    if (!selectedTeacher) return;
    const headers = ['Date', 'Grade', 'Subject', 'Time', 'Duration', 'Rate Applied', 'Earned'];
    const data = monthlyBreakdown.map(s => {
      const rate = s.rateOverride || selectedTeacher.rate || 0;
      const earned = selectedTeacher.paymentType === PaymentType.HOURLY 
        ? s.totalHours * rate 
        : rate / (monthlyBreakdown.length || 1);
      
      return [
        s.date,
        `Grade ${s.grade}`,
        s.subject,
        `${s.startTime} - ${s.endTime}`,
        `${s.totalHours} hr`,
        formatCurrency(rate),
        formatCurrency(earned)
      ];
    });

    data.push([
      'TOTAL',
      '',
      '',
      '',
      `${summary.totalHours.toFixed(2)} hrs`,
      '',
      formatCurrency(summary.totalPayable)
    ]);

    exportDualReports(
      academyInfo, 
      `Salary Breakdown - ${selectedTeacher.name} (${selectedMonth} ${selectedYear})`, 
      headers, 
      data, 
      `Salary_Slip_${selectedTeacher.name.replace(/\s/g, '_')}_${selectedMonth}`
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Individual Salary Slips</h1>
        <p className="text-gray-500">View and download detailed class-by-class earning breakdowns for teachers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Teacher Selection */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Select Teacher</label>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {teachers.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${selectedTeacherId === t.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 hover:border-indigo-100 bg-gray-50/30'}`}
                  >
                    <p className="font-bold text-gray-800 truncate">{t.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{t.subject}</p>
                  </button>
                ))}
              </div>
           </div>

           {selectedTeacher && (
             <div className="bg-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-black mb-4">
                  {selectedTeacher.name.charAt(0)}
                </div>
                <h3 className="font-bold text-lg leading-tight">{selectedTeacher.name}</h3>
                <p className="text-indigo-200 text-xs mb-6">{selectedTeacher.subject} Expert</p>
                <div className="space-y-3 pt-6 border-t border-white/10">
                   <div className="flex justify-between text-xs">
                      <span className="opacity-60">Payment Model</span>
                      <span className="font-bold">{selectedTeacher.paymentType}</span>
                   </div>
                   <div className="flex justify-between text-xs">
                      <span className="opacity-60">Standard Rate</span>
                      <span className="font-bold">{formatCurrency(selectedTeacher.rate)}</span>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Main Content: Breakdown View */}
        <div className="lg:col-span-3 space-y-6">
           {selectedTeacherId ? (
             <div className="space-y-6">
               {/* Controls */}
               <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-4">
                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 bg-gray-50 rounded-xl font-bold text-sm outline-none">
                       {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-2 bg-gray-50 rounded-xl font-bold text-sm outline-none">
                       {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <button 
                    disabled={monthlyBreakdown.length === 0}
                    onClick={handleDownloadSlip}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-file-pdf"></i> Download Slip
                  </button>
               </div>

               {/* Snapshot */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earned</p>
                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(summary.totalPayable)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Classes Done</p>
                    <p className="text-2xl font-black text-gray-800">{summary.count}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Hours</p>
                    <p className="text-2xl font-black text-indigo-600">{summary.totalHours.toFixed(2)}</p>
                  </div>
               </div>

               {/* Detailed Table */}
               <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Per-Class Earning Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/80 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase">Date</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase">Grade & Subject</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase">Duration</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase">Rate</th>
                          <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase text-right">Earning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {monthlyBreakdown.map(s => {
                          const rate = s.rateOverride || selectedTeacher?.rate || 0;
                          const earned = selectedTeacher?.paymentType === PaymentType.HOURLY 
                            ? s.totalHours * rate 
                            : rate / (monthlyBreakdown.length || 1);
                          return (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-700 text-sm">{s.date}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Grade {s.grade}</span>
                                   <span className="font-bold text-gray-800 text-sm">{s.subject}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-gray-500">{s.totalHours} hrs</td>
                              <td className="px-6 py-4 text-xs font-medium text-gray-400">{formatCurrency(rate)}</td>
                              <td className="px-6 py-4 text-right font-black text-indigo-600 text-sm">{formatCurrency(earned)}</td>
                            </tr>
                          );
                        })}
                        {monthlyBreakdown.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-20 text-center text-gray-400 italic text-sm">No classes found for the selected period.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-40 bg-white rounded-3xl border-2 border-dashed border-gray-200 text-gray-400">
                <i className="fa-solid fa-chalkboard-user text-5xl mb-4 opacity-20"></i>
                <p className="font-medium">Please select a teacher from the left sidebar to view salary breakdown.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SalarySlips;
