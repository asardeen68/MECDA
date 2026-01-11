
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Grade, Status, Student, StudentPayment, Attendance } from '../types';
import { formatCurrency } from '../utils';

const StudentManagement: React.FC = () => {
  const { students, studentPayments, attendance, addStudent, updateStudent, deleteStudent } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    name: '',
    fatherName: '',
    grade: Grade.G6,
    contact: '',
    whatsapp: '',
    status: Status.ACTIVE
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      updateStudent({ ...formData, id: editingStudent.id });
    } else {
      addStudent(formData);
    }
    closeModal();
  };

  const openEdit = (e: React.MouseEvent, s: Student) => {
    e.stopPropagation();
    setEditingStudent(s);
    setFormData(s);
    setShowModal(true);
  };

  const openProfile = (s: Student) => {
    setViewingStudent(s);
    setShowProfile(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      name: '', fatherName: '', grade: Grade.G6, contact: '', whatsapp: '', status: Status.ACTIVE
    });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const gradeMatch = gradeFilter === 'All' || s.grade === gradeFilter;
      const searchMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
      return gradeMatch && searchMatch;
    });
  }, [students, gradeFilter, searchQuery]);

  // Profile Specific Calculations
  const studentFinancials = useMemo(() => {
    if (!viewingStudent) return { history: [], totalOutstanding: 0 };
    const history = studentPayments
      .filter(p => p.studentId === viewingStudent.id)
      .sort((a,b) => {
        // Simple year-month sorting
        const dateA = new Date(`${a.month} 1, ${a.year}`).getTime();
        const dateB = new Date(`${b.month} 1, ${b.year}`).getTime();
        return dateB - dateA;
      });
    const totalOutstanding = history.reduce((acc, p) => acc + p.outstandingAmount, 0);
    return { history, totalOutstanding };
  }, [viewingStudent, studentPayments]);

  const studentAttendance = useMemo(() => {
    if (!viewingStudent) return [];
    return attendance
      .filter(a => a.studentId === viewingStudent.id)
      .sort((a,b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [viewingStudent, attendance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Student Directory</h1>
          <p className="text-gray-500 text-sm">Reviewing {filteredStudents.length} matching students.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
        >
          <i className="fa-solid fa-plus"></i> Onboard Student
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex-1 w-full relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search student by name or ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-1">
          {['All', ...Object.values(Grade)].map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-6 py-2 rounded-xl whitespace-nowrap transition-all font-bold text-sm ${gradeFilter === g ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
            >
              {g === 'All' ? 'All' : `Grade ${g}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(s => (
          <div 
            key={s.id} 
            onClick={() => openProfile(s)}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {s.name.charAt(0)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => openEdit(e, s)} className="w-8 h-8 rounded-lg bg-gray-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center justify-center"><i className="fa-solid fa-pen text-xs"></i></button>
                <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete student?')) deleteStudent(s.id); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"><i className="fa-solid fa-trash text-xs"></i></button>
              </div>
            </div>
            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{s.name}</h3>
            <p className="text-xs text-gray-400 font-medium mb-4">ID: {s.id}</p>
            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
               <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tight">Grade {s.grade}</span>
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.status === Status.ACTIVE ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>{s.status}</span>
            </div>
          </div>
        ))}
        {filteredStudents.length === 0 && <div className="col-span-full py-20 text-center text-gray-400">No students found matching your search.</div>}
      </div>

      {/* Student Profile Detail View */}
      {showProfile && viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scaleIn">
            {/* Sidebar with basic info */}
            <div className="w-full md:w-80 bg-indigo-600 text-white p-8 flex flex-col items-center">
              <div className="w-24 h-24 rounded-[2rem] bg-white/20 flex items-center justify-center text-4xl font-black mb-6 shadow-xl border-4 border-white/10">
                {viewingStudent.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-center leading-tight mb-2">{viewingStudent.name}</h2>
              <p className="text-indigo-200 text-sm mb-6">Student ID: {viewingStudent.id}</p>
              
              <div className="w-full space-y-4 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-graduation-cap text-indigo-300"></i>
                  <span className="text-sm font-bold uppercase tracking-widest">Grade {viewingStudent.grade}</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-user-tie text-indigo-300"></i>
                  <span className="text-sm font-medium">{viewingStudent.fatherName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-phone text-indigo-300"></i>
                  <span className="text-sm font-medium">{viewingStudent.contact}</span>
                </div>
              </div>

              <div className="mt-auto w-full pt-8">
                <div className="bg-red-500 text-white rounded-2xl p-5 text-center shadow-lg shadow-red-900/20">
                   <p className="text-[10px] uppercase font-black tracking-widest text-red-100 mb-1">Overall Balance</p>
                   <p className="text-2xl font-black">{formatCurrency(studentFinancials.totalOutstanding)}</p>
                </div>
              </div>
            </div>

            {/* Main scrollable area */}
            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-credit-card text-indigo-600"></i>
                  Monthly Payment Ledger
                </h3>
                <button onClick={() => setShowProfile(false)} className="w-10 h-10 rounded-full bg-white text-gray-400 hover:text-indigo-600 shadow-sm flex items-center justify-center transition-all border border-gray-100"><i className="fa-solid fa-xmark"></i></button>
              </div>

              {/* Payment Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Period</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Paid</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentFinancials.history.map((h: StudentPayment) => (
                      <tr key={h.id}>
                        <td className="px-6 py-4 font-bold text-gray-700">{h.month} {h.year}</td>
                        <td className="px-6 py-4 font-black text-emerald-600">{formatCurrency(h.paidAmount)}</td>
                        <td className="px-6 py-4 font-bold text-red-500">{formatCurrency(h.outstandingAmount)}</td>
                      </tr>
                    ))}
                    {studentFinancials.history.length === 0 && (
                      <tr><td colSpan={3} className="p-12 text-center text-gray-400 italic">No financial history recorded for this student.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Attendance Recap */}
              <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                <i className="fa-solid fa-clipboard-check text-indigo-600"></i>
                Recent Attendance Check-Ins
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                 {studentAttendance.map((a: Attendance) => (
                   <div key={a.id} className="bg-white p-3 rounded-2xl border border-gray-100 text-center shadow-sm">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                      <span className={`w-3 h-3 rounded-full inline-block ${a.isPresent ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <p className={`text-[10px] font-black mt-1 ${a.isPresent ? 'text-emerald-600' : 'text-red-500'}`}>{a.isPresent ? 'PRESENT' : 'ABSENT'}</p>
                   </div>
                 ))}
                 {studentAttendance.length === 0 && <div className="col-span-full py-8 text-gray-400 text-center italic border border-dashed border-gray-200 rounded-3xl">No attendance records found.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50 text-indigo-900">
              <h2 className="text-xl font-black uppercase tracking-widest">{editingStudent ? 'Edit Student Details' : 'Onboard New Student'}</h2>
              <button onClick={closeModal} className="hover:bg-indigo-100 p-2 rounded-full transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Full name of student" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Guardian's Name</label>
                  <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Father or Mother" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assigned Grade</label>
                  <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value as Grade})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-700">
                    {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contact Number</label>
                  <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="07xxxxxxxx" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">WhatsApp Number</label>
                  <input required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="94xxxxxxxxx" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest text-xs">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs">
                  Save Student Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
