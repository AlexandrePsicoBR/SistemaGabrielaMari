import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AnamneseFacial from './AnamneseFacial';
import AnamneseCorporal from './AnamneseCorporal';

interface ModalProps {
  onClose: () => void;
  type: 'facial' | 'corporal';
  patientData?: {
    name: string;
    birthDate: string;
    email: string;
    phone: string;
    address: string;
  };
  patientId?: string;
}

const NewAnamnesisModal: React.FC<ModalProps> = ({ onClose, type, patientData, patientId }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    if (!element) return;

    // Find the print-view element inside the ref
    const printElement = element.querySelector('#print-view') as HTMLElement;
    if (!printElement) return;

    try {
      // 1. Clone the element to render it for capture
      const clone = printElement.cloneNode(true) as HTMLElement;

      // 2. Style the clone to be visible and fixed width (A4 equivalent width ~ 794px at 96dpi, or just generous)
      clone.classList.remove('hidden', 'print:block');
      clone.style.display = 'block';
      clone.style.position = 'fixed';
      clone.style.top = '-9999px';
      clone.style.left = '0';
      clone.style.width = '210mm'; // A4 width
      clone.style.backgroundColor = 'white';
      clone.style.zIndex = '-1';
      document.body.appendChild(clone);

      // 3. Capture with html2canvas
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        windowWidth: 210 * 3.78, // approx width in pixels
      });

      // 4. Cleanup
      document.body.removeChild(clone);

      // 5. Generate PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages if content is long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Anamnese_${type}_${patientData?.name.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">

        {/* Render Anamnese Facial */}
        {type === 'facial' && patientData && (
          <>
            <div className="absolute top-4 right-4 z-50">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors bg-white shadow-sm border border-gray-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div ref={componentRef}>
                <AnamneseFacial patientData={patientData} onPrint={handleDownloadPDF} patientId={patientId} />
              </div>
            </div>
          </>
        )}

        {/* Render Anamnese Corporal */}
        {type === 'corporal' && patientData && (
          <>
            <div className="absolute top-4 right-4 z-50">
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors bg-white shadow-sm border border-gray-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div ref={componentRef}>
                <AnamneseCorporal patientData={patientData} onPrint={handleDownloadPDF} patientId={patientId} />
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default NewAnamnesisModal;