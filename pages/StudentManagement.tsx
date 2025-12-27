
import React, { useState } from 'react';
import { useStore } from '../store';
import { Grade, Status, Student } from '../types';

const StudentManagement: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('All');

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

  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData(s);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      name: '', fatherName: '', grade: Grade.G6, contact: '', whatsapp: '', status: Status.ACTIVE
    });
  };

  const filteredStudents = gradeFilter === 'All' ? students : students.filter(s => s.grade === gradeFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Student Management</h1>
          <p className="text-gray-500 text-sm">Managing {students.length} students across all grades.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Add Student
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', ...Object.values(Grade)].map(g => (
          <button
            key={g}
            onClick={() => setGradeFilter(g)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-semibold ${gradeFilter === g ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'}`}
          >
            {g === 'All' ? 'All Grades' : `Grade ${g}`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Student Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Father's Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Grade</th>
                <th className="px-6 py-4 font-semibold text-gray-600">WhatsApp</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{s.name}</td>
                  <td className="px-6 py-4 text-gray-600">{s.fatherName}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">G{s.grade}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{s.whatsapp}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === Status.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 p-2"><i className="fa-solid fa-pen"></i></button>
                      <button onClick={() => deleteStudent(s.id)} className="text-red-600 hover:text-red-800 p-2"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && <div className="p-10 text-center text-gray-400">No students found for this grade.</div>}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <h2 className="text-xl font-bold text-indigo-900">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={closeModal} className="text-indigo-900 hover:bg-indigo-100 p-2 rounded-full"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Student's legal name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Father's Name</label>
                  <input required value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
                  <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value as Grade})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contact No</label>
                  <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp No</label>
                  <input required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="94xxxxxxxxx" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value={Status.ACTIVE}>Active</option>
                    <option value={Status.INACTIVE}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
