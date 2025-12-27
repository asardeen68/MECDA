
import React, { useState } from 'react';
import { useStore } from '../store';
import { Grade, PaymentType, Status, Teacher } from '../types';

const TeacherManagement: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({
    name: '',
    subject: '',
    grades: [],
    paymentType: PaymentType.HOURLY,
    rate: 0,
    contact: '',
    whatsapp: '',
    status: Status.ACTIVE
  });

  const handleGradeToggle = (grade: Grade) => {
    setFormData(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateTeacher({ ...formData, id: editingTeacher.id });
    } else {
      addTeacher(formData);
    }
    closeModal();
  };

  const openEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData(t);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTeacher(null);
    setFormData({
      name: '', subject: '', grades: [], paymentType: PaymentType.HOURLY,
      rate: 0, contact: '', whatsapp: '', status: Status.ACTIVE
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teacher Management</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i> Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Teacher Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Subject</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Grades</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Rate</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">{t.name}</td>
                  <td className="px-6 py-4 text-gray-600">{t.subject}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {t.grades.map(g => (
                        <span key={g} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">G{g}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    Rs {t.rate} / {t.paymentType === PaymentType.HOURLY ? 'hr' : 'mo'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === Status.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(t)} className="text-indigo-600 hover:text-indigo-800"><i className="fa-solid fa-pen"></i></button>
                      <button onClick={() => deleteTeacher(t.id)} className="text-red-600 hover:text-red-800"><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teachers.length === 0 && <div className="p-10 text-center text-gray-400">No teachers found. Click "Add Teacher" to get started.</div>}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <h2 className="text-xl font-bold text-indigo-900">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <button onClick={closeModal} className="text-indigo-900 hover:bg-indigo-100 p-2 rounded-full"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter teacher name" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Mathematics" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Assigned Grades</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.values(Grade).map(g => (
                      <button
                        key={g} type="button"
                        onClick={() => handleGradeToggle(g)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all font-bold ${formData.grades.includes(g) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-indigo-300'}`}
                      >G{g}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Payment Type</label>
                  <select value={formData.paymentType} onChange={e => setFormData({...formData, paymentType: e.target.value as PaymentType})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value={PaymentType.HOURLY}>Hourly</option>
                    <option value={PaymentType.MONTHLY}>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Rate (Rs)</label>
                  <input type="number" required value={formData.rate} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number</label>
                  <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="07xxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Number</label>
                  <input required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="94xxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Status})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value={Status.ACTIVE}>Active</option>
                    <option value={Status.INACTIVE}>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
