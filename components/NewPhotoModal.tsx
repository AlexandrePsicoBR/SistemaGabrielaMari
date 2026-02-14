import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/imageUtils';

export interface PhotoEntry {
  id: string;
  title: string;
  date: string;
  description: string;
  beforeUrl: string;
  afterUrl: string;
}

interface ModalProps {
  onClose: () => void;
  onSave: (entries: PhotoEntry[]) => void;
}

interface PhotoPair {
  id: string;
  label: string;
  beforeUrl: string;
  afterUrl: string;
  beforePreview: string;
  afterPreview: string;
  uploadingBefore: boolean;
  uploadingAfter: boolean;
}

const NewPhotoModal: React.FC<ModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [pairs, setPairs] = useState<PhotoPair[]>([{
    id: '1',
    label: '',
    beforeUrl: '',
    afterUrl: '',
    beforePreview: '',
    afterPreview: '',
    uploadingBefore: false,
    uploadingAfter: false
  }]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPair = () => {
    setPairs(prev => [...prev, {
      id: Date.now().toString(),
      label: '',
      beforeUrl: '',
      afterUrl: '',
      beforePreview: '',
      afterPreview: '',
      uploadingBefore: false,
      uploadingAfter: false
    }]);
  };

  const handlePairLabelChange = (id: string, value: string) => {
    setPairs(prev => prev.map(p => p.id === id ? { ...p, label: value } : p));
  };

  const handleRemovePair = (id: string) => {
    if (pairs.length === 1) return;
    setPairs(prev => prev.filter(p => p.id !== id));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, pairId: string, type: 'before' | 'after') => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    setPairs(prev => prev.map(p => p.id === pairId ? {
      ...p,
      [type === 'before' ? 'uploadingBefore' : 'uploadingAfter']: true
    } : p));

    try {
      // 1. Compress Image
      const compressedBlob = await compressImage(file, 1920, 0.8);
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
      });

      // 2. Upload to Supabase
      const fileName = `${Date.now()}-${type}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { data, error } = await supabase.storage
        .from('fotos-pacientes')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // 3. Get Signed URL (for preview) - Valid for 1 hour
      const { data: signedData, error: signedError } = await supabase.storage
        .from('fotos-pacientes')
        .createSignedUrl(fileName, 3600);

      if (signedError) throw signedError;

      setPairs(prev => prev.map(p => p.id === pairId ? {
        ...p,
        [type === 'before' ? 'beforeUrl' : 'afterUrl']: fileName,
        [type === 'before' ? 'beforePreview' : 'afterPreview']: signedData.signedUrl
      } : p));

    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erro ao fazer upload da foto. Verifique as permissões.');
    } finally {
      setPairs(prev => prev.map(p => p.id === pairId ? {
        ...p,
        [type === 'before' ? 'uploadingBefore' : 'uploadingAfter']: false
      } : p));
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.date) return;

    // Filter out pairs that have at least one photo or just valid ones?
    // Let's require at least one photo in at least one pair? Or just save valid pairs.
    // User probably wants to save all pairs displayed.

    const entries: PhotoEntry[] = pairs
      .filter(p => p.beforeUrl || p.afterUrl) // Only save if at least one photo exists
      .map(p => ({
        id: Date.now().toString() + Math.random().toString().slice(2, 6), // Temp ID
        title: p.label ? `${formData.title} - ${p.label}` : formData.title,
        date: formData.date,
        description: formData.description || '',
        beforeUrl: p.beforeUrl,
        afterUrl: p.afterUrl
      }));

    if (entries.length === 0) {
      alert('Adicione pelo menos uma foto.');
      return;
    }

    onSave(entries);
    onClose();
  };

  const isUploading = pairs.some(p => p.uploadingBefore || p.uploadingAfter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">

        <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white">
          <h2 className="text-xl font-serif font-bold text-text-main">Adicionar Fotos Antes/Depois</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6 bg-[#FDFBF9] overflow-y-auto">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Título do Registro</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                type="text"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Ex: Botox Testa"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Data</label>
              <input
                name="date"
                value={formData.date}
                onChange={handleChange}
                type="date"
                className="w-full h-10 px-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted">Observações / Detalhes</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full h-20 p-3 rounded-lg bg-white border border-[#e3e0de] focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Descreva o procedimento realizado, configurações do laser, unidades aplicadas..."
            ></textarea>
          </div>

          <div className="space-y-4">
            {pairs.map((pair, index) => (
              <div key={pair.id} className="bg-white p-4 rounded-xl border border-[#e3e0de] shadow-sm relative group/pair">
                <div className="flex justify-between items-center mb-3">
                  <input
                    type="text"
                    value={pair.label}
                    onChange={(e) => handlePairLabelChange(pair.id, e.target.value)}
                    placeholder={`Par de Fotos #${index + 1}`}
                    className="text-sm font-bold text-text-main bg-transparent border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 outline-none transition-all placeholder:text-text-muted/50 w-full max-w-[200px]"
                  />
                  {pairs.length > 1 && (
                    <button
                      onClick={() => handleRemovePair(pair.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      title="Remover par"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Antes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-text-muted flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">image</span> Foto Antes
                    </label>
                    <div className="border-2 border-dashed border-[#e3e0de] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors h-40 relative overflow-hidden group">
                      {pair.uploadingBefore ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

                        </div>
                      ) : pair.beforePreview ? (
                        <>
                          <img src={pair.beforePreview} alt="Preview Antes" className="absolute inset-0 w-full h-full object-contain bg-gray-50" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors">
                            <span className="text-white text-xs font-bold opacity-0 hover:opacity-100 transition-opacity drop-shadow-md">Alterar</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-text-muted pointer-events-none">
                          <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                          <p className="text-[10px]">Upload Antes</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, pair.id, 'before')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Depois */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-text-muted flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-primary">auto_fix</span> Foto Depois
                    </label>
                    <div className="border-2 border-dashed border-[#e3e0de] rounded-xl p-4 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-gray-100 transition-colors h-40 relative overflow-hidden group">
                      {pair.uploadingAfter ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

                        </div>
                      ) : pair.afterPreview ? (
                        <>
                          <img src={pair.afterPreview} alt="Preview Depois" className="absolute inset-0 w-full h-full object-contain bg-gray-50" />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors">
                            <span className="text-white text-xs font-bold opacity-0 hover:opacity-100 transition-opacity drop-shadow-md">Alterar</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-text-muted pointer-events-none">
                          <span className="material-symbols-outlined text-3xl mb-1">add_a_photo</span>
                          <p className="text-[10px]">Upload Depois</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, pair.id, 'after')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddPair}
            className="w-full py-3 bg-white border-2 border-dashed border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add_photo_alternate</span>
            Adicionar Mais Fotos
          </button>

        </div>

        <div className="px-6 py-4 border-t border-[#e3e0de] bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-text-muted hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-sm shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {isUploading ? 'Enviando...' : 'Salvar Registros'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewPhotoModal;