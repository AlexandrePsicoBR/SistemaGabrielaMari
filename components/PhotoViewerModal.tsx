import React, { useState, useEffect } from 'react';
import { formatDate } from '../lib/dateUtils';
import { PhotoEntry } from './NewPhotoModal';

interface ModalProps {
  photo: PhotoEntry;
  onClose: () => void;
  onUpdate: (updatedPhoto: PhotoEntry) => void;
  onDelete: (id: string) => void;
}

const PhotoViewerModal: React.FC<ModalProps> = ({ photo, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PhotoEntry>(photo);

  useEffect(() => {
    setFormData(photo);
  }, [photo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este registro fotográfico?')) {
      onDelete(photo.id);
      // O fechamento do modal é gerenciado pelo componente pai ao atualizar o estado,
      // mas chamamos onClose para garantir.
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e3e0de] flex justify-between items-center bg-white z-10">
          <div>
            {isEditing ? (
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="text-xl font-serif font-bold text-text-main border-b border-gray-300 focus:border-primary outline-none px-1"
              />
            ) : (
              <h2 className="text-xl font-serif font-bold text-text-main">{formData.title}</h2>
            )}
            <p className="text-sm text-text-muted mt-1 flex items-center gap-2">
              {isEditing ? (
                <input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="text-xs border border-gray-300 rounded px-2 py-0.5"
                />
              ) : (
                <span>{formatDate(new Date(formData.date))}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1 mr-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Excluir
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#e3e0de] text-text-muted text-sm font-medium hover:bg-gray-50 hover:text-text-main transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Editar
                </button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-text-muted text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#FDFBF9] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[400px]">

            {/* Antes */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wide text-white bg-black/60 px-2 py-0.5 rounded">Antes</span>
              </div>
              <div className="relative flex-1 rounded-xl overflow-hidden bg-gray-100 border border-[#e3e0de] group min-h-[300px]">
                <img src={formData.beforeUrl} alt="Antes" className="absolute inset-0 w-full h-full object-contain bg-black/5" />
                {isEditing && (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-white/95 border-t border-gray-200 backdrop-blur-sm">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1 block">URL da Imagem</label>
                    <input
                      name="beforeUrl"
                      value={formData.beforeUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full text-xs p-2 rounded-lg bg-gray-50 border border-gray-200 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Depois */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wide text-white bg-primary px-2 py-0.5 rounded">Depois</span>
              </div>
              <div className="relative flex-1 rounded-xl overflow-hidden bg-gray-100 border border-[#e3e0de] group min-h-[300px]">
                <img src={formData.afterUrl} alt="Depois" className="absolute inset-0 w-full h-full object-contain bg-black/5" />
                {isEditing && (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-white/95 border-t border-gray-200 backdrop-blur-sm">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1 block">URL da Imagem</label>
                    <input
                      name="afterUrl"
                      value={formData.afterUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full text-xs p-2 rounded-lg bg-gray-50 border border-gray-200 text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-6 bg-white p-4 rounded-xl border border-[#e3e0de]">
            <label className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 block">Detalhes da Evolução</label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full h-24 p-3 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-primary resize-none bg-gray-50 focus:bg-white transition-colors"
              />
            ) : (
              <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap">
                {formData.description || "Nenhuma observação registrada."}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PhotoViewerModal;