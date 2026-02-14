import React, { useRef, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SignatureModalProps {
    document: { id: string; title: string };
    onClose: () => void;
    onComplete: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ document, onClose, onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                const rect = parent.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;

                // Re-apply context settings after resize
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.strokeStyle = '#000000';
                }
            }
        };

        // Initial setup
        handleResize();
        window.addEventListener('resize', handleResize);

        // Safety timeout to ensure layout is stable
        setTimeout(handleResize, 100);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate exact coordinates relative to canvas
        // This handles cases where canvas display size matches internal size (set in handleResize)
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        setHasSignature(true);

        const { x, y } = getPoint(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getPoint(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.beginPath(); // Reset path
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = async () => {
        if (!hasSignature) return;
        setSaving(true);
        console.log('Starting save process...');

        try {
            const canvas = canvasRef.current;
            if (!canvas) throw new Error('Canvas not found');

            // 1. Convert to Blob
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Failed to create signature blob');

            // 2. Upload to Supabase Storage
            // Using 'fotos-pacientes' as 'documents' bucket was not found.
            const bucketName = 'fotos-pacientes';
            const fileName = `signatures/${document.id}_${Date.now()}.png`;
            console.log('Uploading to:', bucketName, fileName);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(fileName, blob, { upsert: true });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw new Error(`Upload falhou: ${uploadError.message}`);
            }

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(fileName);

            console.log('Public URL:', publicUrl);

            // 4. Update Database
            const { error: dbError } = await supabase
                .from('patient_documents')
                .update({
                    status: 'signed',
                    signed_at: new Date().toISOString(),
                    signature_url: publicUrl
                })
                .eq('id', document.id);

            if (dbError) {
                console.error('DB Update Error:', dbError);
                throw new Error(`Atualização do banco falhou: ${dbError.message}`);
            }

            onComplete();

        } catch (error: any) {
            console.error('Error saving signature:', error);
            alert(`Erro ao salvar assinatura: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-lg text-text-main">Assinar Documento</h3>
                        <p className="text-xs text-text-muted">{document.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-text-muted transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#f9fafb]">
                    <div className="w-full aspect-[3/2] bg-white border-2 border-dashed border-gray-300 rounded-xl relative overflow-hidden shadow-inner touch-none">
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        {!hasSignature && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 select-none">
                                <span className="text-sm">Desenhe sua assinatura aqui</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-2 text-xs text-text-muted text-center">
                        Use o mouse ou o dedo para assinar no espaço acima.
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-between gap-4 bg-white">
                    <button
                        onClick={clearCanvas}
                        className="px-4 py-2 text-text-muted hover:text-red-500 font-medium text-sm transition-colors flex items-center gap-2"
                        disabled={saving}
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Limpar
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasSignature || saving}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold text-sm shadow-md shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">check</span>
                                    Confirmar Assinatura
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
