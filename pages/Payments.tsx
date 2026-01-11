
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Grade, PaymentStatus, StudentPayment, TeacherPayment, PaymentType } from '../types';
import { formatCurrency, generateStudentPaymentMsg, sendWhatsAppMessage } from '../utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = ['2024', '2025', '2026', '2027'];
const DEFAULT_MONTHLY_FEE = 2000;

const Payments: React.FC = () => {
  const { 
    students, 
    addStudentPayment, 
    updateStudentPayment,
    deleteStudentPayment,
    studentPayments, 
    teachers, 
    schedules, 
    teacherPayments, 
    addTeacherPayment,
    updateTeacherPayment,
    deleteTeacherPayment
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('All');

  // Student Payment Form State
  const initialStudentForm: Omit<StudentPayment, 'id'> = {
    studentId: '',
    grade: Grade.G6,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    date: new Date().toISOString().split('T')[0],
    totalFee: DEFAULT_MONTHLY_FEE,
    paidAmount: 0,
    outstandingAmount: DEFAULT_MONTHLY_FEE,
    status: PaymentStatus.UNPAID,
    remarks: ''
  };

  const [studentFormData, setStudentFormData] = useState<Omit<StudentPayment, 'id'>>(initialStudentForm);

  // Auto-calculate Student Payment details
  useEffect(() => {
    const outstanding = Math.max(0, studentFormData.totalFee - studentFormData.paidAmount);
    let status = PaymentStatus.UNPAID;
    if (studentFormData.paidAmount >= studentFormData.totalFee && studentFormData.totalFee > 0) status = PaymentStatus.PAID;
    else if (studentFormData.paidAmount > 0) status = PaymentStatus.PARTIAL;

    if (studentFormData.outstandingAmount !== outstanding || studentFormData.status !== status) {
      setStudentFormData(prev => ({ ...prev, outstandingAmount: outstanding, status }));
    }
  }, [studentFormData.paidAmount, studentFormData.totalFee]);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPaymentId) {
      updateStudentPayment({ ...studentFormData, id: editingPaymentId });
    } else {
      addStudentPayment(studentFormData);
    }
    
    const student = students.find(s => s.id === studentFormData.studentId);
    if (student && !editingPaymentId) {
      const msg = generateStudentPaymentMsg(student, studentFormData);
      sendWhatsAppMessage(student.whatsapp, msg);
    }
    closeStudentModal();
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setEditingPaymentId(null);
    setStudentFormData(initialStudentForm);
  };

  const openEditStudentPayment = (p: StudentPayment) => {
    setEditingPaymentId(p.id);
    setStudentFormData(p);
    setShowStudentModal(true);
  };

  // Summaries calculation for all classes in selected month
  const classSummaries = useMemo(() => {
    const summaries: Record<string, any> = {};
    Object.values(Grade).forEach(grade => {
      const payments = studentPayments.filter(p => p.grade === grade && p.month === selectedMonth && p.year === selectedYear);
      const studentsInGrade = students.filter(s => s.grade === grade && s.status === 'Active');
      
      const collected = payments.reduce((acc, p) => acc + p.paidAmount, 0);
      // We use the actually entered fees for paid records, and the default for expected ones not yet paid
      const expectedFromUnpaid = (studentsInGrade.length - payments.length) * DEFAULT_MONTHLY_FEE;
      const totalOutstanding = payments.reduce((acc, p) => acc + p.outstandingAmount, 0) + expectedFromUnpaid;
      
      const fullyPaidCount = payments.filter(p => p.status === PaymentStatus.PAID).length;
      const partialCount = payments.filter(p => p.status === PaymentStatus.PARTIAL).length;
      const unpaidCount = studentsInGrade.length - fullyPaidCount - partialCount;

      summaries[grade] = {
        totalStudents: studentsInGrade.length,
        collected,
        outstanding: totalOutstanding,
        fullyPaid: fullyPaidCount,
        partial: partialCount,
        unpaid: unpaidCount
      };
    });
    return summaries;
  }, [studentPayments, students, selectedMonth, selectedYear]);

  // Filtering students in the modal based on selected grade
  const studentsInSelectedGrade = students.filter(s => s.grade === studentFormData.grade && s.status === 'Active');

  // Filtered payments for the table
  const filteredStudentPayments = studentPayments.filter(p => {
    const gradeMatch = selectedGradeFilter === 'All' || p.grade === selectedGradeFilter;
    const monthMatch = p.month === selectedMonth;
    const yearMatch = p.year === selectedYear;
    return gradeMatch && monthMatch && yearMatch;
  });

  // Teacher Salary Logic
  const [teacherFormData, setTeacherFormData] = useState<Omit<TeacherPayment, 'id'>>({
    teacherId: '',
    month: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    totalClasses: 0,
    totalHours: 0,
    amountPayable: 0,
    amountPaid: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [modalMonth, setModalMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [modalYear, setModalYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (showTeacherModal && teacherFormData.teacherId) {
      const teacherSchedules = schedules.filter(s => 
        s.teacherId === teacherFormData.teacherId && 
        s.month === modalMonth && 
        s.year === modalYear
      );
      
      const teacher = teachers.find(t => t.id === teacherFormData.teacherId);
      const totalHours = teacherSchedules.reduce((acc, s) => acc + s.totalHours, 0);
      const totalClasses = teacherSchedules.length;

      const amountPayable = teacherSchedules.reduce((acc, s) => {
        const rate = s.rateOverride || teacher?.rate || 0;
        return acc + (teacher?.paymentType === PaymentType.HOURLY ? s.totalHours * rate : rate / (totalClasses || 1));
      }, 0);

      setTeacherFormData(prev => ({
        ...prev,
        month: `${modalMonth} ${modalYear}`,
        totalClasses,
        totalHours,
        amountPayable,
        amountPaid: prev.amountPaid === 0 ? amountPayable : prev.amountPaid 
      }));
    }
  }, [teacherFormData.teacherId, modalMonth, modalYear, schedules, teachers, showTeacherModal]);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPaymentId) {
      updateTeacherPayment({ ...teacherFormData, id: editingPaymentId });
    } else {
      addTeacherPayment(teacherFormData);
    }
    setShowTeacherModal(false);
    setEditingPaymentId(null);
  };

  const filteredTeacherPayments = teacherPayments.filter(p => p.month === `${selectedMonth} ${selectedYear}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-500 text-sm">Managing records for {selectedMonth} {selectedYear}</p>
        </div>
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex">
          <button onClick={() => setActiveTab('students')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Student Fees</button>
          <button onClick={() => setActiveTab('teachers')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Teacher Salaries</button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Monthly Summaries Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(classSummaries).map(([grade, data]: [string, any]) => (
              <div key={grade} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-indigo-900 text-lg uppercase tracking-tight">Grade {grade}</h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black">{data.totalStudents} Students</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Collected</span>
                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(data.collected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Outstanding</span>
                    <span className="text-lg font-bold text-red-500">{formatCurrency(data.outstanding)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-3 border-t border-gray-50 text-center">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Paid</p>
                      <p className="text-sm font-bold text-gray-700">{data.fullyPaid}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Partial</p>
                      <p className="text-sm font-bold text-gray-700">{data.partial}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Unpaid</p>
                      <p className="text-sm font-bold text-gray-700">{data.unpaid}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-4 w-full sm:w-auto">
                <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 rounded-xl bg-gray-50 border-none font-bold text-gray-700 outline-none">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-2 rounded-xl bg-gray-50 border-none font-bold text-gray-700 outline-none">
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={selectedGradeFilter} onChange={e => setSelectedGradeFilter(e.target.value)} className="px-4 py-2 rounded-xl bg-gray-50 border-none font-bold text-gray-700 outline-none">
                  <option value="All">All Grades</option>
                  {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
             </div>
             <button onClick={() => setShowStudentModal(true)} className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs transition-all">
                <i className="fa-solid fa-plus"></i> New Student Payment
             </button>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">Student Name</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Grade</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Period</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Paid</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Outstanding</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudentPayments.map(p => {
                    const student = students.find(s => s.id === p.studentId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-800">{student?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-indigo-600 font-bold">Grade {p.grade}</td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{p.month} {p.year}</td>
                        <td className="px-6 py-4 font-black text-emerald-600">{formatCurrency(p.paidAmount)}</td>
                        <td className="px-6 py-4 font-bold text-red-500">{formatCurrency(p.outstandingAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                            p.status === PaymentStatus.PARTIAL ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <div className="flex justify-center gap-1">
                              <button onClick={() => openEditStudentPayment(p)} className="w-8 h-8 rounded-lg bg-gray-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fa-solid fa-pen text-xs"></i></button>
                              <button onClick={() => deleteStudentPayment(p.id)} className="w-8 h-8 rounded-lg bg-gray-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filteredStudentPayments.length && <div className="p-20 text-center text-gray-400 italic">No payments recorded for the current filters.</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
            <div className="flex gap-2">
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm outline-none">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm outline-none">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => { setEditingPaymentId(null); setShowTeacherModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-100">
              <i className="fa-solid fa-calculator"></i> Calculate Salary
            </button>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">Teacher</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Month</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Payable</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Paid</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeacherPayments.map(p => {
                    const teacher = teachers.find(t => t.id === p.teacherId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-800">{teacher?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-500">{p.month}</td>
                        <td className="px-6 py-4 font-black text-gray-900">{formatCurrency(p.amountPayable)}</td>
                        <td className="px-6 py-4 font-black text-emerald-600">{formatCurrency(p.amountPaid)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => deleteTeacherPayment(p.id)} className="text-red-600 hover:text-red-800"><i className="fa-solid fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Payment Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50 text-emerald-900">
              <h2 className="text-xl font-black uppercase tracking-widest">{editingPaymentId ? 'Edit Fee Payment' : 'New Monthly Fee Entry'}</h2>
              <button onClick={closeStudentModal} className="hover:bg-emerald-100 p-2 rounded-full transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleStudentSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">1. Select Grade</label>
                    <select 
                      required 
                      value={studentFormData.grade} 
                      onChange={e => setStudentFormData({...studentFormData, grade: e.target.value as Grade, studentId: ''})} 
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-500 outline-none font-bold"
                    >
                      {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">2. Select Student</label>
                    <select 
                      required 
                      value={studentFormData.studentId} 
                      onChange={e => setStudentFormData({...studentFormData, studentId: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-500 outline-none font-medium"
                    >
                      <option value="">Choose Student...</option>
                      {studentsInSelectedGrade.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Month Period</label>
                    <select 
                      value={studentFormData.month} 
                      onChange={e => setStudentFormData({...studentFormData, month: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-500 outline-none"
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year Period</label>
                    <select 
                      value={studentFormData.year} 
                      onChange={e => setStudentFormData({...studentFormData, year: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-emerald-500 outline-none"
                    >
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                   <div className="text-center flex-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fee for this Month (Rs)</p>
                      <input 
                        type="number" 
                        required 
                        value={studentFormData.totalFee} 
                        onChange={e => setStudentFormData({...studentFormData, totalFee: parseFloat(e.target.value) || 0})} 
                        className="w-28 px-2 py-1 bg-white border border-gray-200 rounded-lg font-black text-gray-700 text-center focus:ring-2 focus:ring-emerald-500 outline-none" 
                      />
                   </div>
                   <div className="h-10 w-px bg-gray-200"></div>
                   <div className="text-center flex-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Preview</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        studentFormData.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                        studentFormData.status === PaymentStatus.PARTIAL ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {studentFormData.status}
                      </span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount Paid (Rs)</label>
                    <input 
                      type="number" 
                      required 
                      value={studentFormData.paidAmount} 
                      onChange={e => setStudentFormData({...studentFormData, paidAmount: parseFloat(e.target.value) || 0})} 
                      className="w-full px-4 py-4 rounded-xl border-2 border-emerald-500 focus:ring-0 outline-none text-2xl font-black text-emerald-700 text-center" 
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Outstanding (Rs)</label>
                    <input 
                      readOnly 
                      value={studentFormData.outstandingAmount} 
                      className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-2xl font-black text-red-500 text-center" 
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeStudentModal} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs">
                  {editingPaymentId ? 'Update Record' : 'Commit & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Salary Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50 text-indigo-900">
              <h2 className="text-xl font-extrabold uppercase tracking-widest">Teacher Salary Calculation</h2>
              <button onClick={() => setShowTeacherModal(false)} className="hover:bg-indigo-100 p-2 rounded-full transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleTeacherSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teacher</label>
                  <select required value={teacherFormData.teacherId} onChange={e => setTeacherFormData({...teacherFormData, teacherId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Choose Teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select value={modalMonth} onChange={e => setModalMonth(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={modalYear} onChange={e => setModalYear(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {teacherFormData.teacherId && (
                  <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Calculated Payable (Session Rates Applied)</p>
                    <p className="text-3xl font-black text-indigo-700">{formatCurrency(teacherFormData.amountPayable)}</p>
                    <p className="text-xs text-indigo-300 mt-1 font-bold">Total classes: {teacherFormData.totalClasses} | Total hours: {teacherFormData.totalHours}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Amount Paid (Rs)</label>
                  <input type="number" required value={teacherFormData.amountPaid} onChange={e => setTeacherFormData({...teacherFormData, amountPaid: parseFloat(e.target.value)})} className="w-full px-4 py-4 rounded-xl border border-gray-200 text-2xl font-black text-indigo-700 text-center" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowTeacherModal(false)} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg">Commit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
