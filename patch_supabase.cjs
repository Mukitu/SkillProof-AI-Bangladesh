const fs = require('fs');
let code = fs.readFileSync('src/lib/supabase.ts', 'utf8');
code = code.replace(".select('email, social_links')", ".select('email, full_name, social_links')");

// We need to inject full_name logic
const target = `        if (!currentProfile) {
          const { data: authData } = await supabaseClient.auth.getUser();
          dbUpdates.email = authData.user?.email || updates.email || '';
        } else if (currentProfile.email) {
          dbUpdates.email = currentProfile.email;
        } else if (updates.email) {
          dbUpdates.email = updates.email;
        }`;

const replacement = target + `
        
        // Ensure full_name is present to satisfy NOT NULL constraints
        if (dbUpdates.full_name === undefined) {
          if (currentProfile && currentProfile.full_name) {
            dbUpdates.full_name = currentProfile.full_name;
          } else {
            dbUpdates.full_name = updates.fullName || 'User';
          }
        }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/lib/supabase.ts', code);
