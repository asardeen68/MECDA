
import { Dexie, type Table } from 'dexie';
import { Teacher, Student, ClassSchedule, Attendance, StudentPayment, TeacherPayment, AcademyInfo } from './types';

export class AppDatabase extends Dexie {
  teachers!: Table<Teacher>;
  students!: Table<Student>;
  schedules!: Table<ClassSchedule>;
  attendance!: Table<Attendance>;
  studentPayments!: Table<StudentPayment>;
  teacherPayments!: Table<TeacherPayment>;
  academyInfo!: Table<AcademyInfo & { id: string }>;

  constructor() {
    super('MECDA_LocalDB');
    // Fix: Explicitly cast 'this' to any to ensure the 'version' method is recognized by the compiler
    // This resolves issues where TypeScript fails to detect methods from the Dexie base class during inheritance.
    (this as any).version(1).stores({
      teachers: 'id, name, subject, status',
      students: 'id, name, grade, status',
      schedules: 'id, teacherId, month, year, date',
      attendance: 'id, studentId, classId, date',
      studentPayments: 'id, studentId, month, year, date, outstandingAmount',
      teacherPayments: 'id, teacherId, month',
      academyInfo: 'id'
    });
  }
}

export const db = new AppDatabase();
