import React from 'react';
import { BlogPost } from '../types';
import { formatDate } from '../lib/dateUtils';

interface ViewPostModalProps {
    post: BlogPost;
    onClose: () => void;
    isAdminView?: boolean;
}

const ViewPostModal: React.FC<ViewPostModalProps> = ({ post, onClose, isAdminView = false }) => {
    const getWhatsAppLink = (postTitle: string) => {
        const message = encodeURIComponent(`Quero pra mim: ${postTitle}`);
        // Defaulting to a placeholder number if none is in context. 
        // This matches the one in PatientNews.tsx
        return `https://wa.me/5521999887766?text=${message}`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-fade-in print:hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-slide-up relative">
                
                {/* Close Button Floating */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
                    
                    {/* Hero Image Section */}
                    {post.image_url ? (
                        <div className="w-full aspect-square relative shrink-0 bg-gray-100">
                            <div 
                                className="absolute inset-0 bg-center bg-cover"
                                style={{ backgroundImage: `url("${post.image_url}")` }}
                            />
                            {/* Gradient Overlay for better contrast on tags */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                            
                            <div className="absolute bottom-6 left-6 flex gap-2">
                                <span className={`px-3 py-1 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-md ${post.status === 'Publicado' ? 'bg-green-500' : 'bg-amber-400'}`}>
                                    {isAdminView ? post.status : post.category || 'Novidade'}
                                </span>
                                {isAdminView && post.category && (
                                     <span className="px-3 py-1 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-md">
                                        {post.category}
                                     </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-32 md:h-48 bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-6xl text-primary/30">newspaper</span>
                        </div>
                    )}

                    {/* Content Section */}
                    <div className="p-6 md:p-10 flex flex-col gap-6">
                        <header>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main leading-tight">
                                {post.title}
                            </h2>
                            <div className="flex items-center gap-4 mt-4 text-sm text-[#7e756d]">
                                <div className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                    <span>{formatDate(post.created_at || new Date().toISOString())}</span>
                                </div>
                                {isAdminView && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[18px]">person</span>
                                        <span>Autor</span>
                                    </div>
                                )}
                            </div>
                        </header>

                        <div className="h-px bg-gray-100 w-full" />

                        {/* Article Body */}
                        <div 
                            className="prose prose-lg prose-headings:font-display prose-headings:text-text-main prose-p:text-text-muted prose-p:leading-relaxed prose-a:text-primary max-w-none whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: post.content || '' }}
                        />
                    </div>
                </div>

                {/* Footer Action Bar */}
                {!isAdminView && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
                         <a
                            href={getWhatsAppLink(post.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20 cursor-pointer w-full sm:w-auto justify-center"
                        >
                            <span>Quero pra Mim</span>
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewPostModal;
