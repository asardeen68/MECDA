import Dexie, { type Table } from 'dexie';
import { Teacher, Student, ClassSchedule, Attendance, StudentPayment, TeacherPayment, AcademyInfo } from './types';

// Fix: Changed Dexie import to a default import to ensure the TypeScript compiler correctly recognizes instance methods like .version() inherited from the Dexie base class.
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
    this.version(1).stores({
      teachers: 'id, name, subject, status',
      students: 'id, name, grade, status',
      schedules: 'id, teacherId, month, year, date',
      attendance: 'id, studentId, classId, date',
      studentPayments: 'id, studentId, month, date',
      teacherPayments: 'id, teacherId, month',
      academyInfo: 'id'
    });
  }
}

export const db = new AppDatabase();
