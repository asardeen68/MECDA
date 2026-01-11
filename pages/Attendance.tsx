
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Grade, Attendance as AttendanceRecord } from '../types';

const Attendance: React.FC = () => {
  const { students, schedules, markAttendance, attendance } = useStore();
  const [selectedGrade, setSelectedGrade] = useState<Grade>(Grade.G6);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});

  // Get schedules for selected grade and date
  const availableSchedules = useMemo(() => {
    return schedules.filter(s => s.grade === selectedGrade && s.date === selectedDate);
  }, [schedules, selectedGrade, selectedDate]);

  // Students in selected grade
  const filteredStudents = useMemo(() => {
    return students.filter(s => s.grade === selectedGrade && s.status === 'Active');
  }, [students, selectedGrade]);

  // Check if attendance is already marked for this session
  const alreadyMarked = useMemo(() => {
    if (!selectedScheduleId) return false;
    return attendance.some(a => a.classId === selectedScheduleId);
  }, [attendance, selectedScheduleId]);

  const handleToggle = (studentId: string) => {
    setPresentMap(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSelectAll = (present: boolean) => {
    const newMap: Record<string, boolean> = {};
    filteredStudents.forEach(s => newMap[s.id] = present);
    setPresentMap(newMap);
  };

  const handleSubmit = async () => {
    if (!selectedScheduleId) {
      alert('Please select a specific class session first.');
      return;
    }
    const records: Omit<AttendanceRecord, 'id'>[] = filteredStudents.map(s => ({
      studentId: s.id,
      classId: selectedScheduleId,
      date: selectedDate,
      isPresent: !!presentMap[s.id]
    }));
    await markAttendance(records);
    alert('Attendance for the session has been saved successfully!');
    setSelectedScheduleId('');
    setPresentMap({});
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Session Attendance</h1>
           <p className="text-gray-500 text-sm">Mark attendance for specific scheduled sessions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedScheduleId(''); }} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Class</label>
            <select value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value as Grade); setSelectedScheduleId(''); }} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500">
              {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>
      </header>

      {/* Session Selector */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Select Scheduled Session</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {availableSchedules.map(s => (
             <button
              key={s.id}
              onClick={() => setSelectedScheduleId(s.id)}
              className={`p-4 rounded-2xl text-left border-2 transition-all ${selectedScheduleId === s.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
             >
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1">{s.startTime} - {s.endTime}</p>
                <p className="font-bold text-gray-800">{s.subject}</p>
                <p className="text-xs text-gray-500 font-medium">Teacher: {schedules.find(x => x.id === s.id)?.teacherId ? 'Assigned' : 'N/A'}</p>
             </button>
           ))}
           {availableSchedules.length === 0 && (
             <div className="col-span-full py-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                <i className="fa-solid fa-calendar-xmark mb-2 block text-2xl"></i>
                <p className="text-sm font-medium">No classes scheduled for Grade {selectedGrade} on this date.</p>
             </div>
           )}
        </div>
      </div>

      {selectedScheduleId && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-slideUp">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-black text-indigo-900 uppercase tracking-widest text-sm">Attendance List</h3>
              <p className="text-xs text-indigo-400 font-bold">{filteredStudents.length} Students Active</p>
            </div>
            {alreadyMarked ? (
              <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-black border border-amber-100 flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                ALREADY MARKED FOR THIS SESSION
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => handleSelectAll(true)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100">All Present</button>
                <button onClick={() => handleSelectAll(false)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">All Absent</button>
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4 font-black text-gray-400 text-[10px] uppercase">Student Name</th>
                  <th className="px-8 py-4 font-black text-gray-400 text-[10px] uppercase">ID</th>
                  <th className="px-8 py-4 font-black text-gray-400 text-[10px] uppercase text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 font-medium text-gray-400 text-sm">#{s.id.slice(-4)}</td>
                    <td className="px-8 py-4 text-right">
                       <button
                        onClick={() => handleToggle(s.id)}
                        disabled={alreadyMarked}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          presentMap[s.id] 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                            : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                        }`}
                       >
                        {presentMap[s.id] ? 'Present' : 'Absent'}
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!alreadyMarked && (
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSubmit}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase tracking-widest transition-all"
              >
                Save Attendance Record
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
