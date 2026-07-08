const fs = require('fs');
let code = fs.readFileSync('src/components/AiSkillPassport.tsx', 'utf8');

let target = `      // যদি পাসপোর্ট না থাকে বা ফোর্স সিঙ্ক করতে হয়
      if (!p || forceSync) {
        p = await passportDb.syncPassport(user.id, user);
      }`;

let replacement = `      // যদি পাসপোর্ট না থাকে বা ফোর্স সিঙ্ক করতে হয়, অথবা নাম/ছবি আপডেট হয়
      if (!p || forceSync || p.fullName !== user.fullName || p.avatarUrl !== user.avatarUrl) {
        p = await passportDb.syncPassport(user.id, user);
      }`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/AiSkillPassport.tsx', code);
