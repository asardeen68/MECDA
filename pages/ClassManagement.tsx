
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Grade, ClassSchedule } from '../types';
import { calculateHours, exportDualReports, formatCurrency } from '../utils';

const ClassManagement: React.FC = () => {
  const { schedules, teachers, addSchedule, updateSchedule, deleteSchedule, academyInfo } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timetable'>('list');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('All');

  const initialFormState: Omit<ClassSchedule, 'id'> = {
    grade: Grade.G6,
    subject: '',
    teacherId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '10:00',
    totalHours: 2,
    rateOverride: 0,
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString()
  };

  const [formData, setFormData] = useState<Omit<ClassSchedule, 'id'>>(initialFormState);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = calculateHours(formData.startTime, formData.endTime);
    const scheduleData = { ...formData, totalHours: hours };
    
    if (editingSchedule) {
      updateSchedule({ ...scheduleData, id: editingSchedule.id });
    } else {
      addSchedule(scheduleData);
    }
    closeModal();
  };

  const openEdit = (s: ClassSchedule) => {
    setEditingSchedule(s);
    setFormData(s);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData(initialFormState);
  };

  const activeTeachers = teachers.filter(t => t.status === 'Active');

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => selectedGradeFilter === 'All' || s.grade === selectedGradeFilter)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [schedules, selectedGradeFilter]);

  const handleExportTimetable = () => {
    const headers = ['Date', 'Grade', 'Subject', 'Teacher', 'Time', 'Duration'];
    const data = filteredSchedules.map(s => {
      const teacher = teachers.find(t => t.id === s.teacherId);
      return [
        s.date,
        `Grade ${s.grade}`,
        s.subject,
        teacher?.name || 'Unknown',
        `${s.startTime} - ${s.endTime}`,
        `${s.totalHours} hr`
      ];
    });
    exportDualReports(academyInfo, `Class Timetable - ${selectedGradeFilter === 'All' ? 'All Grades' : 'Grade ' + selectedGradeFilter}`, headers, data, 'Class_Timetable');
  };

  const handleTeacherChange = (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    setFormData({ ...formData, teacherId: id, rateOverride: teacher?.rate || 0 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Scheduling</h1>
          <p className="text-gray-500 text-sm">Organize sessions by class, subject, and teacher.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'timetable' : 'list')}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <i className={`fa-solid ${viewMode === 'list' ? 'fa-table-columns' : 'fa-list'}`}></i>
            {viewMode === 'list' ? 'Timetable View' : 'List View'}
          </button>
          <button 
            onClick={handleExportTimetable}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 flex items-center gap-2 shadow-sm"
          >
            <i className="fa-solid fa-file-pdf"></i> Download
          </button>
          <button 
            onClick={() => { setEditingSchedule(null); setFormData(initialFormState); setShowModal(true); }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <i className="fa-solid fa-calendar-plus"></i> Schedule Class
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
        {['All', ...Object.values(Grade)].map(g => (
          <button
            key={g}
            onClick={() => setSelectedGradeFilter(g)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedGradeFilter === g ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {g === 'All' ? 'ALL GRADES' : `GRADE ${g}`}
          </button>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Grade & Subject</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Teacher</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Time</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Session Rate</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSchedules.map(s => {
                  const teacher = teachers.find(t => t.id === s.teacherId);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-700">{s.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-indigo-700 uppercase text-[10px] tracking-widest">Grade {s.grade}</span>
                          <span className="font-bold text-gray-800">{s.subject}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-600">{teacher?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <i className="fa-regular fa-clock text-indigo-400"></i>
                          <span className="text-gray-600 font-bold">{s.startTime} - {s.endTime}</span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black">{s.totalHours} hr</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-emerald-600">{formatCurrency(s.rateOverride || 0)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-indigo-600 w-9 h-9 rounded-lg hover:bg-indigo-50 transition-all flex items-center justify-center">
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button onClick={() => deleteSchedule(s.id)} className="text-gray-400 hover:text-red-600 w-9 h-9 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredSchedules.length && <div className="p-20 text-center text-gray-400 italic">No classes scheduled for the selected filters.</div>}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
          {filteredSchedules.map(s => {
            const teacher = teachers.find(t => t.id === s.teacherId);
            return (
              <div key={s.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Grade {s.grade}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-gray-300 hover:text-indigo-600 transition-colors">
                      <i className="fa-solid fa-pen text-sm"></i>
                    </button>
                    <button onClick={() => deleteSchedule(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-1">{s.subject}</h3>
                <p className="text-sm text-gray-500 font-bold mb-4 flex items-center gap-2">
                   <i className="fa-solid fa-user-tie text-indigo-400"></i>
                   {teacher?.name}
                </p>
                <div className="space-y-2 pt-4 border-t border-gray-50">
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 font-medium">Date</span>
                      <span className="text-gray-700 font-bold">{s.date}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 font-medium">Time</span>
                      <span className="text-indigo-600 font-black">{s.startTime} - {s.endTime}</span>
                   </div>
                </div>
              </div>
            );
          })}
          {!filteredSchedules.length && <div className="col-span-full p-20 text-center text-gray-400 italic">No classes scheduled for the selected filters.</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleIn">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
              <h2 className="text-xl font-black text-indigo-900 uppercase tracking-widest">{editingSchedule ? 'Edit Session' : 'Schedule New Session'}</h2>
              <button onClick={closeModal} className="text-indigo-900 hover:bg-indigo-100 p-2 rounded-full transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Grade</label>
                  <select required value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value as Grade})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold">
                    {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                  <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Pure Mathematics" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Teacher</label>
                  <select required value={formData.teacherId} onChange={e => handleTeacherChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Teacher</option>
                    {activeTeachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rate for this Session (Rs)</label>
                  <input type="number" required value={formData.rateOverride} onChange={e => setFormData({...formData, rateOverride: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-emerald-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date</label>
                  <input type="date" required value={formData.date} onChange={e => {
                    const d = new Date(e.target.value);
                    setFormData({...formData, 
                      date: e.target.value,
                      month: d.toLocaleString('default', { month: 'long' }),
                      year: d.getFullYear().toString()
                    })
                  }} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Start</label>
                    <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">End</label>
                    <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-200 uppercase tracking-widest">
                  {editingSchedule ? 'Update Session' : 'Commit to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
