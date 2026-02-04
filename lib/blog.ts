import { supabase } from './supabase';
import { BlogPost } from '../types';

export const blogService = {
    async getPosts(params: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        status?: string;
    }) {
        const { page = 1, limit = 8, search, category, status } = params;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('blog_posts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (search) {
            query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        }

        if (category && category !== 'Tudo') {
            query = query.eq('category', category);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
            throw error;
        }

        return { data: data as BlogPost[], count };
    },

    async createPost(post: Omit<BlogPost, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('blog_posts')
            .insert(post)
            .select()
            .single();

        if (error) {
            console.error('Error creating post:', error);
            throw error;
        }

        return data as BlogPost;
    },

    async updatePost(id: string, updates: Partial<BlogPost>) {
        const { data, error } = await supabase
            .from('blog_posts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating post:', error);
            throw error;
        }

        return data as BlogPost;
    },

    async deletePost(id: string) {
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    },

    async uploadImage(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath);
        return data.publicUrl;
    }
};
