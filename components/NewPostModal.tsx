import React, { useState, useRef, useEffect } from 'react';
import { blogService } from '../lib/blog';
import { BlogPost } from '../types';

interface NewPostModalProps {
    onClose: () => void;
    onSave: (postData: any) => void;
    initialData?: BlogPost;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ onClose, onSave, initialData }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setCategory(initialData.category);
            setContent(initialData.content);
            setImagePreview(initialData.image_url);
        }
    }, [initialData]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleFormat = (format: 'bold' | 'italic' | 'list' | 'link') => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selectedText = content.substring(start, end);
        let newText = '';
        let newCursorPos = end;

        switch (format) {
            case 'bold':
                newText = `**${selectedText}**`;
                newCursorPos += 4;
                break;
            case 'italic':
                newText = `*${selectedText}*`;
                newCursorPos += 2;
                break;
            case 'list':
                newText = `\n- ${selectedText}`;
                newCursorPos += 3;
                break;
            case 'link':
                newText = `[${selectedText || 'texto'}](url)`;
                newCursorPos = start + 1;
                break;
        }

        const newContent = content.substring(0, start) + newText + content.substring(end);
        setContent(newContent);

        // Reset focus and cursor slightly delayed to ensure state update
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const handleSubmit = async (status: 'Rascunho' | 'Publicado') => {
        if (!title || !category) {
            alert('Por favor, preencha o título e a categoria.');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = initialData?.image_url || '';
            if (imageFile) {
                setUploadingImage(true);
                imageUrl = await blogService.uploadImage(imageFile);
                setUploadingImage(false);
            } else if (imagePreview && !initialData) {
                // If there's a preview but no initial data (rare edge case of just preview set), potentially handle or cleared
                // For now assumes imageUrl logic holds
            }

            const postData = {
                title,
                category,
                content,
                image_url: imageUrl,
                status
            };

            if (initialData) {
                await blogService.updatePost(initialData.id, postData);
            } else {
                await blogService.createPost({ ...postData, image_url: imageUrl || imagePreview || '' });
            }

            onSave(postData);
            onClose();
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Erro ao salvar o post. Tente novamente.');
        } finally {
            setLoading(false);
            setUploadingImage(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in font-display">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex flex-col gap-1 border-b border-[#eceae8]">
                    <h1 className="text-text-main text-3xl font-black leading-tight tracking-tight font-display">
                        {initialData ? 'Editar Publicação' : 'Criar Nova Publicação'}
                    </h1>
                    <p className="text-[#8a7560] text-sm font-normal font-sans">
                        {initialData ? 'Atualize os detalhes do post.' : 'Adicione os detalhes do seu novo post para o blog da clínica Gabriela Mari.'}
                    </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                    {/* Image Upload Section */}
                    <div className="flex flex-col">
                        <label className="text-text-main text-base font-medium pb-3 font-display">Imagem de Destaque</label>
                        <label className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-[#e6e0db] px-6 py-12 bg-[#FDFBF9] hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-primary/60 group-hover:text-primary mb-2 transition-colors">add_photo_alternate</span>
                                    <p className="text-text-main text-lg font-bold leading-tight tracking-tight text-center font-display">
                                        Carregar Capa do Post
                                    </p>
                                    <p className="text-[#8a7560] text-sm font-normal text-center font-sans">
                                        Clique para selecionar (JPG, PNG ou WebP)
                                    </p>
                                </div>
                            )}
                            {!imagePreview && (
                                <div className="flex min-w-[140px] items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-white border border-[#e6e0db] text-text-main text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors font-sans pointer-events-none">
                                    <span className="truncate">Upload de Imagem</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Title Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-base font-medium font-display">Título do Post</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-xl text-text-main border border-[#e6e0db] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary h-14 placeholder:text-[#8a7560] p-4 text-lg font-normal font-display transition-all outline-none"
                                placeholder="Ex: Tendências de Skincare para o Inverno 2024"
                                type="text"
                            />
                        </div>

                        {/* Category Field */}
                        <div className="flex flex-col gap-2">
                            <label className="text-text-main text-base font-medium font-display">Categoria</label>
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="appearance-none w-full rounded-xl text-text-main border border-[#e6e0db] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary h-14 p-4 text-base font-normal font-display cursor-pointer outline-none"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    <option value="Skincare">Skincare & Cuidados</option>
                                    <option value="Procedimentos">Procedimentos Estéticos</option>
                                    <option value="Dicas">Dicas da Especialista</option>
                                    <option value="Estética">Estética Avançada</option>
                                    <option value="Promoção">Promoção</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8a7560]">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Composer (Rich Text Editor Area) */}
                    <div className="flex flex-col gap-2">
                        <label className="text-text-main text-base font-medium font-display">Conteúdo do Artigo</label>
                        <div className="flex flex-col border border-[#e6e0db] rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-white">
                            {/* Author & Info Bar */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#FDFBF9] border-b border-[#e6e0db]">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="size-8 rounded-full bg-cover bg-center border border-primary/20"
                                        style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png')" }}
                                    ></div>
                                    <span className="text-xs font-medium text-[#8a7560] uppercase tracking-widest font-sans">Publicando como Gabriela Mari</span>
                                </div>
                                <span className="text-[10px] text-gray-400 italic font-sans">O rascunho é salvo automaticamente</span>
                            </div>

                            {/* Text Area */}
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full min-h-[300px] resize-none border-none bg-transparent p-6 text-text-main text-lg font-normal leading-relaxed placeholder:text-[#cfc4ba] focus:ring-0 font-display outline-none"
                                placeholder="Comece a escrever a história por trás deste tratamento..."
                            ></textarea>

                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-4 py-3 bg-[#FDFBF9] border-t border-[#e6e0db]">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#8a7560]" title="Negrito">
                                        <span className="material-symbols-outlined text-xl">format_bold</span>
                                    </button>
                                    <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#8a7560]" title="Itálico">
                                        <span className="material-symbols-outlined text-xl">format_italic</span>
                                    </button>
                                    <button onClick={() => handleFormat('list')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#8a7560]" title="Lista">
                                        <span className="material-symbols-outlined text-xl">format_list_bulleted</span>
                                    </button>
                                    <button onClick={() => handleFormat('link')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#8a7560]" title="Link">
                                        <span className="material-symbols-outlined text-xl">link</span>
                                    </button>
                                    <div className="w-px h-6 bg-[#e6e0db] mx-2"></div>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#8a7560]" title="Adicionar Imagem">
                                        <span className="material-symbols-outlined text-xl">image</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="px-8 py-6 bg-[#FDFBF9] border-t border-[#eceae8] flex items-center justify-between font-sans">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-[#8a7560] font-bold text-sm hover:text-text-main transition-colors uppercase tracking-widest disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleSubmit('Rascunho')}
                            disabled={loading}
                            className="px-6 py-3 rounded-lg text-text-main text-sm font-bold border border-[#e6e0db] hover:bg-white transition-all shadow-sm disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar Rascunho'}
                        </button>
                        <button
                            onClick={() => handleSubmit('Publicado')}
                            disabled={loading}
                            className="px-8 py-3 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                        >
                            {loading ? 'Publicando...' : 'Publicar Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPostModal;
