import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://txbbyemgtitvltdvewzo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4YmJ5ZW1ndGl0dmx0ZHZld3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODk2MzQsImV4cCI6MjA4NTI2NTYzNH0.HSRFTW8PssND3T91VXywvSPgUPEc_VC7TbZwUAsuauk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Diagnosing Storage ---');

    // 1. List Buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('SERVER ERROR: Could not list buckets.', listError);
        return;
    }

    console.log('Available buckets:', buckets.map(b => `${b.name} (public: ${b.public})`));

    /*
    const targetBucket = buckets.find(b => b.name === 'fotos-pacientes');

    if (!targetBucket) {
        console.warn('WARNING: Bucket "fotos-pacientes" not found in list. It might exist but not be listable. Proceeding with upload test...');
    } else if (!targetBucket.public) {
        console.warn('WARNING: Bucket "fotos-pacientes" IS NOT PUBLIC. Images may not load via public URL.');
    }
    */
    console.log('Skipping list check (RLS might hide it). Proceeding with upload test...');

    // 2. Test Upload
    console.log('Attempting test upload...');
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const fileName = `diagnostic-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-pacientes')
        .upload(fileName, testFile);

    if (uploadError) {
        console.error('UPLOAD FAILED:', uploadError);
        console.log('Likely cause: Missing RLS policy for INSERT on storage.objects');
    } else {
        console.log('Upload successful!', uploadData);

        // Cleanup
        await supabase.storage.from('fotos-pacientes').remove([fileName]);
        console.log('Test file cleaned up.');
    }
}

diagnose();
