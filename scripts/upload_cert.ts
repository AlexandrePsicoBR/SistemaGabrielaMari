import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Note: Anon key might not have permission to write to 'secure-files' if RLS is strict.
// Ideally we need SERVICE_ROLE key for admin scripts, but let's try with what we have.
// If it fails, I'll ask user for service key or try to login as admin?
// Actually I can just check if I have the service key in env? likely not.
// Wait, the user said "admin signature". The app uses Anon key.
// The policy I created: "Allow admin select" for SELECT.
// INSERT policy? I didn't create one yet.
// I should create an INSERT policy for authenticated users (admin) or just make it public for insert for a moment? No.
// Let's create an INSERT policy for the bucket too.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function upload() {
    const filePath = path.resolve('c:/Sistema Gabriela/Certificado Gabriela/Certificado Gabriela COREN.pfx');

    if (!fs.existsSync(filePath)) {
        console.error('Certificate file not found at:', filePath);
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);

    // We need to sign in as an admin to pass the RLS if we enforced it on INSERT.
    // Or we just temporarily allow INSERT for anon?
    // Let's try to upload.

    const { data, error } = await supabase.storage
        .from('secure-files')
        .upload('Certificado Gabriela COREN.pfx', fileBuffer, {
            contentType: 'application/x-pkcs12',
            upsert: true
        });

    if (error) {
        console.error('Upload error:', error);
    } else {
        console.log('Upload success:', data);
    }
}

upload();
