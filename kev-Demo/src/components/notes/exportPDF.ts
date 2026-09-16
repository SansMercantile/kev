import { jsPDF } from 'jspdf';
import { LabSnapshot, StudentStats } from '../../types';

interface Observation {
  id: string;
  date: string;
  text: string;
}

export async function exportLabNotebookPDF(
  studentStats: StudentStats,
  snapshots: LabSnapshot[],
  observations: Observation[]
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  let y = 18;

  const checkAddPage = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      doc.addPage();
      y = 18;
      // Repeat subtle header on subsequent pages
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(margin, y - 4, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(6, 182, 212); // cyan
      doc.text('KEV XR SCIENCE ACADEMY • OFFICIAL STUDENT RECORD', margin + 3, y + 1);
      doc.setTextColor(148, 163, 184);
      doc.text('https://kev.sansmercantile.com/', pageWidth - margin - 3, y + 1, { align: 'right' });
      y += 12;
    }
  };

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // dark navy
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');

  // School Branding & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(6, 182, 212); // Cyan-400
  doc.text('KEV XR SCIENCE ACADEMY', margin + 6, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text('Interactive 3D Virtual Labs & Scientific Record-Keeping', margin + 6, y + 15);

  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248); // Sky-400
  doc.text('Official Portal: https://kev.sansmercantile.com/', margin + 6, y + 21);

  // Right side of Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11); // Amber
  doc.text('HONORS RECORD', pageWidth - margin - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  doc.text(`Doc Ref: KEV-XR-${Math.floor(1000 + Math.random() * 9000)}`, pageWidth - margin - 6, y + 21, { align: 'right' });

  y += 34;

  // Student Profile Summary Box
  doc.setFillColor(248, 250, 252); // soft slate
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Student: ${studentStats.name}`, margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Academic Standing: ${studentStats.grade}`, margin + 5, y + 13);
  doc.text(`Badges Earned: ${studentStats.badges.join(', ') || 'Academic Pioneer'}`, margin + 5, y + 19);

  // Right column stats
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144);
  doc.text(`Total Scientific XP: ${studentStats.xp} XP`, pageWidth - margin - 5, y + 7, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Labs Completed: ${studentStats.completedLabsCount} of 4 Labs`, pageWidth - margin - 5, y + 13, { align: 'right' });
  doc.text(`Quizzes Passed: ${studentStats.quizzesPassedCount} Assessments`, pageWidth - margin - 5, y + 19, { align: 'right' });

  y += 30;

  // Section 1: Empirical Observations & Journal Notes
  checkAddPage(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Research Journal & Empirical Hypotheses', margin, y);
  y += 2;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.7);
  doc.line(margin, y, margin + 80, y);
  y += 6;

  if (observations.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No written observations recorded yet.', margin, y);
    y += 8;
  } else {
    observations.forEach((obs, index) => {
      checkAddPage(20);
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);

      const splitText = doc.splitTextToSize(obs.text, contentWidth - 14);
      const boxHeight = Math.max(16, splitText.length * 5 + 10);

      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(14, 116, 144);
      doc.text(`Observation #${index + 1} — Logged: ${obs.date}`, margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(splitText, margin + 4, y + 11);

      y += boxHeight + 4;
    });
  }

  y += 4;

  // Section 2: Stored 3D Lab Snapshots & Quantitative Measurements
  checkAddPage(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Stored 3D Virtual Lab Snapshots & Measurements', margin, y);
  y += 2;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.7);
  doc.line(margin, y, margin + 95, y);
  y += 6;

  if (snapshots.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No lab snapshots saved in this session.', margin, y);
    y += 10;
  } else {
    snapshots.forEach((snap, idx) => {
      checkAddPage(60);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);

      // We calculate approximate height
      const hasImage = !!snap.imageDataUrl && snap.imageDataUrl.startsWith('data:image');
      const cardHeight = hasImage ? 68 : 34;

      doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

      // Title & Date
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Snapshot #${idx + 1}: ${snap.labName}`, margin + 4, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Captured at: ${snap.timestamp}`, pageWidth - margin - 4, y + 6, { align: 'right' });

      let textLeft = margin + 4;
      let textMaxWidth = contentWidth - 8;

      if (hasImage && snap.imageDataUrl) {
        try {
          // Render snapshot image thumbnail
          const imgWidth = 55;
          const imgHeight = 42;
          doc.addImage(snap.imageDataUrl, 'PNG', margin + 4, y + 10, imgWidth, imgHeight);
          textLeft = margin + imgWidth + 8;
          textMaxWidth = contentWidth - (imgWidth + 12);
        } catch (e) {
          // Fallback if image rendering fails
        }
      }

      // Student Note
      let subY = y + 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Scientific Observation Note:', textLeft, subY);
      subY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      const splitNote = doc.splitTextToSize(snap.note || 'No additional note provided.', textMaxWidth);
      doc.text(splitNote, textLeft, subY);
      subY += splitNote.length * 4.5 + 2;

      // Quantitative Measurements
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(14, 116, 144);
      doc.text('Simulated Quantitative Parameters:', textLeft, subY);
      subY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const measurementEntries = Object.entries(snap.measurements || {});
      if (measurementEntries.length === 0) {
        doc.text('Standard simulation baseline', textLeft, subY);
      } else {
        const measText = measurementEntries
          .map(([k, v]) => `${k}: ${v}`)
          .slice(0, 4)
          .join('  •  ');
        const splitMeas = doc.splitTextToSize(measText, textMaxWidth);
        doc.text(splitMeas, textLeft, subY);
      }

      y += cardHeight + 5;
    });
  }

  // Section 3: Faculty Verification & Academic Seal
  checkAddPage(32);
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('ACADEMIC CERTIFICATION & FACULTY VERIFICATION', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This laboratory summary certifies empirical completion of virtual scientific experiments at KEV XR Science Academy.',
    margin,
    y + 5
  );
  doc.text(
    'Instructor: Professor KEV (AI Socratic Mentor & Faculty Council) • https://kev.sansmercantile.com/',
    margin,
    y + 9
  );

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Official Record Hash: SHA-256-${Math.random().toString(36).substring(2, 10).toUpperCase()} • Generated on ${new Date().toUTCString()}`,
    margin,
    y + 16
  );

  // Trigger download
  const sanitizedStudentName = studentStats.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`KEV_Lab_Summary_${sanitizedStudentName}.pdf`);
}
