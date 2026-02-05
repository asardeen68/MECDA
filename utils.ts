
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

export const generateStudentPaymentMsg = (student: Student, payment: Omit<StudentPayment, 'id'>) => {
  return `Dear Parent,
Payment received successfully.
Student Name: ${student.name}
Grade: ${payment.grade}
Month: ${payment.month}
Amount Paid: Rs ${payment.paidAmount}
Thank you.`;
};

export const exportDualReports = (
  academy: AcademyInfo, 
  title: string, 
  headers: string[], 
  data: any[][], 
  filename: string
) => {
  generatePDF(academy, title, headers, data, filename);
  generateExcel(academy, title, headers, data, filename);
};

const generatePDF = (academy: AcademyInfo, title: string, headers: string[], data: any[][], filename: string) => {
  const doc = new (jsPDF as any)();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Add Watermark (Centered, Faded)
  if (academy.logoUrl) {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
    const watermarkWidth = 100;
    const watermarkHeight = 100;
    doc.addImage(
      academy.logoUrl, 
      'PNG', 
      (pageWidth - watermarkWidth) / 2, 
      (pageHeight - watermarkHeight) / 2, 
      watermarkWidth, 
      watermarkHeight
    );
    doc.restoreGraphicsState();
  }

  // 2. Academy Header with Logo
  let headerStartY = 20;
  if (academy.logoUrl) {
    doc.addImage(academy.logoUrl, 'PNG', 20, 12, 15, 15);
  }

  doc.setFontSize(22);
  doc.setTextColor(63, 81, 181);
  doc.text(academy.name, 40, 22);
  
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`${academy.address}`, 40, 27);
  doc.text(`Contact: ${academy.contact} | Email: ${academy.email}`, 40, 31);
  
  doc.setDrawColor(230);
  doc.line(20, 36, 190, 36);
  
  // 3. Report Title
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text(title, 20, 48);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 54);
  doc.text(`Developed by: Mohamed Asarudeen (SLTS)`, 190, 54, { align: 'right' });

  // 4. Data Table
  (doc as any).autoTable({
    startY: 60,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [63, 81, 181], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 60 },
    didDrawPage: (data: any) => {
      // Re-add watermark on subsequent pages if necessary
      if (data.pageNumber > 1 && academy.logoUrl) {
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
        doc.addImage(academy.logoUrl, 'PNG', (pageWidth - 100) / 2, (pageHeight - 100) / 2, 100, 100);
        doc.restoreGraphicsState();
      }
    }
  });

  doc.save(`${filename}.pdf`);
};

const generateExcel = (academy: AcademyInfo, title: string, headers: string[], data: any[][], filename: string) => {
  const worksheetData = [
    [academy.name],
    [academy.address],
    [academy.contact + ' | ' + academy.email],
    ['Developed by: Mohamed Asarudeen (SLTS)'],
    [],
    [title],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
    headers,
    ...data
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wscols = headers.map(() => ({ wch: 20 }));
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
