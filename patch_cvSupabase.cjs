const fs = require('fs');
let code = fs.readFileSync('src/lib/cvSupabase.ts', 'utf8');

let target = `        // বাকেট না থাকলে বা পারমিশন না থাকলে এরর হ্যান্ডলিং
        if (uploadError && (
          uploadError.message?.includes('not found') || 
          uploadError.message?.includes('Bucket') || 
          uploadError.message?.includes('does not exist') ||
          uploadError.message?.includes('violates row-level security policy') ||
          (uploadError as any).status === 404
        )) {
          console.error('❌ Supabase Storage Error:', uploadError.message);
          throw new Error('সুপাবেজ স্টোরেজে "cv_storage" বাকেটটি তৈরি করা নেই অথবা পারমিশন নেই। দয়া করে সুপাবেজ ড্যাশবোর্ড থেকে "cv_storage" নামে একটি Public Bucket তৈরি করুন এবং RLS পলিসি চেক করুন। (Storage bucket "cv_storage" not found or RLS policy violation. Please create a public bucket named "cv_storage" in your Supabase dashboard.)');
        }

        if (uploadError) {
          throw new Error(\`Storage upload error: \${uploadError.message}\`);
        }

        // ২. পাবলিক ইউআরএল জেনারেট করা (Retrieve public URL)
        const { data } = supabaseClient.storage
          .from('cv_storage')
          .getPublicUrl(filePath);

        publicUrl = data?.publicUrl || '';

        // ৩. মেটাডাটা টেবিলে সংরক্ষণ করা (Save upload metadata)
        const metadataRow = {
          userId,
          fileName: file.name,
          fileSize: file.size,
          fileUrl: publicUrl,
          uploadedAt: new Date().toISOString()
        };

        const { error: metaError } = await supabaseClient
          .from('cv_files_metadata')
          .insert(metadataRow);
          
        if (metaError) {
          console.warn('⚠️ Metadata save failed (maybe table does not exist), but upload succeeded:', metaError.message);
        }`;

let replacement = `        // বাকেট না থাকলে বা পারমিশন না থাকলে বেস৬৪ এ ফলব্যাক করা
        if (uploadError && (
          uploadError.message?.includes('not found') || 
          uploadError.message?.includes('Bucket') || 
          uploadError.message?.includes('does not exist') ||
          uploadError.message?.includes('violates row-level security policy') ||
          (uploadError as any).status === 404
        )) {
          console.warn('⚠️ cv_storage bucket issue, falling back to Base64...');
          
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          publicUrl = base64;
          
        } else if (uploadError) {
          throw new Error(\`Storage upload error: \${uploadError.message}\`);
        } else {
          // ২. পাবলিক ইউআরএল জেনারেট করা (Retrieve public URL)
          const { data } = supabaseClient.storage
            .from('cv_storage')
            .getPublicUrl(filePath);

          publicUrl = data?.publicUrl || '';
        }

        // ৩. মেটাডাটা টেবিলে সংরক্ষণ করা (Save upload metadata)
        const metadataRow = {
          user_id: userId,
          file_name: file.name,
          file_size: file.size,
          file_url: publicUrl,
          uploaded_at: new Date().toISOString()
        };

        const { error: metaError } = await supabaseClient
          .from('cv_files_metadata')
          .insert(metadataRow);
          
        if (metaError) {
          console.warn('⚠️ Metadata save failed (maybe table does not exist), but upload succeeded:', metaError.message);
        }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/lib/cvSupabase.ts', code);
