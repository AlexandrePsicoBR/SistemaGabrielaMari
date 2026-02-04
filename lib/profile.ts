import { supabase } from './supabase';
import { AdminData } from '../types';

export const profileService = {
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') { // PGRST116 is "Row not found" (0 rows)
                console.warn('Error fetching profile:', error);
            }
            return null;
        }
        return data;
    },

    async updateProfile(userId: string, data: AdminData) {
        // Check if profile exists
        const existing = await this.getProfile(userId);

        const updateData = {
            id: userId,
            full_name: data.name,
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            registration_number: data.registration,
            avatar_url: data.avatar,
            updated_at: new Date().toISOString()
        };

        if (existing) {
            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', userId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('profiles')
                .insert(updateData);
            if (error) throw error;
        }
    },

    async getPatientProfile(userId: string, email?: string) {
        let { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            // Check if we can link by email
            if (email) {
                console.log('Profile not found by ID. Attempting to link by email:', email);
                const { data: linkSuccess, error: linkError } = await supabase
                    .rpc('link_patient_account', { user_email: email, user_id: userId });

                if (linkSuccess) {
                    // Retry fetch
                    const retry = await supabase
                        .from('patients')
                        .select('*')
                        .eq('id', userId)
                        .single();
                    data = retry.data;
                    error = retry.error;
                } else if (linkError) {
                    console.warn('Error linking account:', linkError);
                }
            }
        }

        if (error) {
            // still error
            console.warn('Error fetching patient profile:', error);
            return null;
        }

        return data;
    },

    async updatePatientProfile(userId: string, data: any) {
        // Check if patient record exists
        const existing = await this.getPatientProfile(userId);

        const updateData: any = {
            name: data.full_name,
            birth_date: data.birthdate || null,
            cpf: data.cpf,
            phone: data.phone,
            email: data.email,
            zip_code: data.address_zip,
            street: data.address_street,
            city: data.address_city,
            state: data.address_state,
            marketing_pref_whatsapp: data.pref_whatsapp,
            marketing_pref_email: data.pref_email,
            avatar_url: data.avatar_url
        };

        if (existing) {
            const { error } = await supabase
                .from('patients')
                .update(updateData)
                .eq('id', userId);
            if (error) throw error;
        } else {
            // New record - Include mandatory fields and defaults
            const insertData = {
                ...updateData,
                id: userId,
                status: 'Novo',
                source: 'App/Site',
                created_at: new Date().toISOString()
            };
            const { error } = await supabase
                .from('patients')
                .insert(insertData);
            if (error) throw error;
        }
    },

    async uploadAvatar(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async createPatientRecord(userId: string, name: string, email: string) {
        const { error } = await supabase
            .from('patients')
            .insert([{
                id: userId,
                name: name,
                email: email,
                status: 'Novo', // Force status to 'Novo'
                source: 'App/Site',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error creating patient record:', error);
            // Optionally throw error if you want to block signup success, 
            // but usually we might just want to log it or handle it gracefully.
            // For now, let's throw so the UI knows something went wrong.
            throw error;
        }
    }
};
