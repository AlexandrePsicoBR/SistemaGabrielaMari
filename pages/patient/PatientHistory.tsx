import React, { useEffect, useState } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { getSignedPhotoUrl } from '../../lib/imageUtils';
import { supabase } from '../../lib/supabase';
import { profileService } from '../../lib/profile';
import PhotoViewerModal from '../../components/PhotoViewerModal';

interface PhotoEntry {
    id: string;
    title: string;
    description: string;
    before_url: string; // These are coming from likely a raw select, but formatted later?
    // Wait, the interface in PatientHistory uses snake_case, but PhotoViewerModal uses camelCase (PhotoEntry from NewPhotoModal).
    // I need to check type compatibility.
    // PatientHistory.tsx:
    // interface PhotoEntry { id, title, description, before_url, after_url, date }
    // PhotoViewerModal.tsx:
    // import { PhotoEntry } from './NewPhotoModal';
    // export interface PhotoEntry { id, title, description, beforeUrl, afterUrl, date }
    // THEY ARE DIFFERENT.
    // I need to map them when passing to the modal.
    after_url: string;
    date: string;
}

const PatientHistory: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState<PhotoEntry[]>([]);
    const [sliderValue, setSliderValue] = useState(50);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null); // Use any or map it properly

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const profile = await profileService.getPatientProfile(user.id, user.email);
                if (!profile) return;

                const { data, error } = await supabase
                    .from('patient_photos')
                    .select('*')
                    .eq('patient_id', profile.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const photosWithUrls = await Promise.all(
                        data.map(async (photo) => ({
                            ...photo,
                            before_url: await getSignedPhotoUrl(photo.before_url) || '',
                            after_url: await getSignedPhotoUrl(photo.after_url) || ''
                        }))
                    );
                    setPhotos(photosWithUrls);
                }
            } catch (error) {
                console.error('Error fetching photos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPhotos();
    }, []);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(Number(e.target.value));
    };

    const latestPhoto = photos.length > 0 ? photos[0] : null;
    const previousPhotos = photos.length > 1 ? photos.slice(1) : [];

    if (loading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto h-full p-6 lg:p-12 animate-fade-in font-sans">
            <div className="max-w-6xl mx-auto flex flex-col gap-10">
                {/* Header Section */}
                <header className="flex flex-col gap-2">
                    <h2 className="font-display text-5xl text-text-main font-medium leading-tight">Meu Histórico de Transformações</h2>
                    <p className="text-text-muted text-lg max-w-2xl">Acompanhe a evolução dos seus tratamentos com segurança, privacidade e precisão visual.</p>
                </header>

                {/* Featured Comparison */}
                <section>
                    {latestPhoto ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-primary"></span>
                                    {latestPhoto.title} - {formatDate(new Date(latestPhoto.date), { month: 'long', year: 'numeric' })}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                                {/* Before Image */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="px-4 py-1.5 bg-black/5 rounded-full border border-black/5 inline-flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Antes</span>
                                        </div>
                                    </div>
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 border border-[#eceae8] shadow-lg group">
                                        <div
                                            className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                                            style={{ backgroundImage: `url('${latestPhoto.before_url}')` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* After Image */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/10 inline-flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                                            <span className="text-xs font-bold text-primary uppercase tracking-widest">Depois</span>
                                        </div>
                                    </div>
                                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-900 border border-[#eceae8] shadow-lg group">
                                        <div
                                            className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                                            style={{ backgroundImage: `url('${latestPhoto.after_url}')` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-text-muted text-sm italic">
                                    Compare os resultados lado a lado.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl p-10 text-center border border-[#eceae8] shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-text-muted mb-4">image_not_supported</span>
                            <h3 className="text-xl font-bold text-text-main mb-2">Nenhuma foto encontrada</h3>
                            <p className="text-text-muted">Ainda não há registros fotográficos do seu tratamento.</p>
                        </div>
                    )}
                </section>

                {/* Grid View: Historical Records */}
                {previousPhotos.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center gap-4 mb-8">
                            <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">Registros Anteriores</h4>
                            <div className="flex-1 h-[1px] bg-[#e3e0de]"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {previousPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group cursor-pointer"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <div className="flex gap-2 mb-4 h-48">
                                        <div className="flex-1 rounded-lg overflow-hidden border border-[#e3e0de] bg-gray-900 transition-transform group-hover:scale-[1.02]">
                                            <div className="w-full h-full bg-center bg-contain bg-no-repeat" style={{ backgroundImage: `url('${photo.before_url}')` }}></div>
                                        </div>
                                        <div className="flex-1 rounded-lg overflow-hidden border border-[#e3e0de] bg-gray-900 transition-transform group-hover:scale-[1.02]">
                                            <div className="w-full h-full bg-center bg-contain bg-no-repeat" style={{ backgroundImage: `url('${photo.after_url}')` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h5 className="text-text-main font-bold text-base group-hover:text-primary transition-colors">{photo.title}</h5>
                                            <p className="text-text-muted text-sm italic">{formatDate(new Date(photo.date), { month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer Privacy Disclaimer */}
                <footer className="mt-auto py-10 border-t border-[#e3e0de] text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined text-lg">shield_lock</span>
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">Ambiente Seguro & Criptografado</span>
                        </div>
                        <p className="text-text-muted text-xs max-w-lg leading-relaxed">
                            Este histórico é de uso exclusivo do paciente e da equipe clínica. Seguimos rigorosamente as diretrizes da LGPD para garantir que sua privacidade seja preservada. Suas fotos nunca são compartilhadas sem autorização formal prévia.
                        </p>
                    </div>
                </footer>
                {selectedPhoto && (
                    <PhotoViewerModal
                        photo={{
                            ...selectedPhoto,
                            beforeUrl: selectedPhoto.before_url,
                            afterUrl: selectedPhoto.after_url
                        }}
                        onClose={() => setSelectedPhoto(null)}
                        readOnly={true}
                        onUpdate={() => { }}
                        onDelete={() => { }}
                    />
                )}
            </div>
        </div>
    );
};

export default PatientHistory;
