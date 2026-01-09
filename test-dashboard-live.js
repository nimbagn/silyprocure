/**
 * Script de test pour vérifier le dashboard en live
 * Usage: node test-dashboard-live.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Test du Dashboard en Live\n');

// 1. Vérifier que le fichier existe
console.log('1️⃣  Vérification des fichiers...');
const dashboardPath = path.join(__dirname, 'frontend', 'dashboard.html');
if (fs.existsSync(dashboardPath)) {
    console.log('   ✅ dashboard.html existe');
} else {
    console.log('   ❌ dashboard.html introuvable');
    process.exit(1);
}

// 2. Vérifier la structure HTML
console.log('\n2️⃣  Vérification de la structure HTML...');
const content = fs.readFileSync(dashboardPath, 'utf8');

const checks = [
    { name: 'Balise <nav>', pattern: /<nav[^>]*>/i, required: true },
    { name: 'Balise <main>', pattern: /<main[^>]*>/i, required: true },
    { name: 'Sections sémantiques', pattern: /<section[^>]*>/gi, required: true },
    { name: 'Cartes KPI', pattern: /kpi-card/gi, required: true },
    { name: 'Graphiques Chart.js', pattern: /<canvas[^>]*id="(mainChart|rfqChart|categoriesChart|sectorsChart)"/gi, required: true },
    { name: 'Tableau commandes', pattern: /recent-orders-tbody/i, required: true },
    { name: 'Liste messages', pattern: /messages-list/i, required: true },
    { name: 'Script auth.js', pattern: /js\/auth\.js/i, required: true },
    { name: 'Script app.js', pattern: /js\/app\.js/i, required: true },
    { name: 'Chart.js', pattern: /chart\.js/i, required: true },
];

let allPassed = true;
checks.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches) {
        console.log(`   ✅ ${check.name} : ${matches.length} occurrence(s) trouvée(s)`);
    } else if (check.required) {
        console.log(`   ❌ ${check.name} : MANQUANT`);
        allPassed = false;
    } else {
        console.log(`   ⚠️  ${check.name} : Non trouvé (optionnel)`);
    }
});

// 3. Vérifier les zones tactiles (accessibilité)
console.log('\n3️⃣  Vérification de l\'accessibilité...');
const accessibilityChecks = [
    { name: 'Zones tactiles (min-height: 44px)', pattern: /min-h-\[44px\]/gi, required: true },
    { name: 'ARIA labels', pattern: /aria-label/gi, required: true },
    { name: 'Role navigation', pattern: /role="navigation"/gi, required: true },
    { name: 'Labels pour lecteurs d\'écran', pattern: /sr-only/gi, required: false },
];

accessibilityChecks.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches) {
        console.log(`   ✅ ${check.name} : ${matches.length} occurrence(s)`);
    } else if (check.required) {
        console.log(`   ❌ ${check.name} : MANQUANT`);
        allPassed = false;
    } else {
        console.log(`   ⚠️  ${check.name} : Non trouvé (optionnel)`);
    }
});

// 4. Vérifier les sections
console.log('\n4️⃣  Vérification de la structure des sections...');
const sections = content.match(/<section[^>]*class="[^"]*"/gi) || [];
console.log(`   📊 ${sections.length} section(s) trouvée(s)`);
sections.forEach((section, index) => {
    const classMatch = section.match(/class="([^"]*)"/i);
    if (classMatch) {
        console.log(`      Section ${index + 1}: ${classMatch[1].substring(0, 50)}...`);
    }
});

// 5. Vérifier les fonctions JavaScript
console.log('\n5️⃣  Vérification des fonctions JavaScript...');
const jsFunctions = [
    { name: 'initDashboard', pattern: /function\s+initDashboard|async\s+function\s+initDashboard/ },
    { name: 'initCharts', pattern: /function\s+initCharts/ },
    { name: 'loadRecentOrders', pattern: /async\s+function\s+loadRecentOrders|function\s+loadRecentOrders/ },
    { name: 'loadMessages', pattern: /async\s+function\s+loadMessages|function\s+loadMessages/ },
    { name: 'refreshDashboard', pattern: /function\s+refreshDashboard/ },
    { name: 'apiCall', pattern: /apiCall/ },
];

jsFunctions.forEach(func => {
    const matches = content.match(func.pattern);
    if (matches) {
        console.log(`   ✅ ${func.name} : Présent`);
    } else {
        console.log(`   ⚠️  ${func.name} : Non trouvé (peut être dans un fichier externe)`);
    }
});

// 6. Vérifier les IDs des éléments
console.log('\n6️⃣  Vérification des IDs des éléments...');
const requiredIds = [
    'stats-cmd-count',
    'stats-amount',
    'stats-rfq-count',
    'stats-supplier-count',
    'mainChart',
    'rfqChart',
    'categoriesChart',
    'sectorsChart',
    'recent-orders-tbody',
    'messages-list',
    'user-name',
    'user-initials',
    'unread-count',
    'global-search',
    'mobile-menu',
    'mobile-menu-button'
];

let missingIds = [];
requiredIds.forEach(id => {
    const pattern = new RegExp(`id=["']${id}["']`, 'i');
    if (content.match(pattern)) {
        console.log(`   ✅ #${id}`);
    } else {
        console.log(`   ❌ #${id} : MANQUANT`);
        missingIds.push(id);
        allPassed = false;
    }
});

// 7. Vérifier les styles CSS
console.log('\n7️⃣  Vérification des styles CSS...');
const cssChecks = [
    { name: 'Variables CSS (--color-primary)', pattern: /--color-primary:/ },
    { name: 'Classes KPI card', pattern: /\.kpi-card/ },
    { name: 'Classes chart container', pattern: /\.chart-container/ },
    { name: 'Animations fade-in', pattern: /@keyframes\s+fadeIn|\.fade-in/ },
];

cssChecks.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches) {
        console.log(`   ✅ ${check.name} : Présent`);
    } else {
        console.log(`   ⚠️  ${check.name} : Non trouvé`);
    }
});

// 8. Vérifier la responsivité
console.log('\n8️⃣  Vérification de la responsivité...');
const responsiveChecks = [
    { name: 'Menu mobile', pattern: /mobile-menu|md:hidden/gi },
    { name: 'Grilles adaptatives', pattern: /grid-cols-1.*sm:grid-cols-2.*lg:grid-cols/ },
    { name: 'Classes responsive', pattern: /sm:|md:|lg:|xl:/gi },
];

responsiveChecks.forEach(check => {
    const matches = content.match(check.pattern);
    if (matches) {
        console.log(`   ✅ ${check.name} : ${matches.length} occurrence(s)`);
    } else {
        console.log(`   ⚠️  ${check.name} : Limité`);
    }
});

// Résumé
console.log('\n' + '='.repeat(60));
if (allPassed && missingIds.length === 0) {
    console.log('✅ TOUS LES TESTS SONT PASSÉS !');
    console.log('\n📋 Le dashboard est prêt pour les tests en live.');
    console.log('\n🌐 Pour tester en live :');
    console.log('   1. Démarrez le backend : cd backend && npm start');
    console.log('   2. Ouvrez http://localhost:3000/dashboard.html');
    console.log('   3. Connectez-vous avec un utilisateur valide');
    console.log('   4. Vérifiez que les données s\'affichent correctement');
} else {
    console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    if (missingIds.length > 0) {
        console.log(`\n❌ IDs manquants : ${missingIds.join(', ')}`);
    }
    console.log('\n💡 Vérifiez les éléments manquants avant de tester en live.');
}
console.log('='.repeat(60));

