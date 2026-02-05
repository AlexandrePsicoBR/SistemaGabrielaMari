
import { supabase } from './supabase';
import { DBAppointment } from '../types';

interface CreateAppointmentParams {
    patientName: string;
    patientPhone?: string;
    patientId?: string; // Added patientId
    procedure: string;
    startsAt: Date;
    endsAt: Date;
    notes?: string;
}

export const scheduleService = {
    // ... listEvents and listCalendars remain unchanged

    async listEvents(start: Date, end: Date) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let providerToken = session?.provider_token;
            if (!providerToken) providerToken = localStorage.getItem('google_provider_token');

            if (!providerToken) throw new Error('Token Google não encontrado.');

            // 1. Find Calendar ID
            const calendars = await this.listCalendars();
            const target = calendars.items?.find((c: any) => c.summary === 'ATENDIMENTOS GABI');
            const calendarId = target ? target.id : 'primary';

            // 2. Fetch Events
            const params = new URLSearchParams({
                timeMin: start.toISOString(),
                timeMax: end.toISOString(),
                singleEvents: 'true',
                orderBy: 'startTime'
            });

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`, {
                headers: { 'Authorization': `Bearer ${providerToken}` }
            });

            if (!response.ok) throw new Error('Erro ao buscar eventos do Google.');

            return await response.json();
        } catch (error) {
            console.error('List Events Error:', error);
            throw error;
        }
    },

    async listCalendars() {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            let providerToken = session?.provider_token;
            if (!providerToken) {
                providerToken = localStorage.getItem('google_provider_token') || null;
            }

            if (!providerToken) {
                throw new Error('Sem token de provedor (Google). Faça login novamente.');
            }
            const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: { 'Authorization': `Bearer ${providerToken}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Google API Error: ${err.error?.message}`);
            }
            return await response.json();
        } catch (error) {
            console.error('List Calendars Error:', error);
            throw error;
        }
    },

    async createAppointment({ patientName, patientPhone, patientId, procedure, startsAt, endsAt, notes }: CreateAppointmentParams) {
        try {
            // 1. Get Session & Provider Token
            const { data: { session } } = await supabase.auth.getSession();

            // Try to get token from Session OR LocalStorage workaround
            let providerToken = session?.provider_token;
            if (!providerToken) {
                providerToken = localStorage.getItem('google_provider_token');
            }

            if (!providerToken) {
                throw new Error('Token do Google não encontrado. Tente fazer Logout e Login novamente com o botão "Conectar Google Calendar".');
            }

            // 2. Find "ATENDIMENTOS GABI" Calendar ID
            const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: { 'Authorization': `Bearer ${providerToken}` }
            });

            if (!calendarsResponse.ok) throw new Error('Erro ao listar calendários');
            const calendarsData = await calendarsResponse.json();
            const targetCalendar = calendarsData.items?.find((cal: any) => cal.summary === 'ATENDIMENTOS GABI');

            if (!targetCalendar) {
                throw new Error('Calendário "ATENDIMENTOS GABI" não encontrado na conta do Google.');
            }

            // 3. Create Google Event
            // Title: Patient - Procedure
            // Desc: Notes
            const eventBody = {
                summary: `${patientName} - ${procedure}`,
                description: `${notes || ''}\n\nTelefone: ${patientPhone || 'N/A'}`,
                start: { dateTime: startsAt.toISOString() },
                end: { dateTime: endsAt.toISOString() },
            };

            const createEventResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${targetCalendar.id}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${providerToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventBody),
            });

            if (!createEventResponse.ok) {
                const err = await createEventResponse.json();
                throw new Error(`Erro ao criar evento no Google: ${err.error?.message}`);
            }

            const eventData = await createEventResponse.json();
            const googleEventId = eventData.id;

            // 4. Save to Supabase
            const { data: appointment, error: dbError } = await supabase
                .from('appointments')
                .insert({
                    starts_at: startsAt.toISOString(),
                    ends_at: endsAt.toISOString(),
                    guest_name: patientName,
                    guest_phone: patientPhone,
                    patient_id: patientId || null, // Added patient_id
                    description: `Procedimento: ${procedure}\n${notes}`, // Keep internal desc for fallback
                    google_event_id: googleEventId,
                })
                .select()
                .single();

            if (dbError) {
                console.error('Erro ao salvar no banco (mas evento foi criado no Google):', dbError);
                // Non-blocking error for User perception if Google worked?
                // throw new Error('Evento criado no Google, mas falhou ao salvar no sistema.');
            }

            return appointment;

        } catch (error) {
            console.error('Schedule Service Error:', error);
            throw error;
        }
    },

    async deleteEvent(googleEventId: string) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let providerToken = session?.provider_token || localStorage.getItem('google_provider_token');
            if (!providerToken) throw new Error('Token Google não encontrado.');

            // 1. Identify Calendar
            const calendars = await this.listCalendars();
            const target = calendars.items?.find((c: any) => c.summary === 'ATENDIMENTOS GABI');
            const calendarId = target ? target.id : 'primary';

            // 2. Delete from Google
            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${providerToken}` }
            });

            if (!response.ok) {
                // If 410 (Gone) or 404, it's already deleted regarding Google, so proceed to DB
                if (response.status !== 410 && response.status !== 404) {
                    const err = await response.json();
                    throw new Error(`Erro ao excluir do Google: ${err.error?.message}`);
                }
            }

            // 3. Delete from Supabase
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('google_event_id', googleEventId);

            if (error) throw error;

        } catch (error) {
            console.error('Delete Event Error:', error);
            throw error;
        }
    },

    async updateEvent(googleEventId: string, startsAt: Date, endsAt: Date) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let providerToken = session?.provider_token || localStorage.getItem('google_provider_token');
            if (!providerToken) throw new Error('Token Google não encontrado.');

            // 1. Identify Calendar
            const calendars = await this.listCalendars();
            const target = calendars.items?.find((c: any) => c.summary === 'ATENDIMENTOS GABI');
            const calendarId = target ? target.id : 'primary';

            // 2. Update Google
            const eventBody = {
                start: { dateTime: startsAt.toISOString() },
                end: { dateTime: endsAt.toISOString() },
            };

            const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${providerToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventBody)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Erro ao atualizar Google: ${err.error?.message}`);
            }

            // 3. Update Supabase
            const { error } = await supabase
                .from('appointments')
                .update({
                    starts_at: startsAt.toISOString(),
                    ends_at: endsAt.toISOString()
                })
                .eq('google_event_id', googleEventId);

            if (error) throw error;

        } catch (error) {
            console.error('Update Event Error:', error);
            throw error;
        }
    }
};
