export type View = 'dashboard' | 'agenda' | 'patients' | 'financial' | 'inventory' | 'settings' | 'patient-detail' | 'services' | 'blog' | 'patient-dashboard' | 'patient-appointments' | 'patient-documents' | 'patient-history' | 'patient-news' | 'patient-profile';

export interface Patient {
  id: string;
  name: string;
  age: number;
  email: string;
  phone: string;
  avatar: string;
  status: 'VIP' | 'Novo' | 'Recorrente';
  lastVisit: string;
  totalSpent: number;
  allergies?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar: string;
  procedure: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed';
  room: string;
}

export interface DBAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  patient_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  google_event_id: string | null;
  description: string | null;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  lastRestock: string;
  cost: number;
}

export interface Service {
  id: string;
  name: string;
  category: 'Facial' | 'Corporal' | 'Injetáveis' | 'Laser' | 'Outros';
  price: number;
  duration: number;
  description: string;
  active: boolean;
  expiration_months?: number; // Added for Procedure Expiration
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string;
  status: 'Rascunho' | 'Publicado';
  created_at?: string;
}

export interface AdminData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  registration: string;
  avatar: string;
}