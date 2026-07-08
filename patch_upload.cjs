const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');

let target1 = `          // প্রোফাইলে আপডেট করি (Save Base64 to profile as fallback)
          await this.updateProfile(userId, { avatarUrl: base64 });
          
          return { success: true, url: base64, error: null };`;
let replacement1 = `          // প্রোফাইলে আপডেট করি (Save Base64 to profile as fallback)
          const { error: updateErr } = await this.updateProfile(userId, { avatarUrl: base64 });
          if (updateErr) throw new Error(updateErr.message);
          
          return { success: true, url: base64, error: null };`;

code = code.replace(target1, replacement1);

let target2 = `        // প্রোফাইলে আপডেট করি
        await this.updateProfile(userId, { avatarUrl: publicUrl });

        return { success: true, url: publicUrl, error: null };`;
let replacement2 = `        // প্রোফাইলে আপডেট করি
        const { error: updateErr2 } = await this.updateProfile(userId, { avatarUrl: publicUrl });
        if (updateErr2) throw new Error(updateErr2.message);

        return { success: true, url: publicUrl, error: null };`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/lib/supabase.ts', code);
