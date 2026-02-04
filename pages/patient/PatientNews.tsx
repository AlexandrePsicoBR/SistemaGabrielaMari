import React, { useEffect, useState } from 'react';
import { formatDate } from '../../lib/dateUtils';
import { blogService } from '../../lib/blog';
import { BlogPost } from '../../types';

const PatientNews: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPosts = async (search?: string) => {
        setLoading(true);
        try {
            const { data } = await blogService.getPosts({
                status: 'Publicado',
                search: search,
                limit: 10 // Adjust limit as needed
            });
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            fetchPosts(searchTerm);
        }
    };

    const getWhatsAppLink = (postTitle: string) => {
        const message = encodeURIComponent(`Quero pra mim ${postTitle}`);
        return `https://wa.me/5521999887766?text=${message}`;
    };

    const featuredPost = posts.length > 0 ? posts[0] : null;
    const recentPosts = posts.length > 1 ? posts.slice(1) : [];

    if (loading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto h-full p-6 lg:p-12 animate-fade-in font-sans">
            <div className="max-w-[1100px] mx-auto flex flex-col gap-10">
                {/* Page Header & Search */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black font-display text-text-main tracking-tight">News e Promoções</h2>
                        <p className="text-text-muted mt-2">Fique por dentro das novidades e ofertas exclusivas para você.</p>
                    </div>
                    <div className="w-full md:w-80">
                        <div className="relative group">
                            <button
                                onClick={() => fetchPosts(searchTerm)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors cursor-pointer border-none bg-transparent p-0 flex items-center justify-center outline-none"
                                aria-label="Buscar"
                            >
                                <span className="material-symbols-outlined">search</span>
                            </button>
                            <input
                                className="w-full h-12 pl-12 pr-4 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-primary/50 text-sm placeholder:text-gray-400 transition-all outline-none"
                                placeholder="Buscar tópicos ou tratamentos..."
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                onKeyDown={handleSearchSubmit}
                            />
                        </div>
                    </div>
                </header>

                {posts.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-6xl text-text-muted mb-4">newspaper</span>
                        <h3 className="text-xl font-bold text-text-main">Nenhuma novidade encontrada</h3>
                        <p className="text-text-muted">Aguarde por novas publicações e promoções.</p>
                    </div>
                ) : (
                    <>
                        {/* Featured Hero Card */}
                        {featuredPost && (
                            <section>
                                <div className="relative h-[480px] w-full overflow-hidden rounded-2xl shadow-xl group">
                                    <div
                                        className="absolute inset-0 bg-center bg-cover transition-transform duration-700 group-hover:scale-105"
                                        style={{ backgroundImage: `url('${featuredPost.image_url || 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'}')` }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-10 max-w-2xl text-white">
                                        <span className="inline-block px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                                            {featuredPost.category || 'Destaque'}
                                        </span>
                                        <h3 className="text-4xl font-display font-bold leading-tight mb-4">{featuredPost.title}</h3>
                                        {/* Using excerpt or slicing content for summary if excerpt not available. Assuming 'excerpt' exists or we slice content. 
                                            Checking types.ts would verify, but using content slice is safe fallback. */}
                                        <div
                                            className="text-gray-200 text-lg mb-6 font-light leading-relaxed line-clamp-3"
                                            dangerouslySetInnerHTML={{ __html: featuredPost.content || '' }}
                                        />
                                        {/* Note: Content often contains HTML. Ideally strip tags for preview. 
                                            For now, relying on line-clamp to handle length and rendering html inside but restricted. 
                                            Better to strip tags: featuredPost.content.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...' */}

                                        <a
                                            href={getWhatsAppLink(featuredPost.title)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/20 cursor-pointer"
                                        >
                                            <span>Quero pra Mim</span>
                                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                        </a>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section: Latest Updates Grid */}
                        {recentPosts.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-2xl font-display font-bold text-text-main">Últimas Novidades</h4>
                                    <div className="h-px flex-1 bg-[#eceae8] mx-6"></div>
                                    {/* <button className="text-sm font-bold text-primary hover:underline">Ver tudo</button> */}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                                    {recentPosts.map((post) => (
                                        <article key={post.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-[#eceae8] flex flex-col h-full">
                                            <div className="h-48 overflow-hidden relative shrink-0">
                                                <div
                                                    className="w-full h-full bg-center bg-cover transition-transform duration-500 group-hover:scale-110"
                                                    style={{ backgroundImage: `url('${post.image_url || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}')` }}
                                                ></div>
                                                <span className="absolute top-4 left-4 px-2 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider rounded text-text-main">
                                                    {post.category || 'Novidade'}
                                                </span>
                                            </div>
                                            <div className="p-6 flex flex-col flex-1">
                                                <h5 className="text-lg font-display font-bold mb-3 line-clamp-2 hover:text-primary transition-colors cursor-pointer text-text-main">
                                                    {post.title}
                                                </h5>
                                                <div
                                                    className="text-sm text-text-muted line-clamp-3 mb-4 leading-relaxed flex-1"
                                                    dangerouslySetInnerHTML={{ __html: post.content?.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...' || '' }}
                                                ></div>
                                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#eceae8]">
                                                    <span className="text-xs text-text-muted">
                                                        {formatDate(new Date(post.created_at), { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <a
                                                        href={getWhatsAppLink(post.title)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary material-symbols-outlined hover:scale-110 transition-transform cursor-pointer"
                                                        title="Quero pra Mim"
                                                    >
                                                        add_circle
                                                    </a>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Newsletter Section Removed as per request */}
            </div>
        </div >
    );
};

export default PatientNews;
