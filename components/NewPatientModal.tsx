import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface ModalProps {
  onClose: () => void;
  onSave?: (data: any) => void;
  initialData?: any; // Dados para edição
}

const NewPatientModal: React.FC<ModalProps> = ({ onClose, onSave, initialData }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    email: '',
    phone: '',
    cpf: '',
    gender: 'Feminino',
    // address: '', removed in favor of structured
    street: '',
    city: '',
    state: '',
    zipCode: '',

    source: 'Instagram',
    status: 'Ativo',

    avatar: '', // New entry
    allergies: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        birthDate: initialData.birthDate || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        cpf: initialData.cpf || '',
        gender: initialData.gender || 'Feminino',

        street: initialData.street || initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',

        source: initialData.source || 'Instagram',
        status: initialData.status || 'Ativo',

        avatar: initialData.avatar || '',
        allergies: initialData.allergies || ''
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      if (onSave) {
        onSave(formData);
        onClose();
        return;
      }

      setLoading(true);
      let avatarPath = '';

      // Upload Avatar if base64
      if (formData.avatar && formData.avatar.startsWith('data:')) {
        const res = await fetch(formData.avatar);
        const blob = await res.blob();
        const fileName = `avatars/${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('fotos-pacientes')
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('fotos-pacientes')
          .getPublicUrl(fileName);

        avatarPath = publicUrlData.publicUrl;
      }

      // Insert into Supabase
      const { error } = await supabase.from('patients').insert([{
        name: formData.name,
        birth_date: formData.birthDate || null,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        gender: formData.gender,
        address: formData.street, // Legacy fallback if needed, or keep strictly structured. Let's send street to 'address' or 'street'?
        // The DB has 'address', 'street', 'city', 'state', 'zip_code'. 
        // Best practice: Populate 'street' -> 'street', 'city' -> 'city', etc.
        // And maybe populate 'address' with the full string just in case legacy views use it? 
        // Or if 'address' column is actually 'street' in intent? 
        // Looking at PatientDetail map: street: patient.street. So columns exist.

        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,

        // We can keep 'address' as redundancy or concatenation? 
        // If we remove 'address' from this object but the DB column is non-nullable, we might have issue.
        // Assuming 'address' is nullable or we treat 'street' as primary.
        // Let's safe bet: address = street.
        // address: formData.street, // Removed duplicate

        source: formData.source,
        status: formData.status,

        avatar_url: avatarPath,
        allergies: formData.allergies
      }]);

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Error saving patient:', error);
      alert('Erro ao salvar paciente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-fade-in">

        <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white">
          <h2 className="text-xl font-serif font-bold text-text-main">
            {isEditing ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 bg-[#FDFBF9] max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
              accept="image/*"
            />
            <div
              onClick={handlePhotoClick}
              className="w-20 h-20 rounded-full bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden relative group"
            >
              {formData.avatar ? (
                <>
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white">edit</span>
                  </div>
                </>
              ) : (
                <span className="material-symbols-outlined text-gray-400">add_a_photo</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">Foto do Perfil</p>
              <p className="text-xs text-text-muted">Clique para fazer upload ou alterar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Nome Completo</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Data de Nascimento</label>
              <input
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                type="date"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Telefone / WhatsApp</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">CPF</label>
              <input
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                type="text"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Gênero</label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900 bg-white"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">CEP</label>
            <input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              type="text"
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Endereço (Rua, Nº, Bairro)</label>
            <input
              name="street"
              value={formData.street}
              onChange={handleChange}
              type="text"
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Cidade</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                type="text"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Estado</label>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                type="text"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Alergias</label>
            <input
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              type="text"
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: Dipirona, Latex..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Como conheceu?</label>
              <div className="relative">
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm text-gray-900 bg-white"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Google">Google</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Outro">Outro</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Status</label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full h-10 px-3 rounded-lg border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none text-sm font-medium bg-white
                        ${formData.status === 'VIP' ? 'text-primary' : formData.status === 'Inativo' ? 'text-text-muted' : 'text-green-600'}
                      `}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="VIP">VIP</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-[#e3e0de] bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-md shadow-primary/20 flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
            {isEditing ? 'Salvar Alterações' : 'Salvar Cadastro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPatientModal;