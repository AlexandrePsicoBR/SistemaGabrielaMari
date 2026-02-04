import { createClient } from '@supabase/supabase-js';

// Hardcoded for script execution
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

const items = [
    { name: 'Botox 100u', category: 'Injetáveis', stock: 4, min_stock: 10, unit: 'CX', last_restock: '2023-10-01', cost: 1200 },
    { name: 'Algodão Hidrófilo', category: 'Consumíveis', stock: 50, min_stock: 20, unit: 'PCT', last_restock: '2023-09-15', cost: 15 },
    { name: 'Seringa 1ml', category: 'Descartáveis', stock: 150, min_stock: 50, unit: 'UN', last_restock: '2023-10-10', cost: 2 },
    { name: 'Ácido Hialurônico', category: 'Injetáveis', stock: 8, min_stock: 5, unit: 'CX', last_restock: '2023-10-05', cost: 900 },
];

async function seed() {
    console.log('Checking for existing inventory...');
    const { data: existing, error: fetchError } = await supabase.from('inventory').select('id').limit(1);

    if (fetchError) {
        console.error('Error checking inventory:', fetchError);
        return;
    }

    if (existing && existing.length > 0) {
        console.log('Inventory already exists. Skipping seed.');
        return;
    }

    console.log('Seeding ' + items.length + ' inventory items...');
    const { error } = await supabase.from('inventory').insert(items);

    if (error) {
        console.error('Error seeding inventory:', error);
    } else {
        console.log('Inventory seeded successfully!');
    }
}

seed();
