
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
  
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const [studentFormData, setStudentFormData] = useState<Omit<StudentPayment, 'id'>>({
    studentId: '',
    grade: Grade.G6,
    month: new Date().toLocaleString('default', { month: 'long' }),
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: PaymentStatus.PAID,
    remarks: ''
  });

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
      const rate = teacher?.rate || 0;
      const amountPayable = teacher?.paymentType === PaymentType.HOURLY ? totalHours * rate : rate;

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
    const parts = p.month.split(' ');
    if (parts.length === 2) {
      setModalMonth(parts[0]);
      setModalYear(parts[1]);
    }
    setShowTeacherModal(true);
  };

  const handleDeleteTeacherPayment = (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment record? This will permanently remove it from the database.')) {
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
        <h1 className="text-2xl font-bold text-gray-900">Payment Tracking</h1>
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex">
          <button onClick={() => setActiveTab('students')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Student Fees</button>
          <button onClick={() => setActiveTab('teachers')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Teacher Salaries</button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowStudentModal(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg shadow-emerald-100">
              <i className="fa-solid fa-plus"></i> New Student Payment
            </button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">Student Name</th>
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
                      <tr key={p.id} className="hover:bg-gray-50 group">
                        <td className="px-6 py-4 font-medium text-gray-800">{student?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-600">Grade {p.grade} - {p.month}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        <td className="px-6 py-4 text-gray-500">{p.date}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-wider">{p.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!studentPayments.length && <div className="p-16 text-center text-gray-400">No payment records found.</div>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
            <div className="flex gap-2">
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => { setEditingPaymentId(null); setTeacherFormData(initialTeacherForm); setShowTeacherModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-100">
              <i className="fa-solid fa-calculator"></i> Calculate & Pay Teacher
            </button>
          </div>
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
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
                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeacherPayments.map(p => {
                    const teacher = teachers.find(t => t.id === p.teacherId);
                    const isFullyPaid = p.amountPaid >= p.amountPayable;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-800">{teacher?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{p.month}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="block text-indigo-600 font-bold">{p.totalHours} Hours</span>
                          <span className="block text-gray-400 text-xs font-medium">{p.totalClasses} Classes</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(p.amountPayable)}</td>
                        <td className="px-6 py-4 font-black text-indigo-600">{formatCurrency(p.amountPaid)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isFullyPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isFullyPaid ? 'Cleared' : 'Partial'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            <button 
                              onClick={() => handleEditTeacherPayment(p)} 
                              className="text-gray-400 hover:text-indigo-600 w-10 h-10 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center"
                              title="Edit record"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button 
                              onClick={() => handleDeleteTeacherPayment(p.id)} 
                              className="text-gray-400 hover:text-red-600 w-10 h-10 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center"
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
                <div className="p-20 text-center text-gray-400">
                  <i className="fa-solid fa-calendar-xmark text-5xl mb-6 block opacity-10"></i>
                  <p className="font-medium">No salary records for {selectedMonth} {selectedYear}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Payment Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50 text-indigo-900">
              <div className="flex items-center gap-3">
                <i className={`fa-solid ${editingPaymentId ? 'fa-pen-to-square' : 'fa-calculator'} text-indigo-600`}></i>
                <h2 className="text-xl font-extrabold">{editingPaymentId ? 'Update Payment Record' : 'Calculate Teacher Salary'}</h2>
              </div>
              <button onClick={closeTeacherModal} className="hover:bg-indigo-100 p-2 rounded-full transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleTeacherSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teacher</label>
                  <select required value={teacherFormData.teacherId} onChange={e => {
                    setTeacherFormData({...teacherFormData, teacherId: e.target.value});
                  }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                    <option value="">Choose Teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Month</label>
                    <select value={modalMonth} onChange={e => setModalMonth(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                    <select value={modalYear} onChange={e => setModalYear(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {teacherFormData.teacherId && (
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-fadeIn">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <i className="fa-solid fa-chart-simple"></i> Earnings Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Total Hours</p>
                        <p className="text-xl font-black text-indigo-600">{teacherFormData.totalHours}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-50">
                        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Rate</p>
                        <p className="text-xl font-black text-indigo-600">
                          {teachers.find(t => t.id === teacherFormData.teacherId)?.rate}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-sm border-2 border-indigo-200">
                        <p className="text-[9px] text-indigo-400 uppercase font-black tracking-widest mb-1">Payable</p>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(teacherFormData.amountPayable)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Amount Paid (Rs)</label>
                  <input 
                    type="number" 
                    required 
                    value={teacherFormData.amountPaid} 
                    onChange={e => setTeacherFormData({...teacherFormData, amountPaid: parseFloat(e.target.value)})} 
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-2xl font-black text-indigo-700 text-center"
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeTeacherModal} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                <button 
                  type="submit" 
                  disabled={!teacherFormData.teacherId}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all uppercase tracking-widest"
                >
                  {editingPaymentId ? 'Update Record' : 'Commit Payment'}
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
