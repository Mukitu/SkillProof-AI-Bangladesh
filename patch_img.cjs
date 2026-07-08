const fs = require('fs');
let code = fs.readFileSync('src/components/AiSkillPassport.tsx', 'utf8');

// Replace the avatar img tag
let targetImg = `<img 
                src={passport.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                alt="Avatar" 
                className="w-48 h-48 rounded-[2rem] object-cover border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
              />`;

let replacementImg = `<img 
                src={user?.avatarUrl || passport.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'} 
                alt="Avatar" 
                className="w-48 h-48 rounded-[2rem] object-cover border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />`;

code = code.replace(targetImg, replacementImg);

// Fix the ID for printing
let targetCard = `<div 
        ref={cardRef}
        className="bg-white text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-emerald-50/50 relative print:shadow-none print:border-none"
      >`;

let replacementCard = `<div 
        id="cv-print-area"
        ref={cardRef}
        className="bg-white text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-emerald-50/50 relative print:shadow-none print:border-none"
      >`;

code = code.replace(targetCard, replacementCard);

// Make sure the name is the synced user name if available
code = code.replace(
  '<h2 className="text-2xl font-black text-slate-900 leading-tight">{passport.fullName}</h2>',
  '<h2 className="text-2xl font-black text-slate-900 leading-tight">{user?.fullName || passport.fullName}</h2>'
);

fs.writeFileSync('src/components/AiSkillPassport.tsx', code);
