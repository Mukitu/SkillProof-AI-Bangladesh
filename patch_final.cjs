const fs = require('fs');

// 1. Update index.css for better printing
let css = fs.readFileSync('src/index.css', 'utf8');
const cssTarget = `    background: #ffffff !important;
    color: #1e293b !important;
    box-shadow: none !important;
    border: none !important;`;
const cssReplacement = `    background: #ffffff !important;
    color: #1e293b !important;
    box-shadow: none !important;
    border: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;`;

if (css.includes(cssTarget)) {
  css = css.replace(cssTarget, cssReplacement);
  fs.writeFileSync('src/index.css', css);
  console.log('Updated index.css');
}

// 2. Update PublicPassportPage.tsx for crossOrigin and printing
let publicPage = fs.readFileSync('src/components/PublicPassportPage.tsx', 'utf8');

// Add id for printing to the main card
const cardTarget = `<Card className="relative overflow-hidden border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 shadow-2xl">`;
const cardReplacement = `<Card id="cv-print-area" className="relative overflow-hidden border border-white/5 bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 shadow-2xl">`;

if (publicPage.includes(cardTarget)) {
  publicPage = publicPage.replace(cardTarget, cardReplacement);
}

// Add crossOrigin to avatar image in public page
const imgTarget = `className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-xl"
                  referrerPolicy="no-referrer"`;
const imgReplacement = `className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-xl"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"`;

if (publicPage.includes(imgTarget)) {
  publicPage = publicPage.replace(imgTarget, imgReplacement);
}

fs.writeFileSync('src/components/PublicPassportPage.tsx', publicPage);
console.log('Updated PublicPassportPage.tsx');
