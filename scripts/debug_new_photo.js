import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNewPhoto() {
    console.log('--- Debugging New Photo Signed URL ---');

    // The exact path seen in DB check
    const fileName = '1769706862365-before-IMG20250108WA0139.jpg';

    // 1. Try Create Signed URL
    const { data: signedData, error: signedError } = await supabase.storage
        .from('fotos-pacientes')
        .createSignedUrl(fileName, 3600);

    if (signedError) {
        console.error('Error creating signed URL:', signedError);
    } else {
        console.log('Signed URL generated successfully:');
        console.log(signedData.signedUrl);
    }

    // 2. Try List Files to see if it's actually there (sanity check)
    const { data: listData, error: listError } = await supabase.storage
        .from('fotos-pacientes')
        .list();

    if (listError) console.error('List error:', listError);
    else {
        const found = listData.find(f => f.name === fileName);
        console.log('File found in list:', found ? 'YES' : 'NO');
    }
}

debugNewPhoto();
