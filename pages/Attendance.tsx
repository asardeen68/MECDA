
import React, { useState } from 'react';
import { useStore } from '../store';
import { Grade } from '../types';

const Attendance: React.FC = () => {
  const { students, markAttendance } = useStore();
  const [selectedGrade, setSelectedGrade] = useState<Grade>(Grade.G6);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [presentMap, setPresentMap] = useState<Record<string, boolean>>({});

  const filteredStudents = students.filter(s => s.grade === selectedGrade && s.status === 'Active');

  const handleToggle = (studentId: string) => {
    setPresentMap(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSubmit = () => {
    const records = filteredStudents.map(s => ({
      studentId: s.id,
      classId: 'N/A', // Simple implementation
      date,
      isPresent: !!presentMap[s.id]
    }));
    markAttendance(records);
    alert('Attendance saved successfully!');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Attendance Marking</h1>
        <div className="flex flex-wrap gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium" />
          <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value as Grade)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-medium">
            {Object.values(Grade).map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Attendance Sheet: Grade {selectedGrade}</h3>
          <span className="text-sm text-gray-500">{filteredStudents.length} Students listed</span>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredStudents.map(s => (
            <div key={s.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-gray-400">ID: {s.id.slice(-4)}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={!!presentMap[s.id]}
                  onChange={() => handleToggle(s.id)}
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className={`ml-3 text-sm font-bold ${presentMap[s.id] ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {presentMap[s.id] ? 'Present' : 'Absent'}
                </span>
              </label>
            </div>
          ))}
          {filteredStudents.length === 0 && <div className="p-20 text-center text-gray-400">No active students found in this grade.</div>}
        </div>
        <div className="p-6 bg-gray-50 flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={filteredStudents.length === 0}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            Submit Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
