import { createClient } from '@supabase/supabase-js';

// Hardcoded for script execution
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

const services = [
    { name: 'Botox Full Face', category: 'Injetáveis', price: 2500, duration: 60, description: 'Aplicação de toxina botulínica em 3 regiões: testa, glabela e pés de galinha.', active: true },
    { name: 'Preenchimento Labial', category: 'Injetáveis', price: 1800, duration: 45, description: 'Harmonização e volume labial com ácido hialurônico (1ml).', active: true },
    { name: 'Limpeza de Pele Profunda', category: 'Facial', price: 250, duration: 90, description: 'Higienização completa com extração, alta frequência e máscara calmante.', active: true },
    { name: 'Laser Lavieen', category: 'Laser', price: 800, duration: 30, description: 'Tratamento a laser para manchas, poros e textura da pele (BB Laser).', active: true },
    { name: 'Bioestimulador de Colágeno', category: 'Injetáveis', price: 3000, duration: 60, description: 'Aplicação de Sculptra ou Radiesse para flacidez.', active: true },
    { name: 'Peeling Químico', category: 'Facial', price: 450, duration: 30, description: 'Renovação celular com ácidos específicos para cada tipo de pele.', active: true },
];

async function seed() {
    console.log('Checking for existing services...');
    const { data: existing, error: fetchError } = await supabase.from('services').select('count', { count: 'exact' });

    if (fetchError) {
        console.error('Error checking services:', fetchError);
        return;
    }

    if (existing && existing.length > 0) { // Actually count is in count property if using {head: true} or similar, but with select count it returns array
        // Let's use simple logic: if any data exists, don't seed.
        const { data } = await supabase.from('services').select('id').limit(1);
        if (data && data.length > 0) {
            console.log('Services already exist. Skipping seed.');
            return;
        }
    }

    console.log('Seeding ' + services.length + ' services...');
    const { error } = await supabase.from('services').insert(services);

    if (error) {
        console.error('Error seeding services:', error);
    } else {
        console.log('Services seeded successfully!');
    }
}

seed();
