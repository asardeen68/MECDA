
import { Student, StudentPayment, AcademyInfo } from './types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const calculateHours = (startTime: string, endTime: string): number => {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.max(0, parseFloat(diff.toFixed(2)));
};

export const sendWhatsAppMessage = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount).replace('LKR', 'Rs.');
};

// Fixed: Corrected property name from payment.amount to payment.paidAmount as per types.ts
export const generateStudentPaymentMsg = (student: Student, payment: Omit<StudentPayment, 'id'>) => {
  return `Dear Parent,
Payment received successfully.
Student Name: ${student.name}
Grade: ${payment.grade}
Month: ${payment.month}
Amount Paid: Rs ${payment.paidAmount}
Thank you.`;
};

/**
 * Universal Dual-Export Function (PDF & Excel)
 */
export const exportDualReports = (
  academy: AcademyInfo, 
  title: string, 
  headers: string[], 
  data: any[][], 
  filename: string
) => {
  // 1. Generate PDF
  generatePDF(academy, title, headers, data, filename);
  
  // 2. Generate Excel
  generateExcel(academy, title, headers, data, filename);
};

const generatePDF = (academy: AcademyInfo, title: string, headers: string[], data: any[][], filename: string) => {
  const doc = new (jsPDF as any)();
  
  // Academy Header
  doc.setFontSize(22);
  doc.setTextColor(63, 81, 181); // Indigo-ish
  doc.text(academy.name, 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${academy.address} | Contact: ${academy.contact} | Email: ${academy.email}`, 105, 28, { align: 'center' });
  
  doc.setDrawColor(200);
  doc.line(20, 32, 190, 32);
  
  // Report Title
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text(title, 20, 45);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 52);

  // Table
  (doc as any).autoTable({
    startY: 60,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [63, 81, 181] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 60 },
  });

  doc.save(`${filename}.pdf`);
};

const generateExcel = (academy: AcademyInfo, title: string, headers: string[], data: any[][], filename: string) => {
  const worksheetData = [
    [academy.name],
    [academy.address],
    [academy.contact + ' | ' + academy.email],
    [],
    [title],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    headers,
    ...data
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Add some basic column widths
  const wscols = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
