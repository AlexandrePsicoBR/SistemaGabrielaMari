import React from 'react';

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onClose, onComplete }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-fade-in">
            <div className="relative w-full max-w-[560px] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#c3a383]/10">
                {/* Close Button (Top Right) */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-[#7e756d] hover:text-[#c3a383] transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Decorative Top Border */}
                <div className="h-1.5 w-full bg-[#c3a383]"></div>

                <div className="p-8 md:p-12 flex flex-col items-center text-center">
                    {/* Icon/Branding */}
                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#c3a383]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#c3a383] text-3xl">account_circle</span>
                        </div>
                    </div>

                    {/* Header Section */}
                    <h4 className="text-[#c3a383] text-xs font-bold tracking-[0.2em] uppercase mb-3 font-serif">Bem-vinda</h4>
                    <h1 className="text-[#161413] text-3xl md:text-4xl font-bold leading-tight mb-6 font-serif">
                        Complete Seu Cadastro
                    </h1>

                    {/* Body Text */}
                    <div className="max-w-[400px]">
                        <p className="text-[#7e756d] text-base md:text-lg leading-relaxed mb-10 font-sans">
                            Complete seu cadastro para participar de promoções, ver sua evolução de procedimentos, galeria de fotos e tudo que a Gabriela pode te oferecer.
                        </p>
                    </div>

                    {/* Action Section */}
                    <div className="w-full flex flex-col gap-4">
                        <button
                            onClick={onComplete}
                            className="w-full h-14 bg-[#c3a383] hover:bg-[#b29272] text-white rounded-lg font-bold text-base tracking-wide transition-all shadow-lg shadow-[#c3a383]/20 flex items-center justify-center gap-2"
                        >
                            <span>Completar Cadastro</span>
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full h-12 bg-transparent text-[#7e756d] hover:text-[#c3a383] font-medium text-sm transition-colors"
                        >
                            Lembrar-me mais tarde
                        </button>
                    </div>

                    {/* Footer Visual Decoration */}
                    <div className="mt-12 flex items-center gap-2 opacity-30">
                        <div className="h-[1px] w-8 bg-[#7e756d]"></div>
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        <div className="h-[1px] w-8 bg-[#7e756d]"></div>
                    </div>
                </div>

                {/* Side Graphic Element */}
                <div className="hidden lg:block absolute -left-20 -bottom-20 w-40 h-40 bg-[#c3a383]/5 rounded-full blur-3xl"></div>
                <div className="hidden lg:block absolute -right-10 -top-10 w-32 h-32 bg-[#c3a383]/10 rounded-full blur-2xl"></div>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;
