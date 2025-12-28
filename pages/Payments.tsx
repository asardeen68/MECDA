
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Grade, PaymentStatus, StudentPayment, TeacherPayment, PaymentType } from '../types';
import { formatCurrency, generateStudentPaymentMsg, sendWhatsAppMessage } from '../utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const YEARS = ['2024', '2025', '2026', '2027'];

const Payments: React.FC = () => {
  const { 
    students, 
    addStudentPayment, 
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
  
  // Filtering states for Main View
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Student Payment Form State
  const [studentFormData, setStudentFormData] = useState<Omit<StudentPayment, 'id'>>({
    studentId: '',
    grade: Grade.G6,
    month: new Date().toLocaleString('default', { month: 'long' }),
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: PaymentStatus.PAID,
    remarks: ''
  });

  // Teacher Payment Form State
  const initialTeacherForm: Omit<TeacherPayment, 'id'> = {
    teacherId: '',
    month: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    totalClasses: 0,
    totalHours: 0,
    amountPayable: 0,
    amountPaid: 0,
    date: new Date().toISOString().split('T')[0]
  };

  const [teacherFormData, setTeacherFormData] = useState<Omit<TeacherPayment, 'id'>>(initialTeacherForm);

  // Split month/year for the modal internal selection
  const [modalMonth, setModalMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [modalYear, setModalYear] = useState(new Date().getFullYear().toString());

  // Derived calculation for teacher payment logic
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
      const rate = teacher?.rate || 0;
      const amountPayable = teacher?.paymentType === PaymentType.HOURLY ? totalHours * rate : rate;

      setTeacherFormData(prev => ({
        ...prev,
        month: `${modalMonth} ${modalYear}`,
        totalClasses,
        totalHours,
        amountPayable,
        // Only override amountPaid if we are NOT in edit mode or if user intentionally changed teacher/period
        amountPaid: prev.amountPaid === 0 ? amountPayable : prev.amountPaid 
      }));
    }
  }, [teacherFormData.teacherId, modalMonth, modalYear, schedules, teachers, showTeacherModal]);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStudentPayment(studentFormData);
    const student = students.find(s => s.id === studentFormData.studentId);
    if (student) {
      const msg = generateStudentPaymentMsg(student, studentFormData);
      sendWhatsAppMessage(student.whatsapp, msg);
    }
    setShowStudentModal(false);
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPaymentId) {
      updateTeacherPayment({ ...teacherFormData, id: editingPaymentId });
    } else {
      addTeacherPayment(teacherFormData);
    }
    closeTeacherModal();
  };

  const handleEditTeacherPayment = (p: TeacherPayment) => {
    setEditingPaymentId(p.id);
    setTeacherFormData(p);
    // Extract month and year from period string (e.g. "January 2025")
    const parts = p.month.split(' ');
    if (parts.length === 2) {
      setModalMonth(parts[0]);
      setModalYear(parts[1]);
    }
    setShowTeacherModal(true);
  };

  const handleDeleteTeacherPayment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      deleteTeacherPayment(id);
    }
  };

  const closeTeacherModal = () => {
    setShowTeacherModal(false);
    setEditingPaymentId(null);
    setTeacherFormData(initialTeacherForm);
  };

  const filteredTeacherPayments = teacherPayments.filter(p => p.month === `${selectedMonth} ${selectedYear}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Payment Management</h1>
        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
          <button onClick={() => setActiveTab('students')} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Student Payments</button>
          <button onClick={() => setActiveTab('teachers')} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Teacher Payments</button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowStudentModal(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2">
              <i className="fa-solid fa-plus"></i> New Student Payment
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">Student</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Grade & Month</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Amount</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentPayments.map(p => {
                    const student = students.find(s => s.id === p.studentId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{student?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-600">Grade {p.grade} - {p.month}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        <td className="px-6 py-4 text-gray-500">{p.date}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{p.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!studentPayments.length && <div className="p-10 text-center text-gray-400">No payment records found.</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
            <div className="flex gap-2">
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => { setEditingPaymentId(null); setTeacherFormData(initialTeacherForm); setShowTeacherModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-100">
              <i className="fa-solid fa-calculator"></i> Calculate & Pay Teacher
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">Teacher</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Month</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Stats</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Payable</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Paid</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeacherPayments.map(p => {
                    const teacher = teachers.find(t => t.id === p.teacherId);
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium">{teacher?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-500">{p.month}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="block text-gray-700">{p.totalHours} Hours</span>
                          <span className="block text-gray-400 text-xs">{p.totalClasses} Classes</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(p.amountPayable)}</td>
                        <td className="px-6 py-4 font-bold text-indigo-600">{formatCurrency(p.amountPaid)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.amountPaid >= p.amountPayable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {p.amountPaid >= p.amountPayable ? 'Cleared' : 'Partial'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditTeacherPayment(p)} 
                              className="text-indigo-600 hover:text-indigo-800 p-2 transition-colors"
                              title="Edit record"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteTeacherPayment(p.id)} 
                              className="text-red-500 hover:text-red-700 p-2 transition-colors"
                              title="Delete record"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filteredTeacherPayments.length && (
                <div className="p-12 text-center text-gray-400">
                  <i className="fa-solid fa-calendar-xmark text-4xl mb-4 block opacity-20"></i>
                  No payment records for {selectedMonth} {selectedYear}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Payment Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50 text-emerald-900">
              <h2 className="text-xl font-bold">Enter Student Payment</h2>
              <button onClick={() => setShowStudentModal(false)} className="hover:bg-emerald-100 p-2 rounded-full"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleStudentSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Student</label>
                  <select required value={studentFormData.studentId} onChange={e => {
                    const student = students.find(s => s.id === e.target.value);
                    setStudentFormData({...studentFormData, studentId: e.target.value, grade: student?.grade || Grade.G6})
                  }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option value="">Select Student</option>
                    {students.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.id}>{s.name} (G{s.grade})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Month</label>
                    <select required value={studentFormData.month} onChange={e => setStudentFormData({...studentFormData, month: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none">
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Amount (Rs)</label>
                    <input type="number" required value={studentFormData.amount} onChange={e => setStudentFormData({...studentFormData, amount: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Remarks</label>
                  <textarea value={studentFormData.remarks} onChange={e => setStudentFormData({...studentFormData, remarks: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" rows={2} placeholder="Optional notes..."></textarea>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowStudentModal(false)} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                  <i className="fa-brands fa-whatsapp"></i> Record & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Payment Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50 text-indigo-900">
              <div className="flex items-center gap-3">
                <i className={`fa-solid ${editingPaymentId ? 'fa-pen-to-square' : 'fa-calculator'}`}></i>
                <h2 className="text-xl font-bold">{editingPaymentId ? 'Edit Teacher Payment' : 'Calculate Teacher Salary'}</h2>
              </div>
              <button onClick={closeTeacherModal} className="hover:bg-indigo-100 p-2 rounded-full"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleTeacherSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Teacher</label>
                  <select required value={teacherFormData.teacherId} onChange={e => {
                    setTeacherFormData({...teacherFormData, teacherId: e.target.value});
                  }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Choose Teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Month</label>
                    <select value={modalMonth} onChange={e => setModalMonth(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                    <select value={modalYear} onChange={e => setModalYear(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {teacherFormData.teacherId && (
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-fadeIn">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                      <i className="fa-solid fa-magnifying-glass-chart"></i> Calculation Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total Hours</p>
                        <p className="text-xl font-black text-indigo-600">{teacherFormData.totalHours}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Rate</p>
                        <p className="text-xl font-black text-indigo-600">
                          Rs.{teachers.find(t => t.id === teacherFormData.teacherId)?.rate}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-sm border-2 border-indigo-200">
                        <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">Payable</p>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(teacherFormData.amountPayable)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-400 italic">
                      Calculated from {teacherFormData.totalClasses} classes scheduled in {modalMonth} {modalYear}.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Amount Paid (Rs)</label>
                  <input 
                    type="number" 
                    required 
                    value={teacherFormData.amountPaid} 
                    onChange={e => setTeacherFormData({...teacherFormData, amountPaid: parseFloat(e.target.value)})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-xl font-bold text-indigo-700"
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeTeacherModal} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button 
                  type="submit" 
                  disabled={!teacherFormData.teacherId}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {editingPaymentId ? 'Update Record' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
