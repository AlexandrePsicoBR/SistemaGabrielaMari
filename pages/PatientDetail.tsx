import React, { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import NewEvolutionModal from '../components/NewEvolutionModal';
import NewAnamnesisModal from '../components/NewAnamnesisModal';
import NewPhotoModal, { PhotoEntry } from '../components/NewPhotoModal';
import PhotoViewerModal from '../components/PhotoViewerModal';
import NewTransactionModal, { Transaction } from '../components/NewTransactionModal';
import NewPatientModal from '../components/NewPatientModal';
import TermoBotox from '../components/TermoBotox';
import { TermoBioestimulador } from '../components/TermoBioestimulador';
import TermoFioPDO from '../components/TermoFioPDO';
import CartaHialuronidase from '../components/CartaHialuronidase';
import TermoHidrolipo from '../components/TermoHidrolipo';
import TermoIntradermo from '../components/TermoIntradermo';
import TermoLifting from '../components/TermoLifting';
import TermoMicroagulhamento from '../components/TermoMicroagulhamento';
import TermoPeeling from '../components/TermoPeeling';
import TermoPreenchimento from '../components/TermoPreenchimento';

interface PatientDetailProps {
  onBack: () => void;
  patientId: string | null;
  userRole?: 'admin' | 'patient' | null;
}

interface HistoryEvent {
  id: string;
  title: string;
  date: string;
  doctor: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  status: string;
  statusColor: string;
  description: string;
  patientSummary?: string;
  clinicalNotes?: string;
  tags?: string[];
  timelineColor?: string;
  isoDate?: string;
  expirationDate?: string;
}



const PatientDetail: React.FC<PatientDetailProps> = ({ onBack, patientId, userRole }) => {
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<HistoryEvent[]>([]);
  const [selectedEvolution, setSelectedEvolution] = useState<any>(null); // For editing
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  // Update state when patientId changes
  const getSignedUrlHelper = async (pathOrUrl: string) => {
    if (!pathOrUrl) return '';
    let path = pathOrUrl;
    if (pathOrUrl.startsWith('http')) {
      const parts = pathOrUrl.split('fotos-pacientes/');
      if (parts.length > 1) path = parts[1].split('?')[0];
      else return pathOrUrl;
    }
    try {
      const { data } = await supabase.storage
        .from('fotos-pacientes')
        .createSignedUrl(path, 3600);
      return data?.signedUrl || pathOrUrl;
    } catch (e) {
      console.error('Error signing URL:', e);
      return pathOrUrl;
    }
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;

      try {
        setLoading(true);

        // 1. Fetch Patient Details
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();

        if (patientError) throw patientError;

        const avatarUrl = await getSignedUrlHelper(patient.avatar_url);

        // Map DB fields to UI fields (snake_case to camelCase where needed)
        const mappedPatient = {
          ...patient,
          birthDate: patient.birth_date,
          totalInvested: patient.total_spent,

          visits: patient.visits_count,
          avatar: avatarUrl,
          allergies: patient.allergies,
          street: patient.street,
          city: patient.city,
          state: patient.state,
          zipCode: patient.zip_code
        };
        setCurrentPatient(mappedPatient);

        // 1.5 Fetch Services Metadata for dynamic calculation
        const { data: servicesData } = await supabase
          .from('services')
          .select('name, expiration_months')
          .gt('expiration_months', 0);

        const serviceMap = new Map();
        if (servicesData) {
          servicesData.forEach((s: any) => {
            // Store lower case name for matching
            serviceMap.set(s.name.trim().toLowerCase(), s.expiration_months);
          });
        }

        // 2. Fetch History
        const { data: history, error: historyError } = await supabase
          .from('clinical_history')
          .select('*')
          .eq('patient_id', patientId)
          .order('date', { ascending: false });

        if (historyError) throw historyError;

        const mappedHistory = (history || []).map((h: any) => {
          let expirationDate = h.expiration_date;

          // Dynamic calculation if missing
          if (!expirationDate && h.title) {
            const normalizedTitle = h.title.trim().toLowerCase();
            if (serviceMap.has(normalizedTitle)) {
              const months = serviceMap.get(normalizedTitle);
              const d = new Date(h.date);
              d.setMonth(d.getMonth() + months);
              expirationDate = d.toISOString().split('T')[0];
            }
          }

          return {
            id: h.id,
            title: h.title,
            date: formatDate(new Date(h.date), { day: '2-digit', month: 'short', year: 'numeric' }),
            isoDate: h.date,
            doctor: h.doctor || 'Dra. Gabriela Mari',
            icon: h.type === 'procedure' ? 'face' : 'medical_services',
            iconColor: 'text-primary',
            iconBg: 'bg-primary/10',
            status: h.status || 'Concluído',
            statusColor: 'bg-green-100 text-green-700 border-green-200',
            description: h.description,
            patientSummary: h.patient_summary,
            clinicalNotes: h.clinical_notes,
            tags: h.tags || [],
            timelineColor: 'bg-primary',
            expirationDate: expirationDate
          };
        });
        setHistoryData(mappedHistory);

        // 3. Fetch Photos
        const { data: photos, error: photosError } = await supabase
          .from('patient_photos')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (photosError) throw photosError;

        const mappedPhotos = await Promise.all((photos || []).map(async (p: any) => {
          return {
            id: p.id,
            title: p.title || 'Foto',
            date: p.date || p.created_at,
            beforeUrl: await getSignedUrlHelper(p.before_url),
            afterUrl: await getSignedUrlHelper(p.after_url),
            description: p.description
          };
        }));
        setGalleryItems(mappedPhotos);

        // 4. Fetch Financial
        const { data: financial, error: financialError } = await supabase
          .from('transactions')
          .select('*')
          .eq('patient_name', mappedPatient.name)
          .order('date', { ascending: false });

        if (financialError) throw financialError;

        const mappedFinancial = (financial || []).map((f: any) => ({
          id: f.id,
          description: f.description,
          value: Number(f.value),
          date: f.date,
          type: f.type,
          category: f.category,
          paymentMethod: f.payment_method,
          status: f.status,
          patientName: f.patient_name,
          cost: Number(f.cost) || 0
        }));

        setFinancialRecords(mappedFinancial);

        // 5. Fetch Patient Documents
        const { data: docs, error: docsError } = await supabase
          .from('patient_documents')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (docsError) throw docsError;
        setPatientDocuments(docs || []);

      } catch (error) {
        console.error('Error fetching patient details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const [activeTab, setActiveTab] = useState('overview');
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showAnamnesisModal, setShowAnamnesisModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null);
  const [galleryItems, setGalleryItems] = useState<PhotoEntry[]>([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Transaction | null>(null);
  const [financialRecords, setFinancialRecords] = useState<Transaction[]>([]);

  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [viewingSignedDoc, setViewingSignedDoc] = useState<any>(null); // For viewing signed docs
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(null);

  const [expandedEvents, setExpandedEvents] = useState<string[]>(['1']);
  const [patientDocuments, setPatientDocuments] = useState<any[]>([]);

  // const historyData: HistoryEvent[] = currentPatient.history || []; // Replaced by state

  const handleSavePatient = async (updatedData: any) => {
    try {
      if (!currentPatient?.id) return;

      let avatarPath = currentPatient.avatar; // Default to existing (which might be Signed URL, oops. Need real path if not changing)
      // Actually, if we don't change it, we shouldn't update it effectively, or we should keep the DB value.
      // But `updatedData.avatar` comes from Modal.
      // If Modal returns same URL, it's fine (we might save Signed URL to DB? No, better to strip).
      // If Modal returns base64, we upload.

      if (updatedData.avatar && updatedData.avatar.startsWith('data:')) {
        const res = await fetch(updatedData.avatar);
        const blob = await res.blob();
        const fileName = `avatars/${currentPatient.id}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-pacientes')
          .upload(fileName, blob, { upsert: true });

        if (uploadError) throw uploadError;
        avatarPath = fileName;
      } else if (updatedData.avatar && updatedData.avatar.startsWith('http')) {
        // If it's an existing URL, try to extract path to keep DB clean
        const parts = updatedData.avatar.split('fotos-pacientes/');
        if (parts.length > 1) {
          const potentialPath = parts[1].split('?')[0]; // Remove query params (signed url token)
          avatarPath = potentialPath;
        }
      }

      const { error } = await supabase
        .from('patients')
        .update({
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
          address: updatedData.street || updatedData.address, // fallback
          street: updatedData.street,
          city: updatedData.city,
          state: updatedData.state,
          zip_code: updatedData.zipCode,
          status: updatedData.status,
          birth_date: updatedData.birthDate,
          gender: updatedData.gender,
          source: updatedData.source,
          avatar_url: avatarPath,
          allergies: updatedData.allergies
        })
        .eq('id', currentPatient.id);

      if (error) throw error;

      // Get new Signed URL for local state if we just uploaded
      let newDisplayAvatar = avatarPath;
      if (avatarPath && !avatarPath.startsWith('http')) {
        const { data: signedData } = await supabase.storage
          .from('fotos-pacientes')
          .createSignedUrl(avatarPath, 3600);
        newDisplayAvatar = signedData?.signedUrl || avatarPath;
      }

      // Merge updated fields into current patient local state
      const updatedPatient = { ...currentPatient, ...updatedData, avatar: newDisplayAvatar };
      setCurrentPatient(updatedPatient);

      setShowEditPatientModal(false);
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Erro ao salvar dados do paciente.');
    }
  };

  // --- ANAMNESIS TAGS INTEGRATION ---
  const [anamnesisTags, setAnamnesisTags] = useState<string[]>([]);
  const [anamnesisAllergies, setAnamnesisAllergies] = useState<string>('');

  React.useEffect(() => {
    const loadAnamnesisTags = () => {
      const tags: Set<string> = new Set();
      const pId = patientId || '1';

      // 1. Facial Anamnesis
      try {
        const facialData = localStorage.getItem(`anamnese_facial_${pId}`);
        if (facialData) {
          const parsed = JSON.parse(facialData);
          const h = parsed.historicoSaude || {};

          // Boolean flags
          ['diabetes', 'hipertensao', 'tireoide', 'cardiacos', 'marcapasso', 'autoimune', 'coagulacao', 'herpes', 'epilepsia', 'gestante', 'lactante', 'tentante'].forEach(key => {
            if (h[key]) tags.add(key.charAt(0).toUpperCase() + key.slice(1));
          });

          // String fields
          if (h.alergias && h.alergias.trim()) tags.add(`Alergia: ${h.alergias}`);
        }
      } catch (e) { console.error("Error loading facial tags", e); }

      // 2. Corporal Anamnesis
      try {
        const corporalData = localStorage.getItem(`anamnese_corporal_${pId}`);
        if (corporalData) {
          const parsed = JSON.parse(corporalData);
          const h = parsed.historicoPaciente || {};

          // Nested objects
          if (h.medicacao?.uso && h.medicacao?.quais) tags.add(`Medicação: ${h.medicacao.quais}`);
          if (h.alergias?.uso && h.alergias?.quais) tags.add(`Alergia: ${h.alergias.quais}`);
          if (h.afeccoesCutaneas?.uso) tags.add('Afecções Cutâneas');

          // Pressao
          if (h.pressao?.hipertensao) tags.add('Hipertensão');
          if (h.pressao?.hipotensao) tags.add('Hipotensão');

          // Direct bools
          if (h.marcapasso) tags.add('Marcapasso');
          if (h.epilepsia) tags.add('Epilepsia');

          // Disturbio
          if (h.disturbioCirculatorio?.trombose) tags.add('Trombose');
          if (h.disturbioCirculatorio?.varizes) tags.add('Varizes');

          // Diabetes
          if (h.diabetes?.tem) tags.add(`Diabetes ${h.diabetes.tipo || ''}`);

          // Metais
          if (h.metais?.tem) tags.add('Metais no Corpo');
        }
      } catch (e) { console.error("Error loading corporal tags", e); }



      setAnamnesisTags(Array.from(tags));

      // --- Extract Allergies for Documents ---
      const allergyList: string[] = [];

      // Facial Allergies
      try {
        const facialData = localStorage.getItem(`anamnese_facial_${pId}`);
        if (facialData) {
          const parsed = JSON.parse(facialData);
          if (parsed.historicoSaude?.alergias && parsed.historicoSaude.alergias.trim()) {
            allergyList.push(parsed.historicoSaude.alergias.trim());
          }
        }
      } catch (e) { }

      // Corporal Allergies
      try {
        const corporalData = localStorage.getItem(`anamnese_corporal_${pId}`);
        if (corporalData) {
          const parsed = JSON.parse(corporalData);
          if (parsed.historicoPaciente?.alergias?.uso && parsed.historicoPaciente.alergias.quais) {
            allergyList.push(parsed.historicoPaciente.alergias.quais.trim());
          }
        }
      } catch (e) { }

      // Deduplicate and set
      const uniqueAllergies = Array.from(new Set(allergyList)).filter(Boolean).join(', ');
      setAnamnesisAllergies(uniqueAllergies);
    };

    loadAnamnesisTags();

    // Listen for storage events (if multiple tabs) or custom events could be added, 
    // but for now simple mount/update check is enough. 
    // To make it reactive to modal saves, we can add a listener or reliance on window focus.
    window.addEventListener('focus', loadAnamnesisTags);
    return () => window.removeEventListener('focus', loadAnamnesisTags);
  }, [patientId, showAnamnesisModal]); // Re-run when modal closes/opens or ID changes

  const [showAnamnesisMenu, setShowAnamnesisMenu] = useState(false);
  const [anamnesisType, setAnamnesisType] = useState<'facial' | 'corporal'>('facial');

  const patientData = currentPatient ? {
    name: currentPatient.name,
    email: currentPatient.email,
    phone: currentPatient.phone,
    address: currentPatient.address,
    status: currentPatient.status,
    birthDate: currentPatient.birthDate || '',
    gender: currentPatient.gender,
    source: currentPatient.source,
    avatar: currentPatient.avatar,
    allergies: currentPatient.allergies,
    street: currentPatient.street,
    city: currentPatient.city,
    state: currentPatient.state,
    zipCode: currentPatient.zipCode
  } : {
    name: '',
    email: '',
    phone: '',
    address: '',
    status: '',
    birthDate: '',
    gender: '',
    source: '',
    avatar: '',
    allergies: ''
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: 'Histórico / Evolução' },
    { id: 'photos', label: 'Fotos Antes/Depois' },
    { id: 'financial', label: 'Financeiro' },
    { id: 'documents', label: 'Documentos' },
  ];

  const toggleEvent = (id: string) => {
    setExpandedEvents(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleAddPhoto = async (entries: PhotoEntry[]) => {
    try {
      if (!currentPatient?.id) return;

      const savedEntries: PhotoEntry[] = [];

      // Process sequentially or in parallel. Parallel is likely fine.
      await Promise.all(entries.map(async (entry) => {
        const { data, error } = await supabase
          .from('patient_photos')
          .insert({
            patient_id: currentPatient.id,
            title: entry.title,
            description: entry.description,
            before_url: entry.beforeUrl,
            after_url: entry.afterUrl,
            date: entry.date
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          // Generate signed URLs immediately
          const getSigned = async (path: string) => {
            if (!path) return '';
            const { data: signedData } = await supabase.storage
              .from('fotos-pacientes')
              .createSignedUrl(path, 3600);
            return signedData?.signedUrl || path;
          };

          savedEntries.push({
            id: data.id,
            title: data.title,
            date: data.date,
            description: data.description,
            beforeUrl: await getSigned(data.before_url),
            afterUrl: await getSigned(data.after_url)
          });
        }
      }));

      if (savedEntries.length > 0) {
        setGalleryItems(prev => [...savedEntries, ...prev]);
      }

    } catch (error) {
      console.error('Error adding photos:', error);
      alert('Erro ao adicionar foto(s).');
    }
  };

  const handleUpdatePhoto = async (updated: PhotoEntry) => {
    try {
      const { error } = await supabase
        .from('patient_photos')
        .update({
          title: updated.title,
          description: updated.description,
          before_url: updated.beforeUrl,
          after_url: updated.afterUrl,
          date: updated.date
        })
        .eq('id', updated.id);

      if (error) throw error;

      // Generate signed URLs if paths are present
      const getSigned = async (path: string) => {
        if (!path) return '';
        // If it's already a full http URL (e.g. from a previous signed url that hasn't expired or legacy), 
        // we might need to be careful. But updated.beforeUrl usually comes from the modal which keeps the path in state?
        // Actually, PhotoViewerModal keeps 'beforeUrl' which gets populated with the Signed URL on view.
        // If user edits, we might receive the Signed URL back.
        // Wait, we update the DB with `updated.beforeUrl`. If that is a Signed URL, we mess up the DB.
        // Debug: Check what `PhotoViewerModal` sends back. 
        // If we assume `PhotoViewerModal` sends back what it has, we might be saving Signed URLs to the DB.
        // FIX: PhotoViewerModal should handle paths vs URLs better. 
        // For now, let's assume we just want to ensure display works.

        const { data: signedData } = await supabase.storage
          .from('fotos-pacientes')
          .createSignedUrl(path, 3600);
        return signedData?.signedUrl || path;
      };

      const updatedWithSignedUrl = {
        ...updated,
        beforeUrl: await getSigned(updated.beforeUrl),
        afterUrl: await getSigned(updated.afterUrl)
      };

      setGalleryItems(galleryItems.map(item => item.id === updated.id ? updatedWithSignedUrl : item));
      setSelectedPhoto(updatedWithSignedUrl);
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Erro ao atualizar foto.');
    }
  };

  const handleDeletePhoto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patient_photos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGalleryItems(galleryItems.filter(item => item.id !== id));
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Erro ao excluir foto.');
    }
  };

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setShowPaymentModal(true);
  };

  const handleEditPayment = (payment: Transaction) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    try {
      if (!currentPatient?.name) return;

      // Re-fetch transactions for this patient
      const { data: financial, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('patient_name', currentPatient.name)
        .order('date', { ascending: false });

      if (error) throw error;

      const mappedFinancial = (financial || []).map((f: any) => ({
        id: f.id,
        description: f.description,
        value: Number(f.value),
        date: f.date,
        type: f.type,
        category: f.category,
        paymentMethod: f.payment_method,
        status: f.status,
        patientName: f.patient_name,
        cost: Number(f.cost) || 0
      }));

      setFinancialRecords(mappedFinancial);
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error refreshing payments:', error);
      alert('Erro ao atualizar pagamentos.');
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [200, 100, 100] as [number, number, number]; // Rose
    const secondaryColor = [100, 100, 100] as [number, number, number]; // Gray

    let currentY = 20;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Gabriela Mari", 14, currentY);
    doc.setFontSize(12);
    doc.setTextColor(...secondaryColor);
    doc.text("Estética Avançada", 14, currentY + 6);

    currentY += 15;
    doc.setDrawColor(230, 230, 230);
    doc.line(14, currentY, 196, currentY);
    currentY += 10;

    // --- 1. Dados do Paciente ---
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("Dados do Paciente", 14, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const col1X = 14;
    const col2X = 110;
    const lineHeight = 6;

    doc.text(`Nome: ${patientData.name}`, col1X, currentY);
    doc.text(`CPF: ${currentPatient?.cpf || 'Não informado'}`, col2X, currentY);
    currentY += lineHeight;

    doc.text(`Nascimento: ${formatDate(new Date(patientData.birthDate))}`, col1X, currentY);
    doc.text(`Idade: ${currentPatient ? new Date().getFullYear() - new Date(currentPatient.birth_date).getFullYear() : '-'} anos`, col2X, currentY);
    currentY += lineHeight;

    doc.text(`Telefone: ${patientData.phone}`, col1X, currentY);
    doc.text(`Email: ${patientData.email}`, col2X, currentY);
    currentY += lineHeight;

    doc.text(`Endereço: ${patientData.address || 'Não informado'}`, col1X, currentY);
    currentY += lineHeight + 4;

    // Tags / Alergias
    const allTags = Array.from(new Set([...(currentPatient?.tags || []), ...anamnesisTags]));
    if (allTags.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Observações / Alergias:", 14, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(allTags.join(", "), 60, currentY);
      currentY += 10;
    }

    // --- 2. Histórico Clínico ---
    currentY += 10;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Histórico de Procedimentos", 14, currentY);
    currentY += 5;

    const historyTableData = historyData.map(event => [
      event.date,
      event.title,
      event.doctor,
      event.description || event.patientSummary || '-',
      event.status
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Procedimento', 'Profissional', 'Detalhes', 'Status']],
      body: historyTableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 10 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        3: { cellWidth: 80 } // Wider column for details
      }
    });

    // Update Y after table
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // --- 3. Financeiro ---
    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Resumo Financeiro", 14, currentY);
    currentY += 10;

    // Financial Totals
    const totalPaid = financialRecords.filter(r => r.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
    const totalPending = financialRecords.filter(r => r.status === 'Pendente').reduce((acc, curr) => acc + curr.value, 0);

    doc.setFontSize(10);
    doc.setTextColor(0, 150, 0); // Green
    doc.text(`Total Pago: R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, currentY);

    doc.setTextColor(200, 100, 0); // Orange
    doc.text(`Em Aberto: R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, currentY);
    currentY += 8;

    const financialTableData = financialRecords.map(rec => [
      formatDate(new Date(rec.date)),
      rec.description,
      rec.paymentMethod || '-',
      rec.status,
      `R$ ${rec.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Data', 'Descrição', 'Forma Pagto', 'Status', 'Valor']],
      body: financialTableData,
      theme: 'grid',
      headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 10 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // --- 4. Documentos Assinados ---
    const signedDocs = patientDocuments.filter(d => d.status === 'signed');
    if (signedDocs.length > 0) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("Documentos Assinados", 14, currentY);
      currentY += 5;

      const docsTableData = signedDocs.map(d => [
        d.title || d.type.charAt(0).toUpperCase() + d.type.slice(1).replace('-', ' '),
        'Assinado',
        d.signed_at ? formatDate(new Date(d.signed_at)) : formatDate(new Date())
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Documento', 'Status', 'Data (Ref)']],
        body: docsTableData,
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 150], textColor: 255 },
        styles: { fontSize: 9 },
      });
    }

    // --- Footer ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em ${formatDate(new Date())} às ${formatTime(new Date())} - Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.save(`Prontuario_Completo_${patientData.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleMarkAsSigned = async (docType: string) => {
    try {
      if (!currentPatient?.id) return;

      // 1. Check if document exists
      const existingDoc = patientDocuments.find(d => d.type === docType);
      let docResult;

      if (existingDoc) {
        // Update existing
        const { data, error } = await supabase
          .from('patient_documents')
          .update({
            status: 'signed',
            signed_at: new Date().toISOString()
          })
          .eq('id', existingDoc.id)
          .select()
          .single();

        if (error) throw error;
        docResult = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('patient_documents')
          .insert({
            patient_id: currentPatient.id,
            type: docType,
            title: `Termo de ${docType.charAt(0).toUpperCase() + docType.slice(1)}`, // Simple title generation
            status: 'signed',
            signed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        docResult = data;
      }

      // 2. Log in clinical_history (timeline)
      const { data: historyEntry, error: historyError } = await supabase
        .from('clinical_history')
        .insert({
          patient_id: currentPatient.id,
          date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
          title: `Documento Assinado: ${docType.charAt(0).toUpperCase() + docType.slice(1)}`,
          doctor: 'Sistema', // Or logged in user if available
          description: `Documento de ${docType} impresso e assinado.`,
          patient_summary: `Assinou termo de ${docType}.`,
          type: 'document',
          status: 'Concluído',
          tags: ['documento']
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Update local state for badge
      if (existingDoc) {
        setPatientDocuments(prev => prev.map(d => d.type === docType ? docResult : d));
      } else {
        setPatientDocuments(prev => [...prev, docResult]);
      }

      // Update local history timeline
      const newEvent: HistoryEvent = {
        id: historyEntry.id,
        title: historyEntry.title,
        date: formatDate(new Date(historyEntry.date), { day: '2-digit', month: 'short', year: 'numeric' }),
        isoDate: historyEntry.date,
        doctor: historyEntry.doctor,
        patientSummary: historyEntry.patient_summary,
        clinicalNotes: historyEntry.clinical_notes,
        icon: 'history_edu',
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-100',
        status: historyEntry.status,
        statusColor: 'bg-green-100 text-green-700 border-green-200',
        description: historyEntry.description
      };
      setHistoryData([newEvent, ...historyData]);

    } catch (error) {
      console.error('Error marking document as signed:', error);
    }
  };

  const handlePrintDocument = () => {
    window.print();
    if (selectedDocument) {
      handleMarkAsSigned(selectedDocument);
    }
  };

  const handleSaveEvolution = async (data: any) => {
    try {
      if (!currentPatient?.id) return;

      if (selectedEvolution) {
        // Update existing
        const { error } = await supabase
          .from('clinical_history')
          .update({
            date: data.date,
            title: data.title,
            description: data.title,
            patient_summary: data.patientSummary,
            clinical_notes: data.clinicalNotes,
          })
          .eq('id', selectedEvolution.id);

        if (error) throw error;

        // Update local state
        setHistoryData(historyData.map(h => h.id === selectedEvolution.id ? {
          ...h,
          date: formatDate(new Date(data.date), { day: '2-digit', month: 'short', year: 'numeric' }),
          isoDate: data.date,
          title: data.title,
          patientSummary: data.patientSummary,
          clinicalNotes: data.clinicalNotes,
          description: data.patientSummary || data.title
        } : h));

        setSelectedEvolution(null);

      } else {
        // Insert new
        const { data: inserted, error } = await supabase
          .from('clinical_history')
          .insert({
            patient_id: currentPatient.id,
            date: data.date,
            title: data.title,
            doctor: data.doctor,
            description: data.title, // or description
            patient_summary: data.patientSummary,
            clinical_notes: data.clinicalNotes,
            type: 'procedure', // default
            status: data.status,
            tags: [] // if any
          })
          .select()
          .single();

        if (error) throw error;

        const newEvent: HistoryEvent = {
          id: inserted.id,
          title: inserted.title,
          date: formatDate(new Date(inserted.date), { day: '2-digit', month: 'short', year: 'numeric' }),
          isoDate: inserted.date,
          doctor: inserted.doctor,
          patientSummary: inserted.patient_summary,
          clinicalNotes: inserted.clinical_notes,
          icon: 'healing',
          iconColor: 'text-primary',
          iconBg: 'bg-primary/10',
          status: inserted.status,
          statusColor: 'bg-green-100 text-green-700 border-green-200',
          description: inserted.patient_summary || inserted.description
        };

        // Update local state and history data
        setHistoryData([newEvent, ...historyData]);
      }
    } catch (error) {
      console.error('Error saving evolution:', error);
      alert('Erro ao salvar evolução.');
    }
  };

  const handleDeleteHistory = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta evolução?')) return;

    try {
      const { error } = await supabase
        .from('clinical_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistoryData(historyData.filter(h => h.id !== id));
    } catch (error) {
      console.error('Error deleting evolution:', error);
      alert('Erro ao excluir evolução.');
    }
  };

  const renderOverview = () => (
    <>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#f3f2f1]">
            <h3 className="font-bold text-text-main mb-4">Resumo do Paciente</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center p-3 rounded-xl bg-green-50/50 border border-green-100">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                  <span className="material-symbols-outlined text-[20px]">attach_money</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wide">Total Investido</p>
                  <p className="text-lg font-bold text-text-main">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      financialRecords
                        .filter(r => r.status === 'Pago' || r.status === 'Recebido')
                        .reduce((acc, curr) => acc + curr.value, 0)
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                  <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wide">Em Aberto</p>
                  <p className="text-lg font-bold text-text-main">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      financialRecords
                        .filter(r => r.status === 'Pendente' || r.status === 'Em aberto')
                        .reduce((acc, curr) => acc + curr.value, 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Total Profit - All Records */}
              <div className="flex items-center p-3 rounded-xl bg-teal-50/50 border border-teal-100">
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mr-3">
                  <span className="material-symbols-outlined text-[20px]">trending_up</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wide">Total Lucro</p>
                  <p className="text-lg font-bold text-text-main">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      financialRecords.reduce((acc, curr) => {
                        const revenue = curr.type === 'income' ? curr.value : 0;
                        const itemCost = curr.type === 'income' ? (curr.cost || 0) : curr.value;
                        return acc + (revenue - itemCost);
                      }, 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Total Cost - All Records */}
              <div className="flex items-center p-3 rounded-xl bg-red-50/50 border border-red-100">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                  <span className="material-symbols-outlined text-[20px]">trending_down</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wide">Total Custo</p>
                  <p className="text-lg font-bold text-text-main">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      financialRecords.reduce((acc, curr) => {
                        const itemCost = curr.type === 'income' ? (curr.cost || 0) : curr.value;
                        return acc + itemCost;
                      }, 0)
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                  <span className="material-symbols-outlined text-[20px]">event_repeat</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-wide">Visitas</p>
                  <p className="text-lg font-bold text-text-main">
                    {historyData.filter(h => h.doctor !== 'Sistema').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#f3f2f1]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-text-main">Detalhes de Contato</h3>
              <button
                onClick={() => setShowEditPatientModal(true)}
                className="text-primary text-sm font-medium hover:underline"
              >
                Editar
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-background-light p-2 rounded text-text-muted">
                  <span className="material-symbols-outlined text-sm">mail</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase">Email</p>
                  <p className="text-sm font-medium text-text-main">{patientData.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-background-light p-2 rounded text-text-muted">
                  <span className="material-symbols-outlined text-sm">chat</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase">WhatsApp</p>
                  <p className="text-sm font-medium text-text-main">{patientData.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-background-light p-2 rounded text-text-muted">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase">Endereço</p>
                  <p className="text-sm font-medium text-text-main">
                    {[
                      patientData.street,
                      patientData.city,
                      patientData.state
                    ].filter(Boolean).join(', ') || patientData.address || 'Não informado'}
                    {patientData.zipCode && <span className="block text-xs text-text-muted mt-0.5">CEP: {patientData.zipCode}</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-[#f3f2f1] overflow-hidden">
            <div className="p-6 border-b border-[#f3f2f1] flex justify-between items-center">
              <h3 className="font-bold text-text-main text-lg">Últimos Procedimentos</h3>
              <button
                onClick={() => setActiveTab('history')}
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Ver Todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="divide-y divide-[#f3f2f1]">
              {historyData.slice(0, 3).map((proc, idx) => (
                <div key={idx} className="p-5 flex items-center justify-between hover:bg-background-light transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined">{proc.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-text-main">{proc.title}</p>
                      <p className="text-xs text-text-muted mt-0.5">{proc.doctor} • {proc.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${proc.statusColor}`}>{proc.status}</span>
                  </div>
                </div>
              ))}
              {historyData.length === 0 && (
                <div className="p-8 text-center text-text-muted">Nenhum procedimento registrado.</div>
              )}
            </div>
          </div>


          {/* Expiration Block */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#f3f2f1] overflow-hidden mt-4">
            <div className="p-6 border-b border-[#f3f2f1] flex justify-between items-center bg-orange-50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-600">alarm_on</span>
                <h3 className="font-bold text-gray-900 text-lg">Vencimento de Procedimentos</h3>
              </div>
              <span className="px-2 py-1 bg-white rounded text-xs font-bold text-orange-600 border border-orange-200">Próximos 30 dias</span>
            </div>

            <div className="divide-y divide-[#f3f2f1]">
              {historyData.filter(h => {
                if (!h.expirationDate) return false;
                const expDate = new Date(h.expirationDate);
                const today = new Date();
                const thirtyDays = new Date();
                thirtyDays.setDate(today.getDate() + 30);

                // Fix timezone issue for comparison (simple approach)
                const expStr = h.expirationDate;
                const thirtyDaysStr = thirtyDays.toISOString().split('T')[0];

                return expStr <= thirtyDaysStr;
              }).sort((a, b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime())
                .map((proc, idx) => {
                  const expDate = new Date(proc.expirationDate!);
                  const today = new Date();
                  const isExpired = expDate < today;

                  return (
                    <div key={idx} className="p-5 flex items-center justify-between hover:bg-background-light transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${isExpired ? 'bg-red-500' : 'bg-orange-500'}`}>
                          <span className="material-symbols-outlined">history_toggle_off</span>
                        </div>
                        <div>
                          <p className="font-bold text-text-main">{proc.title}</p>
                          <p className={`text-xs mt-0.5 font-bold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                            {isExpired ? 'Vencido em: ' : 'Vence em: '} {formatDate(expDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => {
                            const message = `Olá, gostaria de agendar o retorno do procedimento ${proc.title} que ${isExpired ? 'venceu' : 'vence'} em ${formatDate(expDate)}.`;
                            window.open(`https://wa.me/55${patientData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                          }}
                          className="text-primary text-sm font-bold border border-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">calendar_add_on</span> Reagendar
                        </button>
                      </div>
                    </div>
                  );
                })}
              {historyData.filter(h => h.expirationDate).length === 0 && (
                <div className="p-6 text-center text-text-muted text-sm">Não há procedimentos vencidos ou a vencer.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderHistory = () => (
    <div className="space-y-8 animate-fade-in relative">
      {/* Timeline Line */}
      <div className="absolute left-[8px] md:left-[120px] top-4 bottom-0 w-[2px] bg-[#f3f2f1] z-0 hidden md:block"></div>

      <div className="flex justify-between items-center mb-6 pl-0 md:pl-0">
        <div>
          <h3 className="font-bold text-lg text-text-main">Histórico Clínico Completo</h3>
          <p className="text-text-muted text-sm">Linha do tempo de evoluções e consultas</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="text-primary text-sm font-bold hover:underline flex items-center gap-2 border border-primary px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Baixar Prontuário PDF
        </button>
      </div>

      {historyData.map((event, index) => {
        const dateObj = new Date(event.date); // Provided date string like "15 Ago 2023" might need parsing if mostly text, but assumed consistent
        // For proper date formatting, let's assume the string is roughly parsable or we split it. 
        // Given existing mock data "15 Ago 2023", we'll just use it directly for display split.
        const [day, month, year] = event.date.split(' ');

        return (
          <div key={event.id} className="relative z-10 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-start group">

            {/* Date Column */}
            <div className="hidden md:flex flex-col items-end text-right pt-2 pr-8 bg-background-light">
              <span className="font-bold text-gray-900 text-sm">{day} {month}</span>
              <span className="text-xs text-text-muted">{year}</span>
              {/* Dot on timeline */}
              <div className="absolute left-[115px] top-[14px] w-3 h-3 rounded-full bg-white border-2 border-primary z-20 shadow-sm"></div>
            </div>

            {/* Mobile Date (visible only on small) */}
            <div className="md:hidden flex items-center gap-2 mb-2">
              <span className="font-bold text-gray-900">{event.date}</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            {/* Card Content */}
            <div className="bg-white rounded-2xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-shadow overflow-hidden">

              {/* Card Header */}
              <div className="p-6 pb-4 flex justify-between items-start border-b border-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${event.iconBg || 'bg-gray-100'} flex items-center justify-center ${event.iconColor || 'text-gray-500'}`}>
                    <span className="material-symbols-outlined text-[20px]">{event.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-text-main">{event.title}</h4>
                  </div>
                </div>
                <span className="bg-gray-100 text-text-muted text-xs font-bold px-3 py-1 rounded-full">
                  {event.doctor}
                </span>
                {userRole === 'admin' && (
                  <div className="flex gap-1 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvolution({
                          id: event.id,
                          date: event.isoDate || new Date().toISOString().split('T')[0],
                          title: event.title,
                          patientSummary: event.patientSummary,
                          clinicalNotes: event.clinicalNotes,
                          doctor: event.doctor,
                          status: event.status
                        });
                        setShowEvolutionModal(true);
                      }}
                      className="p-1 text-text-muted hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                      title="Editar Evolução"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(event.id);
                      }}
                      className="p-1 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir Evolução"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sections */}
              <div className="p-6 pt-4 space-y-6">

                {/* Patient Summary */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FDF6F0] flex-shrink-0 flex items-center justify-center mt-1">
                    <span className="material-symbols-outlined text-[16px] text-[#D4A373]">visibility</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-widest text-[#D4A373] uppercase">Resumo do Paciente</p>
                    <p className="text-sm text-text-main leading-relaxed">
                      {event.patientSummary || event.description}
                    </p>
                  </div>
                </div>

                {/* Clinical Notes (Internal) */}
                {(event.clinicalNotes || event.description) && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-[16px] text-gray-500">lock</span>
                    </div>
                    <div className="space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Notas Clínicas</p>
                        <span className="bg-gray-100 border border-gray-200 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded">INTERNO</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 font-mono text-xs text-gray-700 leading-relaxed">
                        {event.clinicalNotes || event.description}
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        );
      })}

      {historyData.length === 0 && (
        <div className="ml-0 md:ml-32 p-12 text-center bg-white rounded-xl border border-dashed border-gray-200 text-text-muted">
          <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">history_edu</span>
          <p>Nenhuma evolução registrada para este paciente.</p>
        </div>
      )}
    </div>
  );

  const handleRequestSignature = async (type: string, title: string) => {
    try {
      if (!patientId) {
        alert('Erro: ID do paciente inválido.');
        return;
      }

      // Verify if already exists in DB (avoid race conditions with stale state)
      const { data: existing } = await supabase
        .from('patient_documents')
        .select('id')
        .eq('patient_id', patientId)
        .eq('type', type)
        .maybeSingle();

      if (existing) {
        alert('Já existe um documento ou solicitação deste tipo.');
        // Refresh to sync state
        const { data: docs } = await supabase
          .from('patient_documents')
          .select('*')
          .eq('patient_id', patientId);
        setPatientDocuments(docs || []);
        return;
      }

      const { error } = await supabase.from('patient_documents').insert({
        patient_id: patientId,
        type,
        title,
        status: 'pending'
      });

      if (error) throw error;
      alert('Solicitação de assinatura enviada com sucesso!');

      // Refresh documents
      const { data: docs } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId);
      setPatientDocuments(docs || []);

    } catch (error: any) {
      console.error('Error requesting signature:', error);
      alert('Erro ao solicitar assinatura. Tente novamente.');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleReissueDocument = async (type: string, title: string) => {
    if (!currentPatient?.id) return;

    // Create new pending document regardless of existing ones
    // This maintains history and resets the flow for the admin
    try {
      const { error } = await supabase.from('patient_documents').insert({
        patient_id: currentPatient.id,
        type,
        title,
        status: 'pending' // Start as pending
      });

      if (error) throw error;
      alert('Novo documento gerado para assinatura!');

      // Refresh documents
      const { data: docs } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', currentPatient.id)
        .order('created_at', { ascending: false });
      setPatientDocuments(docs || []);

    } catch (error) {
      console.error('Error reissuing document:', error);
      alert('Erro ao gerar novo documento.');
    }
  };

  const handleViewSignedDocument = async (doc: any) => {
    if (!doc) return;

    let sigUrl = null;
    if (doc.signature_url) {
      sigUrl = await getSignedUrlHelper(doc.signature_url);
    }

    setViewingSignedDoc(doc);
    setCurrentSignatureUrl(sigUrl);
    setSelectedDocument(doc.type);
    setShowDocumentModal(true);
  };

  const renderPhotos = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-bold text-lg text-text-main">Galeria de Fotos</h3>
          <p className="text-text-muted text-sm">Registro fotográfico de evolução</p>
        </div>
        <button
          onClick={() => setShowPhotoModal(true)}
          className="bg-text-main text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_a_photo</span>
          Adicionar Fotos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedPhoto(item)}
            className="bg-white p-4 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary/80">photo_library</span>
                <h4 className="font-bold text-text-main text-sm">{item.title}</h4>
              </div>
              <span className="text-xs text-text-muted bg-gray-100 px-2 py-1 rounded">
                {item.date.includes('-') && item.date.length === 10
                  ? item.date.split('-').reverse().join('/')
                  : formatDate(new Date(item.date))
                }
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 h-48">
              <div className="relative h-full overflow-hidden rounded-lg bg-gray-100">
                <img src={item.beforeUrl} className="w-full h-full object-cover" alt="Antes" />
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">ANTES</span>
              </div>
              <div className="relative h-full overflow-hidden rounded-lg bg-gray-100">
                <img src={item.afterUrl} className="w-full h-full object-cover" alt="Depois" />
                <span className="absolute bottom-2 left-2 bg-primary/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">DEPOIS</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-text-muted line-clamp-1 group-hover:text-primary transition-colors">
              {item.description}
            </div>
          </div>
        ))}

        {galleryItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-text-muted border-2 border-dashed border-[#f3f2f1] rounded-xl">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">image_not_supported</span>
            <p>Nenhuma foto registrada.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-bold text-lg text-text-main">Histórico Financeiro</h3>
          <p className="text-text-muted text-sm">Pagamentos e orçamentos do paciente</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-bold">
              <span className="block text-[10px] uppercase text-green-600 font-normal">Total Pago</span>
              R$ {financialRecords.filter(r => r.status === 'Pago' || r.status === 'Recebido').reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-100 text-sm font-bold">
              <span className="block text-[10px] uppercase text-orange-600 font-normal">Em Aberto</span>
              R$ {financialRecords.filter(r => r.status === 'Pendente' || r.status === 'Em aberto').reduce((acc, curr) => acc + curr.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            {userRole === 'admin' && (
              <button
                onClick={handleAddPayment}
                className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Pagamento
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#f3f2f1] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#fcfaf8] border-b border-[#f3f2f1]">
            <tr>
              <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase">Data</th>
              <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase">Descrição</th>
              <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase">Forma Pagto</th>
              <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase">Status</th>
              <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase text-right">Valor</th>
              <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase text-right">Custo</th>
              <th className="py-4 px-6 text-xs font-bold text-text-muted uppercase text-right">Lucro</th>
              <th className="py-4 px-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f2f1]">
            {financialRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                <td className="py-4 px-6 text-sm font-medium text-text-main">{formatDate(new Date(record.date), { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td className="py-4 px-6">
                  <span className="text-sm font-bold text-text-main block">{record.description.split(' - ')[0]}</span>
                  <span className="text-xs text-text-muted">{record.description.split(' - ')[1] || record.category}</span>
                </td>
                <td className="py-4 px-6 text-sm text-text-muted">{record.paymentMethod || '-'}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${record.status === 'Pago' || record.status === 'Recebido'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : record.status === 'Em aberto' || record.status === 'Pendente'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : record.status === 'Não pago'
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                    {record.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm font-bold text-text-main text-right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.value)}
                </td>
                <td className="py-4 px-6 text-sm text-text-muted text-right">
                  {record.type === 'income' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.cost || 0) : '-'}
                </td>
                <td className="py-4 px-6 text-sm font-bold text-right">
                  {record.type === 'income' ? (
                    <div className="flex flex-col items-end">
                      <span className={(record.value - (record.cost || 0)) >= 0 ? "text-green-600" : "text-red-600"}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.value - (record.cost || 0))}
                      </span>
                      {record.value > 0 && (
                        <span className="text-xs text-text-muted">
                          {(((record.value - (record.cost || 0)) / record.value) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ) : '-'}
                </td>
                <td className="py-4 px-6 text-right">
                  {userRole === 'admin' && (
                    <button
                      onClick={() => handleEditPayment(record)}
                      className="text-text-muted hover:text-primary p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Editar Detalhes"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {financialRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted">
                  Nenhum registro financeiro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDocuments = () => {
    const getDocStatus = (type: string) => {
      return patientDocuments.find(d => d.type === type);
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-bold text-lg text-text-main">Documentos e Termos</h3>
            <p className="text-text-muted text-sm">Termos de consentimento e fichas para impressão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Botox */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">description</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Botox</h4>
            <p className="text-text-muted text-sm mb-6">Termo de esclarecimento e consentimento para aplicação de Toxina Botulínica.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('botox')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('botox'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('botox')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('botox');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('botox', 'Termo de Consentimento - Botox');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('botox', 'Termo de Consentimento - Botox');
                    }
                    setSelectedDocument('botox');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-primary hover:text-white transition-colors border border-gray-200 hover:border-primary flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('botox')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('botox', 'Termo de Consentimento - Botox')}
                disabled={!!getDocStatus('botox')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('botox')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-primary hover:bg-primary/10 border-primary/20'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('botox') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Bioestimulador */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">spa</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Bioestimulador</h4>
            <p className="text-text-muted text-sm mb-6">Termo de consentimento para bioestimulador de colágeno.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('bioestimulador')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('bioestimulador'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('bioestimulador')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('bioestimulador');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('bioestimulador', 'Termo de Consentimento - Bioestimulador');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('bioestimulador', 'Termo de Consentimento - Bioestimulador');
                    }
                    setSelectedDocument('bioestimulador');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-pink-500 hover:text-white transition-colors border border-gray-200 hover:border-pink-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('bioestimulador')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('bioestimulador', 'Termo de Consentimento - Bioestimulador')}
                disabled={!!getDocStatus('bioestimulador')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('bioestimulador')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-pink-600 hover:bg-pink-50 border-pink-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('bioestimulador') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Fio PDO */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">texture</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Fio PDO</h4>
            <p className="text-text-muted text-sm mb-6">Termo de consentimento para implante de fios de PDO.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('fio-pdo')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('fio-pdo'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('fio-pdo')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('fio-pdo');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('fio-pdo', 'Termo de Consentimento - Fios PDO');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('fio-pdo', 'Termo de Consentimento - Fios PDO');
                    }
                    setSelectedDocument('fio-pdo');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-orange-500 hover:text-white transition-colors border border-gray-200 hover:border-orange-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('fio-pdo')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('fio-pdo', 'Termo de Consentimento - Fios PDO')}
                disabled={!!getDocStatus('fio-pdo')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('fio-pdo')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-orange-600 hover:bg-orange-50 border-orange-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('fio-pdo') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Carta Hialuronidase */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">medical_services</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Carta Hialuronidase</h4>
            <p className="text-text-muted text-sm mb-6">Carta de informação ao paciente sobre Hialuronidase.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('hialuronidase')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('hialuronidase'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('hialuronidase')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('hialuronidase');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('hialuronidase', 'Carta de Informação - Hialuronidase');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('hialuronidase', 'Carta de Informação - Hialuronidase');
                    }
                    setSelectedDocument('hialuronidase');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors border border-gray-200 hover:border-blue-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('hialuronidase')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              {/* Note: I removed the extra button here because Hialuronidase card in view_file only had one button block or I truncated it.
                 Wait, view_file showed two buttons. Let me restore it.
              */}
            </div>
          </div>

          {/* Teal placeholder div - kept to match original structure although no buttons visible in snippet */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">water_drop</span>
            </div>
            {/* Add content if known, otherwise leave as placeholder or omit */}
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Hidrolipo</h4>
            <p className="text-text-muted text-sm mb-6">Termo de consentimento para Hidrolipoclasia.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('hidrolipo')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('hidrolipo'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('hidrolipo')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('hidrolipo');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('hidrolipo', 'Termo de Consentimento - Hidrolipo');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('hidrolipo', 'Termo de Consentimento - Hidrolipo');
                    }
                    setSelectedDocument('hidrolipo');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-teal-500 hover:text-white transition-colors border border-gray-200 hover:border-teal-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('hidrolipo')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('hidrolipo', 'Termo de Consentimento - Hidrolipo')}
                disabled={!!getDocStatus('hidrolipo')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('hidrolipo')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-teal-600 hover:bg-teal-50 border-teal-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('hidrolipo') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Intradermo */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">vaccines</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Intradermo</h4>
            <p className="text-text-muted text-sm mb-6">Consentimento para Intradermoterapia.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('intradermo')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('intradermo'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('intradermo')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('intradermo');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('intradermo', 'Termo de Consentimento - Intradermoterapia');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('intradermo', 'Termo de Consentimento - Intradermoterapia');
                    }
                    setSelectedDocument('intradermo');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-pink-500 hover:text-white transition-colors border border-gray-200 hover:border-pink-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('intradermo')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('intradermo', 'Termo de Consentimento - Intradermoterapia')}
                disabled={!!getDocStatus('intradermo')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('intradermo')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-pink-600 hover:bg-pink-50 border-pink-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('intradermo') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Lifting */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">face_retouching_natural</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Lifting</h4>
            <p className="text-text-muted text-sm mb-6">Consentimento para Lifting Temporal.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('lifting')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('lifting'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('lifting')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('lifting');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('lifting', 'Termo de Consentimento - Lifting Temporal');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('lifting', 'Termo de Consentimento - Lifting Temporal');
                    }
                    setSelectedDocument('lifting');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-purple-500 hover:text-white transition-colors border border-gray-200 hover:border-purple-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('lifting')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('lifting', 'Termo de Consentimento - Lifting Temporal')}
                disabled={!!getDocStatus('lifting')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('lifting')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-purple-600 hover:bg-purple-50 border-purple-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('lifting') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Microagulhamento */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">grid_on</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Microagulhamento</h4>
            <p className="text-text-muted text-sm mb-6">Consentimento para Microagulhamento.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('microagulhamento')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('microagulhamento'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('microagulhamento')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('microagulhamento');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('microagulhamento', 'Termo de Consentimento - Microagulhamento');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('microagulhamento', 'Termo de Consentimento - Microagulhamento');
                    }
                    setSelectedDocument('microagulhamento');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-orange-500 hover:text-white transition-colors border border-gray-200 hover:border-orange-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('microagulhamento')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('microagulhamento', 'Termo de Consentimento - Microagulhamento')}
                disabled={!!getDocStatus('microagulhamento')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('microagulhamento')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-orange-600 hover:bg-orange-50 border-orange-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('microagulhamento') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Peeling */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">healing</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Peeling</h4>
            <p className="text-text-muted text-sm mb-6">Consentimento para Tratamento com Peeling.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('peeling')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('peeling'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('peeling')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('peeling');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('peeling', 'TERMO DE CONSENTIMENTO - PEELING');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('peeling', 'TERMO DE CONSENTIMENTO - PEELING');
                    }
                    setSelectedDocument('peeling');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-teal-500 hover:text-white transition-colors border border-gray-200 hover:border-teal-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('peeling')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('peeling', 'TERMO DE CONSENTIMENTO - PEELING')}
                disabled={!!getDocStatus('peeling')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('peeling')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-teal-600 hover:bg-teal-50 border-teal-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('peeling') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>

          {/* Preenchimento */}
          <div className="bg-white p-6 rounded-xl border border-[#f3f2f1] shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">vaccines</span>
            </div>
            <h4 className="font-bold text-text-main text-lg mb-2">Termo Preenchimento</h4>
            <p className="text-text-muted text-sm mb-6">Consentimento para Preenchimento Facial.</p>
            <div className="flex flex-col gap-3">
              {getDocStatus('preenchimento')?.status === 'signed' && (
                <button
                  onClick={() => handleViewSignedDocument(getDocStatus('preenchimento'))}
                  className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Já Assinado
                </button>
              )}
              {getDocStatus('preenchimento')?.status === 'pending' && (
                <div className="w-full py-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-lg border border-yellow-200 flex items-center justify-center gap-2 text-xs">
                  <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                  Assinatura Pendente
                </div>
              )}
              <button
                onClick={() => {
                  const doc = getDocStatus('preenchimento');
                  if (doc?.status === 'signed') {
                    if (confirm('Deseja gerar uma nova via deste documento para assinatura?')) {
                      handleReissueDocument('preenchimento', 'Termo de Consentimento - Preenchimento Facial');
                    }
                  } else {
                    if (!doc) {
                      handleRequestSignature('preenchimento', 'Termo de Consentimento - Preenchimento Facial');
                    }
                    setSelectedDocument('preenchimento');
                    setShowDocumentModal(true);
                    setViewingSignedDoc(null);
                    setCurrentSignatureUrl(null);
                  }
                }}
                className="w-full py-2 bg-background-light text-text-main font-bold rounded-lg hover:bg-pink-500 hover:text-white transition-colors border border-gray-200 hover:border-pink-500 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {getDocStatus('preenchimento')?.status === 'signed' ? 'Imprimir Novamente' : 'Preencher & Imprimir'}
              </button>
              <button
                onClick={() => handleRequestSignature('preenchimento', 'Termo de Consentimento - Preenchimento Facial')}
                disabled={!!getDocStatus('preenchimento')}
                className={`w-full py-2 font-bold rounded-lg transition-colors border flex items-center justify-center gap-2 ${getDocStatus('preenchimento')
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-background-light text-pink-600 hover:bg-pink-50 border-pink-200'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">draw</span>
                {getDocStatus('preenchimento') ? 'Solicitação Enviada' : 'Solicitar Assinatura App'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !currentPatient) {
    return (
      <div className="flex items-center justify-center h-full animate-fade-in bg-background-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted font-medium">Carregando prontuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in print:block print:h-auto print:overflow-visible print:relative">
      <div className="px-8 py-6 border-b border-[#f3f2f1] bg-white sticky top-0 z-10 print:static print:border-none print:p-0 print:mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors print:hidden">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Voltar para Pacientes
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {currentPatient.avatar ? (
                <img
                  src={currentPatient.avatar}
                  alt={patientData.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md relative bg-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl">person</span>
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full z-10"></span>
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-text-main">{patientData.name}</h1>
              <p className="text-text-muted">{new Date().getFullYear() - new Date(patientData.birthDate).getFullYear()} Anos • {patientData.gender}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${patientData.status === 'VIP' ? 'bg-[#FFD700]/10 text-[#B8860B] border-[#FFD700]/20' :
                  patientData.status === 'Ativo' ? 'bg-green-100 text-green-700 border-green-200' :
                    patientData.status === 'Inativo' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                  {patientData.status}
                </span>
                {Array.from(new Set([...(currentPatient.tags || []), ...anamnesisTags]))
                  .filter((tag: string) => !['VIP', 'Ativo', 'Inativo'].includes(tag) && tag !== patientData.status)
                  .map((tag: string) => (
                    <span key={tag} className="bg-rose-50 text-rose-600 text-xs font-bold px-2 py-0.5 rounded border border-rose-100">{tag}</span>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 print:hidden relative">
            <div className="relative">
              <button
                onClick={() => setShowAnamnesisMenu(!showAnamnesisMenu)}
                className="bg-white border border-[#e3e0de] text-text-main px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">medical_information</span>
                Anamnese
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>

              {showAnamnesisMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#e3e0de] rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  <button
                    onClick={() => {
                      setAnamnesisType('facial');
                      setShowAnamnesisModal(true);
                      setShowAnamnesisMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-50"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">face</span>
                    <div>
                      <p className="font-bold text-sm text-text-main">Anamnese Facial</p>
                      <p className="text-xs text-text-muted">Avaliação Facial</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setAnamnesisType('corporal');
                      setShowAnamnesisModal(true);
                      setShowAnamnesisMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary text-xl">accessibility_new</span>
                    <div>
                      <p className="font-bold text-sm text-text-main">Anamnese Corporal</p>
                      <p className="text-xs text-text-muted">Avaliação Corporal</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowEvolutionModal(true)}
              className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 font-medium"
            >
              <span className="material-symbols-outlined">add</span>
              Nova Evolução
            </button>
          </div>
        </div>

        <div className="flex gap-8 mt-8 border-b border-[#f3f2f1] print:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium transition-all relative ${activeTab === tab.id
                ? 'text-primary'
                : 'text-text-muted hover:text-text-main'
                }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto bg-background-light p-8 ${showDocumentModal ? 'print:hidden' : ''}`}>
        <div className="max-w-5xl mx-auto space-y-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'photos' && renderPhotos()}
          {activeTab === 'financial' && renderFinancial()}
          {activeTab === 'documents' && renderDocuments()}
        </div>
      </div>

      {showEvolutionModal && (
        <NewEvolutionModal
          onClose={() => { setShowEvolutionModal(false); setSelectedEvolution(null); }}
          onSave={handleSaveEvolution}
          initialData={selectedEvolution}
        />
      )}

      {showAnamnesisModal && (
        <NewAnamnesisModal
          onClose={() => setShowAnamnesisModal(false)}
          type={anamnesisType}
          patientData={{
            name: patientData.name,
            birthDate: patientData.birthDate,
            email: patientData.email,
            phone: patientData.phone,
            address: patientData.address,
          }}
          patientId={patientId || 'temp-id'}
        />
      )}

      {showPhotoModal && (
        <NewPhotoModal
          onClose={() => setShowPhotoModal(false)}
          onSave={handleAddPhoto}
        />
      )}

      {selectedPhoto && (
        <PhotoViewerModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onUpdate={handleUpdatePhoto}
          onDelete={handleDeletePhoto}
        />
      )}

      {showPaymentModal && (
        <NewTransactionModal
          onClose={() => setShowPaymentModal(false)}
          onSave={handleSavePayment}
          initialData={selectedPayment}
          initialPatientName={patientData.name}
        />
      )}

      {showEditPatientModal && (
        <NewPatientModal
          onClose={() => setShowEditPatientModal(false)}
          onSave={handleSavePatient}
          initialData={patientData}
        />
      )}

      {/* Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:absolute print:inset-0 print:bg-white print:z-auto print:static print:block">
          <div className="bg-gray-100 w-full h-full md:w-[90%] md:h-[95%] lg:w-[1000px] lg:h-[95%] rounded-xl shadow-2xl overflow-hidden flex flex-col print:shadow-none print:w-full print:h-auto print:rounded-none bg-white print:overflow-visible print:block">

            {/* Modal Header - Hidden on Print */}
            <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main text-lg">
                    {selectedDocument === 'botox' ? 'Termo de Consentimento - Botox' :
                      selectedDocument === 'bioestimulador' ? 'Termo de Consentimento - Bioestimulador' :
                        selectedDocument === 'fio-pdo' ? 'Termo de Consentimento - Fio PDO' :
                          selectedDocument === 'hialuronidase' ? 'Carta de Informação - Hialuronidase' :
                            selectedDocument === 'hidrolipo' ? 'Termo de Consentimento - Hidrolipo' :
                              selectedDocument === 'intradermo' ? 'Termo de Consentimento - Intradermoterapia' :
                                selectedDocument === 'lifting' ? 'Termo de Consentimento - Lifting Temporal' :
                                  selectedDocument === 'microagulhamento' ? 'Termo de Consentimento - Microagulhamento' :
                                    selectedDocument === 'peeling' ? 'TERMO DE CONSENTIMENTO - PEELING' :
                                      selectedDocument === 'preenchimento' ? 'Termo de Consentimento - Preenchimento Facial' :
                                        'Documento'}
                  </h3>
                  <p className="text-xs text-text-muted">Revise os dados antes de imrpimir</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDocumentModal(false)}
                  className="px-4 py-2 text-text-muted font-bold hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePrintDocument}
                  className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined">print</span>
                  Imprimir
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50 print:p-0 print:overflow-visible print:h-auto print:block">
              {selectedDocument === 'botox' && (
                <TermoBotox
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                  signatureUrl={currentSignatureUrl}
                  signatureDate={viewingSignedDoc?.signed_at}
                />
              )}
              {selectedDocument === 'bioestimulador' && (
                <TermoBioestimulador
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                  signatureUrl={currentSignatureUrl}
                  signatureDate={viewingSignedDoc?.signed_at}
                />
              )}
              {selectedDocument === 'fio-pdo' && (
                <TermoFioPDO
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                  signatureUrl={currentSignatureUrl}
                  signatureDate={viewingSignedDoc?.signed_at}
                />
              )}
              {selectedDocument === 'hialuronidase' && (
                <CartaHialuronidase
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                  signatureUrl={currentSignatureUrl}
                  signatureDate={viewingSignedDoc?.signed_at}
                />
              )}
              {selectedDocument === 'hidrolipo' && (
                <TermoHidrolipo
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                  signatureUrl={currentSignatureUrl}
                  signatureDate={viewingSignedDoc?.signed_at}
                />
              )}
              {selectedDocument === 'intradermo' && (
                <TermoIntradermo
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                  signatureUrl={currentSignatureUrl}
                  signatureDate={viewingSignedDoc?.signed_at}
                />
              )}
              {selectedDocument === 'lifting' && (
                <TermoLifting
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    endereco: patientData.address,
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                />
              )}
              {selectedDocument === 'microagulhamento' && (
                <TermoMicroagulhamento
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                />
              )}
              {selectedDocument === 'peeling' && (
                <TermoPeeling
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                />
              )}
              {selectedDocument === 'preenchimento' && (
                <TermoPreenchimento
                  paciente={{
                    nome: patientData.name,
                    dataNascimento: formatDate(new Date(patientData.birthDate)),
                    telefone: patientData.phone,
                    cpf: "123.456.789-00",
                    alergias: anamnesisAllergies || currentPatient.allergies
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;