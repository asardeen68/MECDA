
import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { exportDualReports, formatCurrency } from '../utils';
import { Grade } from '../types';

const Reports: React.FC = () => {
  const { studentPayments, students, teachers, schedules, teacherPayments, academyInfo, attendance } = useStore();
  const [selectedReportMonth, setSelectedReportMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedReportYear, setSelectedReportYear] = useState<string>(new Date().getFullYear().toString());

  const handleExportAttendance = (grade: string | 'All') => {
    const headers = ['Student ID', 'Student Name', 'Grade', 'Subject', 'Total Classes', 'Attended', 'Percentage'];
    
    // Group attendance by student and subject
    const reportData: any[][] = [];
    const filteredStudents = students.filter(s => grade === 'All' || s.grade === grade);

    filteredStudents.forEach(student => {
      // Get all unique subjects for this grade
      const studentSchedules = schedules.filter(s => s.grade === student.grade && s.month === selectedReportMonth && s.year === selectedReportYear);
      const subjects = Array.from(new Set(studentSchedules.map(s => s.subject)));

      subjects.forEach(subject => {
        const subjectSchedules = studentSchedules.filter(s => s.subject === subject);
        const totalScheduled = subjectSchedules.length;
        if (totalScheduled === 0) return;

        const attended = attendance.filter(a => 
          a.studentId === student.id && 
          subjectSchedules.some(s => s.id === a.classId) && 
          a.isPresent
        ).length;

        const percentage = ((attended / totalScheduled) * 100).toFixed(1) + '%';

        reportData.push([
          student.id,
          student.name,
          `Grade ${student.grade}`,
          subject,
          totalScheduled,
          attended,
          percentage
        ]);
      });
    });

    exportDualReports(
      academyInfo, 
      `Attendance Summary - ${selectedReportMonth} ${selectedReportYear} (${grade === 'All' ? 'All Classes' : 'Grade ' + grade})`, 
      headers, 
      reportData, 
      `Attendance_Report_${selectedReportMonth}`
    );
  };

  const handleExportPayments = () => {
    const headers = ['Payment ID', 'Student Name', 'Grade', 'Month', 'Paid', 'Outstanding', 'Status'];
    const data = studentPayments
      .filter(p => p.month === selectedReportMonth && p.year === selectedReportYear)
      .map(p => {
        const student = students.find(s => s.id === p.studentId);
        return [
          p.id,
          student?.name || 'Unknown',
          'Grade ' + p.grade,
          p.month,
          formatCurrency(p.paidAmount),
          formatCurrency(p.outstandingAmount),
          p.status
        ];
      });
    exportDualReports(academyInfo, `Fee Collection Report - ${selectedReportMonth} ${selectedReportYear}`, headers, data, `Financial_Report_${selectedReportMonth}`);
  };

  const totalTeacherPayout = useMemo(() => teacherPayments.reduce((acc, p) => acc + p.amountPaid, 0), [teacherPayments]);
  const totalCollections = useMemo(() => studentPayments.reduce((acc, p) => acc + p.paidAmount, 0), [studentPayments]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Class-wise and Subject-wise operational summaries.</p>
        </div>
        <div className="flex gap-4 items-center bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
           <select value={selectedReportMonth} onChange={e => setSelectedReportMonth(e.target.value)} className="px-3 py-2 bg-gray-50 rounded-xl font-bold text-xs outline-none">
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
           </select>
           <select value={selectedReportYear} onChange={e => setSelectedReportYear(e.target.value)} className="px-3 py-2 bg-gray-50 rounded-xl font-bold text-xs outline-none">
              {['2024','2025','2026'].map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard 
          title="Attendance Summary" 
          desc="Monthly attendance percentage calculated subject-wise for all students."
          icon="fa-clipboard-check"
          color="text-amber-500"
          onExport={() => handleExportAttendance('All')}
        />
        <ReportCard 
          title="Fee Collections" 
          desc="Overview of paid and outstanding student fees for the selected period."
          icon="fa-file-invoice-dollar"
          color="text-emerald-500"
          onExport={handleExportPayments}
        />
        <ReportCard 
          title="Teacher Salaries" 
          desc="Detailed breakdown of hours worked and session rates per teacher."
          icon="fa-money-check-dollar"
          color="text-indigo-600"
          onExport={() => alert('Generating Detailed Teacher Payout Report...')}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Class-Specific Attendance Reports</h3>
        </div>
        <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
           {Object.values(Grade).map(g => (
             <button 
              key={g}
              onClick={() => handleExportAttendance(g)}
              className="p-6 bg-white border border-gray-100 rounded-3xl text-center hover:border-indigo-600 hover:shadow-lg transition-all group"
             >
                <i className="fa-solid fa-graduation-cap text-gray-300 group-hover:text-indigo-600 text-2xl mb-3 block"></i>
                <span className="font-black text-gray-700 block text-sm tracking-tighter">GRADE {g}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Financial Overview Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-chart-line text-indigo-500"></i>
            <h2 className="font-bold text-gray-700">Financial Snapshot</h2>
          </div>
        </div>
        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 font-bold text-sm uppercase mb-1 tracking-wider">Total Collections</p>
                  <p className="text-3xl font-black text-emerald-800">{formatCurrency(totalCollections)}</p>
                </div>
                <div className="text-emerald-200 text-5xl">
                  <i className="fa-solid fa-piggy-bank"></i>
                </div>
             </div>
             <div className="p-8 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-indigo-700 font-bold text-sm uppercase mb-1 tracking-wider">Teacher Payouts</p>
                  <p className="text-3xl font-black text-indigo-800">{formatCurrency(totalTeacherPayout)}</p>
                </div>
                <div className="text-indigo-200 text-5xl">
                  <i className="fa-solid fa-hand-holding-dollar"></i>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ReportCard: React.FC<{title: string, desc: string, icon: string, color: string, onExport: () => void}> = ({title, desc, icon, color, onExport}) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className={`w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl mb-5 ${color} group-hover:bg-white transition-colors shadow-inner`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h3 className="font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">{title}</h3>
    <p className="text-sm text-gray-500 mb-6 leading-relaxed h-12 overflow-hidden">{desc}</p>
    <button 
      onClick={onExport}
      className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all border border-gray-100 hover:border-indigo-600 shadow-sm flex items-center justify-center gap-2"
    >
      <i className="fa-solid fa-file-export"></i> Export PDF & Excel
    </button>
  </div>
);

export default Reports;
