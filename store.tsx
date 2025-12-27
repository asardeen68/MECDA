
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  addTeacherPayment: (p: Omit<TeacherPayment, 'id'>) => Promise<void>;
  
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>([]);
  const [teacherPayments, setTeacherPayments] = useState<TeacherPayment[]>([]);
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo>(DEFAULT_ACADEMY);
  const [loading, setLoading] = useState(true);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const initData = async () => {
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
      }
    };
    initData();
  }, []);

  const addTeacher = async (t: Omit<Teacher, 'id'>) => {
    const id = 'TCH-' + Date.now().toString().slice(-6);
    const newTeacher = { ...t, id };
    await db.teachers.add(newTeacher);
    setTeachers(prev => [...prev, newTeacher]);
  };

  const updateTeacher = async (t: Teacher) => {
    await db.teachers.put(t);
    setTeachers(prev => prev.map(x => x.id === t.id ? t : x));
  };

  const deleteTeacher = async (id: string) => {
    await db.teachers.delete(id);
    setTeachers(prev => prev.filter(x => x.id !== id));
  };

  const addStudent = async (s: Omit<Student, 'id'>) => {
    const id = 'STU-' + Date.now().toString().slice(-6);
    const newStudent = { ...s, id };
    await db.students.add(newStudent);
    setStudents(prev => [...prev, newStudent]);
  };

  const updateStudent = async (s: Student) => {
    await db.students.put(s);
    setStudents(prev => prev.map(x => x.id === s.id ? s : x));
  };

  const deleteStudent = async (id: string) => {
    await db.students.delete(id);
    setStudents(prev => prev.filter(x => x.id !== id));
  };

  const addSchedule = async (s: Omit<ClassSchedule, 'id'>) => {
    const id = Date.now().toString();
    const newSchedule = { ...s, id };
    await db.schedules.add(newSchedule);
    setSchedules(prev => [...prev, newSchedule]);
  };

  const updateSchedule = async (s: ClassSchedule) => {
    await db.schedules.put(s);
    setSchedules(prev => prev.map(x => x.id === s.id ? s : x));
  };

  const deleteSchedule = async (id: string) => {
    await db.schedules.delete(id);
    setSchedules(prev => prev.filter(x => x.id !== id));
  };

  const markAttendance = async (records: Omit<Attendance, 'id'>[]) => {
    const newRecords = records.map(r => ({ ...r, id: Date.now().toString() + Math.random() }));
    await db.attendance.bulkAdd(newRecords);
    setAttendance(prev => [...prev, ...newRecords]);
  };

  const addStudentPayment = async (p: Omit<StudentPayment, 'id'>) => {
    const id = 'PAY-' + Date.now().toString().slice(-6);
    const newPayment = { ...p, id };
    await db.studentPayments.add(newPayment);
    setStudentPayments(prev => [...prev, newPayment]);
  };

  const addTeacherPayment = async (p: Omit<TeacherPayment, 'id'>) => {
    const id = 'TPY-' + Date.now().toString().slice(-6);
    const newPayment = { ...p, id };
    await db.teacherPayments.add(newPayment);
    setTeacherPayments(prev => [...prev, newPayment]);
  };
  
  const updateAcademyInfo = async (info: AcademyInfo) => {
    await db.academyInfo.put({ ...info, id: 'main' });
    setAcademyInfo(info);
  };

  return (
    <AppContext.Provider value={{
      teachers, students, schedules, attendance, studentPayments, teacherPayments, academyInfo, loading,
      addTeacher, updateTeacher, deleteTeacher,
      addStudent, updateStudent, deleteStudent,
      addSchedule, updateSchedule, deleteSchedule,
      markAttendance, addStudentPayment, addTeacherPayment, updateAcademyInfo
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
