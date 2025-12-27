
import React, { useMemo } from 'react';
import { useStore } from '../store';
import { exportDualReports, formatCurrency } from '../utils';

const Reports: React.FC = () => {
  const { studentPayments, students, teachers, schedules, teacherPayments, academyInfo } = useStore();

  const handleExportPayments = () => {
    const headers = ['Payment ID', 'Student Name', 'Student ID', 'Grade', 'Month', 'Amount', 'Date', 'Status'];
    const data = studentPayments.map(p => {
      const student = students.find(s => s.id === p.studentId);
      return [
        p.id,
        student?.name || 'Unknown',
        p.studentId,
        'Grade ' + p.grade,
        p.month,
        formatCurrency(p.amount),
        p.date,
        p.status
      ];
    });
    exportDualReports(academyInfo, 'Student Payment Collection Report', headers, data, `Student_Payments_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportTeachers = () => {
    const headers = ['Teacher ID', 'Teacher Name', 'Subject', 'Grades', 'Payment Type', 'Rate', 'Contact', 'Status'];
    const data = teachers.map(t => [
       t.id,
       t.name,
       t.subject,
       t.grades.join(', '),
       t.paymentType,
       formatCurrency(t.rate),
       t.whatsapp,
       t.status
    ]);
    exportDualReports(academyInfo, 'Teacher Directory & Compensation Report', headers, data, `Teacher_Records_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportTeacherPayments = () => {
    const headers = ['Payment ID', 'Teacher Name', 'Teacher ID', 'Month', 'Total Classes', 'Total Hours', 'Rate', 'Payable', 'Paid', 'Date'];
    const data = teacherPayments.map(p => {
      const teacher = teachers.find(t => t.id === p.teacherId);
      const rate = teacher ? `${formatCurrency(teacher.rate)} / ${teacher.paymentType === 'Hourly' ? 'hr' : 'mo'}` : 'N/A';
      return [
        p.id,
        teacher?.name || 'Unknown',
        p.teacherId,
        p.month,
        p.totalClasses,
        p.totalHours,
        rate,
        formatCurrency(p.amountPayable),
        formatCurrency(p.amountPaid),
        p.date
      ];
    });
    exportDualReports(academyInfo, 'Teacher Monthly Salary & Hours Report', headers, data, `Teacher_Payments_Detailed_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportSchedule = () => {
    const headers = ['Date', 'Grade', 'Subject', 'Teacher Name', 'Teacher ID', 'Time', 'Duration'];
    const data = schedules.map(s => {
      const teacher = teachers.find(t => t.id === s.teacherId);
      return [
        s.date,
        'Grade ' + s.grade,
        s.subject,
        teacher?.name || 'Unknown',
        s.teacherId,
        `${s.startTime} - ${s.endTime}`,
        s.totalHours + ' hr'
      ];
    });
    exportDualReports(academyInfo, 'Class Schedule & Logs Report', headers, data, `Class_Logs_${new Date().toISOString().split('T')[0]}`);
  };

  const totalTeacherPayout = useMemo(() => teacherPayments.reduce((acc, p) => acc + p.amountPaid, 0), [teacherPayments]);
  const totalCollections = useMemo(() => studentPayments.reduce((acc, p) => acc + p.amount, 0), [studentPayments]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Generating simultaneous PDF and Excel reports for your records.</p>
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1">
              <i className="fa-solid fa-file-pdf"></i> PDF
           </div>
           <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100 flex items-center gap-1">
              <i className="fa-solid fa-file-excel"></i> Excel
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard 
          title="Student Payments" 
          desc="Complete fee collection history with student names and IDs."
          icon="fa-file-invoice-dollar"
          color="text-emerald-500"
          onExport={handleExportPayments}
        />
        <ReportCard 
          title="Teacher Records" 
          desc="Directory and payment settings for all active and inactive staff."
          icon="fa-chalkboard-user"
          color="text-indigo-500"
          onExport={handleExportTeachers}
        />
        <ReportCard 
          title="Teacher Payments" 
          desc="Calculated monthly salary reports based on class schedule logs."
          icon="fa-money-check-dollar"
          color="text-indigo-600"
          onExport={handleExportTeacherPayments}
        />
        <ReportCard 
          title="Class Log Report" 
          desc="Logbook of all scheduled classes, hours, and assigned teachers."
          icon="fa-calendar-days"
          color="text-blue-500"
          onExport={handleExportSchedule}
        />
        <ReportCard 
          title="Attendance Summary" 
          desc="Overview of student presence across all grades and dates."
          icon="fa-clipboard-check"
          color="text-amber-500"
          onExport={() => alert('Attendance report coming soon!')}
        />
        <ReportCard 
          title="Financial Summary" 
          desc="Revenue vs Expense summary highlighting the net operational balance."
          icon="fa-chart-pie"
          color="text-purple-500"
          onExport={() => alert('Financial PDF/Excel Generation in progress...')}
        />
      </div>

      {/* Financial Overview Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-chart-line text-indigo-500"></i>
            <h2 className="font-bold text-gray-700">Financial Snapshot</h2>
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Live Data</span>
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
