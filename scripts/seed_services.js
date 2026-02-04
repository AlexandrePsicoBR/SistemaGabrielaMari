import { createClient } from '@supabase/supabase-js';

// Configuration (Copied from check_history_schema.js)
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultServices = [
    { name: 'Botox Full Face', duration: 60, price: 1500, category: 'Injetáveis', active: true, description: 'Aplicação de toxina botulínica em 3 regiões.' },
    { name: 'Preenchimento Labial', duration: 60, price: 1200, category: 'Injetáveis', active: true, description: 'Preenchimento com 1ml de ácido hialurônico.' },
    { name: 'Bioestimulador de Colágeno', duration: 60, price: 2500, category: 'Injetáveis', active: true, description: 'Aplicação de bioestimulador.' },
    { name: 'Limpeza de Pele', duration: 90, price: 180, category: 'Facial', active: true, description: 'Limpeza profunda com extração.' },
    { name: 'Microagulhamento', duration: 60, price: 350, category: 'Facial', active: true, description: 'Indução percutânea de colágeno.' }
];

async function seedServices() {
    console.log('--- Seeding Services Table ---');

    // 1. Check if empty
    const { count, error } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error checking services:', error);
        return;
    }

    console.log(`Current service count: ${count}`);

    if (count === 0) {
        console.log('Table empty. Inserting default services...');
        const { data, error: insertError } = await supabase
            .from('services')
            .insert(defaultServices)
            .select();

        if (insertError) {
            console.error('Error inserting services:', insertError);
        } else {
            console.log('Services inserted successfully:', data.length);
        }
    } else {
        console.log('Services already exist. Skipping seed.');
    }
}

seedServices();
