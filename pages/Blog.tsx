import React, { useState, useEffect } from 'react';
import { formatDate } from '../lib/dateUtils';
import NewPostModal from '../components/NewPostModal';
import { blogService } from '../lib/blog';
import { BlogPost } from '../types';

const Blog: React.FC = () => {
    const [showNewPostModal, setShowNewPostModal] = useState(false);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [editingPost, setEditingPost] = useState<BlogPost | undefined>(undefined);

    const limit = 8; // User request: 8 posts per page

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, count } = await blogService.getPosts({
                page,
                limit,
                search,
                category,
                status
            });
            setPosts(data);
            if (count !== null) {
                setTotalPages(Math.ceil(count / limit));
            }
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [page, search, category, status]);

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setShowNewPostModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este post?')) {
            try {
                await blogService.deletePost(id);
                fetchPosts();
            } catch (error) {
                alert('Erro ao excluir post');
            }
        }
    };

    const handleNewPostSaved = () => {
        fetchPosts();
        setShowNewPostModal(false);
        setEditingPost(undefined);
    };

    // Calculate pagination handlers
    const canPrevious = page > 1;
    const canNext = page < totalPages;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFBF9] animate-fade-in font-sans">
            {/* Header Section */}
            <header className="flex flex-col px-8 pt-8 pb-4 gap-6 bg-[#FDFBF9]/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#eceae8]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-text-main text-4xl font-display font-medium leading-tight">Novidades e Promoções</h2>
                        <p className="text-[#7e756d] text-sm mt-1">Tudo de Novo! Você Mais Linda!</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingPost(undefined);
                            setShowNewPostModal(true);
                        }}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        <span>Novo Post</span>
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[300px]">
                        <label className="flex items-center bg-white border border-[#eceae8] rounded-xl px-4 py-3 focus-within:border-primary transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[#7e756d]">search</span>
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-[#7e756d] ml-2 outline-none"
                                placeholder="Pesquisar posts, categorias ou autores..."
                                type="text"
                            />
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                                className="appearance-none flex items-center gap-2 px-4 py-3 bg-white border border-[#eceae8] rounded-xl text-sm font-medium text-text-main hover:border-primary transition-all shadow-sm pr-10 cursor-pointer outline-none"
                            >
                                <option value="">Todas Categorias</option>
                                <option value="Promoção">Promoção</option>
                                <option value="Skincare">Skincare</option>
                                <option value="Procedimentos">Procedimentos</option>
                                <option value="Dicas">Dicas</option>
                                <option value="Estética">Estética</option>
                            </select>
                            <span className="material-symbols-outlined text-sm absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
                        </div>

                        <div className="relative">
                            <select
                                value={status}
                                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                className="appearance-none flex items-center gap-2 px-4 py-3 bg-white border border-[#eceae8] rounded-xl text-sm font-medium text-text-main hover:border-primary transition-all shadow-sm pr-10 cursor-pointer outline-none"
                            >
                                <option value="">Todos Status</option>
                                <option value="Publicado">Publicado</option>
                                <option value="Rascunho">Rascunho</option>
                            </select>
                            <span className="material-symbols-outlined text-sm absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Chips Section */}
                <div className="flex gap-2 flex-wrap pb-2">
                    <button onClick={() => { setCategory(''); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-sm ${category === '' ? 'bg-primary/10 text-primary border-primary/20 font-bold' : 'bg-white border-[#eceae8] text-[#7e756d] hover:bg-primary/5 hover:text-primary'}`}>
                        Tudo
                    </button>
                    <button onClick={() => { setCategory('Promoção'); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-sm ${category === 'Promoção' ? 'bg-primary/10 text-primary border-primary/20 font-bold' : 'bg-white border-[#eceae8] text-[#7e756d] hover:bg-primary/5 hover:text-primary'}`}>
                        Promoção
                    </button>
                    <button onClick={() => { setCategory('Skincare'); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-sm ${category === 'Skincare' ? 'bg-primary/10 text-primary border-primary/20 font-bold' : 'bg-white border-[#eceae8] text-[#7e756d] hover:bg-primary/5 hover:text-primary'}`}>
                        Skincare
                    </button>
                    <button onClick={() => { setCategory('Procedimentos'); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-sm ${category === 'Procedimentos' ? 'bg-primary/10 text-primary border-primary/20 font-bold' : 'bg-white border-[#eceae8] text-[#7e756d] hover:bg-primary/5 hover:text-primary'}`}>
                        Procedimentos
                    </button>
                    <button onClick={() => { setCategory('Dicas'); setPage(1); }} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors shadow-sm ${category === 'Dicas' ? 'bg-primary/10 text-primary border-primary/20 font-bold' : 'bg-white border-[#eceae8] text-[#7e756d] hover:bg-primary/5 hover:text-primary'}`}>
                        Dicas
                    </button>
                </div>
            </header>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-primary animate-pulse">Carregando...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-10">
                        {posts.map((post) => (
                            <div key={post.id} className="group bg-white rounded-2xl overflow-hidden border border-[#eceae8] hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col">
                                <div className="relative overflow-hidden aspect-[16/10]">
                                    <div
                                        className="absolute inset-0 bg-center bg-no-repeat bg-cover group-hover:scale-105 transition-transform duration-500"
                                        style={{ backgroundImage: `url("${post.image_url || 'https://via.placeholder.com/400x250?text=Sem+Imagem'}")` }}
                                    ></div>
                                    <div className="absolute top-4 left-4">
                                        <span className={`${post.status === 'Publicado' ? 'bg-green-500' : 'bg-amber-400'} text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm`}>
                                            {post.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col gap-3 flex-1">
                                    <span className="text-primary text-[10px] font-bold uppercase tracking-widest">{post.category}</span>
                                    <h3 className="font-display text-xl font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-[#7e756d] text-sm line-clamp-3 mb-auto">
                                        {post.content}
                                    </p>
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f3f2f1]">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm text-[#7e756d]">event</span>
                                            <span className="text-[#7e756d] text-xs">
                                                {formatDate(new Date(post.created_at || ''))}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(post)}
                                                className="p-2 text-[#7e756d] hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit_note</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 text-[#7e756d] hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {!loading && posts.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                <span className="material-symbols-outlined text-4xl text-[#eceae8] mb-4">article</span>
                                <h3 className="text-xl font-medium text-text-main">Nenhum post encontrado</h3>
                                <p className="text-[#7e756d] mt-2">Tente ajustar seus filtros ou crie um novo post.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 mb-8 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={!canPrevious}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#eceae8] text-[#7e756d] hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${page === p
                                    ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20 border-primary'
                                    : 'border-[#eceae8] text-[#7e756d] hover:bg-primary/5'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={!canNext}
                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#eceae8] text-[#7e756d] hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            {showNewPostModal && (
                <NewPostModal
                    onClose={() => {
                        setShowNewPostModal(false);
                        setEditingPost(undefined);
                    }}
                    onSave={handleNewPostSaved}
                    initialData={editingPost}
                />
            )}
        </div>
    );
};

export default Blog;
