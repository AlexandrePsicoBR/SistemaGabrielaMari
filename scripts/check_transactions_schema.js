import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransactionsSchema() {
    console.log('--- Checking Transactions Table Schema ---');

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching transactions:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No transactions found to infer schema, but table exists.');
        // If empty, I can't see columns easily without introspection, but I can assume standard from my previous plans or insert a dummy to check if needed.
        // Or I can try to use `rpc` if available, but simple select is safe first.
    }
}

checkTransactionsSchema();
