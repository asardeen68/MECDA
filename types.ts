
export enum Grade {
  G6 = '6',
  G7 = '7',
  G8 = '8',
  G9 = '9',
  G10 = '10',
  G11 = '11'
}

export enum PaymentType {
  HOURLY = 'Hourly',
  MONTHLY = 'Monthly'
}

export enum Status {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export enum PaymentStatus {
  PAID = 'Paid',
  PARTIAL = 'Partially Paid',
  UNPAID = 'Unpaid'
}

export interface AcademyInfo {
  name: string;
  address: string;
  email: string;
  contact: string;
  logoUrl: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  grades: Grade[];
  paymentType: PaymentType;
  rate: number;
  contact: string;
  whatsapp: string;
  status: Status;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  grade: Grade;
  contact: string;
  whatsapp: string;
  status: Status;
}

export interface ClassSchedule {
  id: string;
  grade: Grade;
  subject: string;
  teacherId: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  rateOverride?: number; // Added for flexible payment logic
  month: string;
  year: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string; // References ClassSchedule.id
  date: string;
  isPresent: boolean;
}

export interface StudentPayment {
  id: string;
  studentId: string;
  grade: Grade;
  month: string;
  year: string;
  date: string;
  totalFee: number;
  paidAmount: number;
  outstandingAmount: number;
  status: PaymentStatus;
  remarks: string;
}

export interface TeacherPayment {
  id: string;
  teacherId: string;
  month: string;
  grade?: Grade | 'All';
  totalClasses: number;
  totalHours: number;
  amountPayable: number;
  amountPaid: number;
  date: string;
}
