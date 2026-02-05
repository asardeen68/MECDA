
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Teacher, Student, ClassSchedule, Attendance, StudentPayment, TeacherPayment, AcademyInfo } from './types';
import { db } from './db';

interface AppContextType {
  teachers: Teacher[];
  students: Student[];
  schedules: ClassSchedule[];
  attendance: Attendance[];
  studentPayments: StudentPayment[];
  teacherPayments: TeacherPayment[];
  academyInfo: AcademyInfo;
  loading: boolean;
  syncing: boolean;
  
  addTeacher: (t: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (t: Teacher) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  
  addStudent: (s: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (s: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  
  addSchedule: (s: Omit<ClassSchedule, 'id'>) => Promise<void>;
  updateSchedule: (s: ClassSchedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  
  markAttendance: (records: Omit<Attendance, 'id'>[]) => Promise<void>;
  
  addStudentPayment: (p: Omit<StudentPayment, 'id'>) => Promise<void>;
  updateStudentPayment: (p: StudentPayment) => Promise<void>;
  deleteStudentPayment: (id: string) => Promise<void>;
  
  addTeacherPayment: (p: Omit<TeacherPayment, 'id'>) => Promise<void>;
  updateTeacherPayment: (p: TeacherPayment) => Promise<void>;
  deleteTeacherPayment: (id: string) => Promise<void>;
  
  updateAcademyInfo: (info: AcademyInfo) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_ACADEMY: AcademyInfo = {
  name: 'MECDA Academy',
  address: '123 Education Lane, Colombo, Sri Lanka',
  email: 'info@mecda.edu',
  contact: '+94 11 234 5678',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=200&auto=format&fit=crop'
};

// Create a broadcast channel for real-time tab synchronization
const syncChannel = new BroadcastChannel('mecda_sync_channel');

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>([]);
  const [teacherPayments, setTeacherPayments] = useState<TeacherPayment[]>([]);
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo>(DEFAULT_ACADEMY);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setSyncing(true);
    
    try {
      const [t, s, sch, att, sp, tp, ai] = await Promise.all([
        db.teachers.toArray(),
        db.students.toArray(),
        db.schedules.toArray(),
        db.attendance.toArray(),
        db.studentPayments.toArray(),
        db.teacherPayments.toArray(),
        db.academyInfo.get('main')
      ]);
      
      setTeachers(t);
      setStudents(s);
      setSchedules(sch);
      setAttendance(att);
      setStudentPayments(sp);
      setTeacherPayments(tp);
      if (ai) setAcademyInfo(ai);
      else await db.academyInfo.put({ ...DEFAULT_ACADEMY, id: 'main' });
    } catch (err) {
      console.error("Failed to load local database:", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen for sync messages from other tabs
    const handleSync = (event: MessageEvent) => {
      if (event.data === 'REFRESH_DATA') {
        loadData(true);
      }
    };

    syncChannel.addEventListener('message', handleSync);
    return () => syncChannel.removeEventListener('message', handleSync);
  }, [loadData]);

  const notifySync = () => {
    syncChannel.postMessage('REFRESH_DATA');
  };

  const addTeacher = async (t: Omit<Teacher, 'id'>) => {
    const id = 'TCH-' + Date.now().toString().slice(-6);
    const newTeacher = { ...t, id };
    await db.teachers.add(newTeacher);
    setTeachers(prev => [...prev, newTeacher]);
    notifySync();
  };

  const updateTeacher = async (t: Teacher) => {
    await db.teachers.put(t);
    setTeachers(prev => prev.map(x => x.id === t.id ? t : x));
    notifySync();
  };

  const deleteTeacher = async (id: string) => {
    await db.teachers.delete(id);
    setTeachers(prev => prev.filter(x => x.id !== id));
    notifySync();
  };

  const addStudent = async (s: Omit<Student, 'id'>) => {
    const id = 'STU-' + Date.now().toString().slice(-6);
    const newStudent = { ...s, id };
    await db.students.add(newStudent);
    setStudents(prev => [...prev, newStudent]);
    notifySync();
  };

  const updateStudent = async (s: Student) => {
    await db.students.put(s);
    setStudents(prev => prev.map(x => x.id === s.id ? s : x));
    notifySync();
  };

  const deleteStudent = async (id: string) => {
    await db.students.delete(id);
    setStudents(prev => prev.filter(x => x.id !== id));
    notifySync();
  };

  const addSchedule = async (s: Omit<ClassSchedule, 'id'>) => {
    const id = Date.now().toString();
    const newSchedule = { ...s, id };
    await db.schedules.add(newSchedule);
    setSchedules(prev => [...prev, newSchedule]);
    notifySync();
  };

  const updateSchedule = async (s: ClassSchedule) => {
    await db.schedules.put(s);
    setSchedules(prev => prev.map(x => x.id === s.id ? s : x));
    notifySync();
  };

  const deleteSchedule = async (id: string) => {
    await db.schedules.delete(id);
    setSchedules(prev => prev.filter(x => x.id !== id));
    notifySync();
  };

  const markAttendance = async (records: Omit<Attendance, 'id'>[]) => {
    const newRecords = records.map(r => ({ ...r, id: Date.now().toString() + Math.random() }));
    await db.attendance.bulkAdd(newRecords);
    setAttendance(prev => [...prev, ...newRecords]);
    notifySync();
  };

  const addStudentPayment = async (p: Omit<StudentPayment, 'id'>) => {
    const id = 'PAY-' + Date.now().toString().slice(-6);
    const newPayment = { ...p, id };
    await db.studentPayments.add(newPayment);
    setStudentPayments(prev => [...prev, newPayment]);
    notifySync();
  };

  const updateStudentPayment = async (p: StudentPayment) => {
    await db.studentPayments.put(p);
    setStudentPayments(prev => prev.map(x => x.id === p.id ? p : x));
    notifySync();
  };

  const deleteStudentPayment = async (id: string) => {
    await db.studentPayments.delete(id);
    setStudentPayments(prev => prev.filter(x => x.id !== id));
    notifySync();
  };

  const addTeacherPayment = async (p: Omit<TeacherPayment, 'id'>) => {
    const id = 'TPY-' + Date.now().toString().slice(-6);
    const newPayment = { ...p, id };
    await db.teacherPayments.add(newPayment);
    setTeacherPayments(prev => [...prev, newPayment]);
    notifySync();
  };

  const updateTeacherPayment = async (p: TeacherPayment) => {
    await db.teacherPayments.put(p);
    setTeacherPayments(prev => prev.map(x => x.id === p.id ? p : x));
    notifySync();
  };

  const deleteTeacherPayment = async (id: string) => {
    await db.teacherPayments.delete(id);
    setTeacherPayments(prev => prev.filter(x => x.id !== id));
    notifySync();
  };
  
  const updateAcademyInfo = async (info: AcademyInfo) => {
    await db.academyInfo.put({ ...info, id: 'main' });
    setAcademyInfo(info);
    notifySync();
  };

  return (
    <AppContext.Provider value={{
      teachers, students, schedules, attendance, studentPayments, teacherPayments, academyInfo, loading, syncing,
      addTeacher, updateTeacher, deleteTeacher,
      addStudent, updateStudent, deleteStudent,
      addSchedule, updateSchedule, deleteSchedule,
      markAttendance, 
      addStudentPayment, updateStudentPayment, deleteStudentPayment,
      addTeacherPayment, updateTeacherPayment, deleteTeacherPayment, 
      updateAcademyInfo
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useStore must be used within AppProvider');
  return context;
};
