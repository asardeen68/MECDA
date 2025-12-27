
import React, { useState } from 'react';
import { useStore } from '../store';
import { Grade, ClassSchedule } from '../types';
import { calculateHours } from '../utils';

const ClassManagement: React.FC = () => {
  const { schedules, teachers, addSchedule, deleteSchedule } = useStore();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState<Omit<ClassSchedule, 'id'>>({
    grade: Grade.G6,
    subject: '',
    teacherId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    totalHours: 2,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = calculateHours(formData.startTime, formData.endTime);
    addSchedule({ ...formData, totalHours: hours });
    setShowModal(false);
  };

  const activeTeachers = teachers.filter(t => t.status === 'Active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Class Scheduling</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <i className="fa-solid fa-calendar-plus"></i> Schedule Class
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Grade & Subject</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Teacher</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Time</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Total Hrs</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map(s => {
                const teacher = teachers.find(t => t.id === s.teacherId);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{s.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-indigo-700">Grade {s.grade}</span>
                        <span className="text-sm text-gray-500">{s.subject}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{teacher?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-600">{s.startTime} - {s.endTime}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold">{s.totalHours} hr</span></td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteSchedule(s.id)} className="text-red-600 hover:text-red-800"><i className="fa-solid fa-trash"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!schedules.length && <div className="p-10 text-center text-gray-400">No classes scheduled yet.</div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <h2 className="text-xl font-bold text-indigo-900">Schedule New Class</h2>
              <button onClick={() => setShowModal(false)} className="text-indigo-900 hover:bg-indigo-100 p-2 rounded-full"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
                  <select required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value as Grade})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Teacher</label>
                  <select required value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Teacher</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                  <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Pure Math" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                  <input type="date" required value={formData.date} onChange={e => {
                    const d = new Date(e.target.value);
                    setFormData({...formData, 
                      date: e.target.value,
                      month: d.toLocaleString('default', { month: 'long' }),
                      year: d.getFullYear().toString()
                    })
                  }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Time</label>
                  <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Time</label>
                  <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
