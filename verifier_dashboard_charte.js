#!/usr/bin/env node

/**
 * Script de vérification du dashboard selon la charte graphique Pro Confiance
 */

const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'frontend', 'dashboard.html');
const chartePath = path.join(__dirname, 'charte-graphique', 'mini-charte-pro-confiance.md');

// Couleurs de la charte Pro Confiance
const CHARTE_COLORS = {
    primaryDark: '#1E3A8A',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    success: '#10B981',
    neutral: '#64748B',
    neutralDark: '#475569',
    background: '#FFFFFF',
    backgroundLight: '#F8FAFC',
    backgroundBlue: '#E0E7FF'
};

// Vérifications à effectuer
const checks = {
    colors: [],
    typography: [],
    kpiCards: [],
    navbar: [],
    styles: [],
    errors: []
};

console.log('🔍 Vérification du dashboard.html selon la charte Pro Confiance\n');
console.log('='.repeat(60));

// Lire le fichier dashboard
if (!fs.existsSync(dashboardPath)) {
    console.error('❌ Fichier dashboard.html introuvable:', dashboardPath);
    process.exit(1);
}

const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');

// 1. Vérifier les couleurs de la charte
console.log('\n📊 1. Vérification des couleurs de la charte...');
Object.entries(CHARTE_COLORS).forEach(([name, color]) => {
    const regex = new RegExp(color.replace('#', '#'), 'gi');
    if (dashboardContent.match(regex)) {
        checks.colors.push({ name, color, found: true });
        console.log(`   ✅ ${name}: ${color} trouvé`);
    } else {
        checks.colors.push({ name, color, found: false });
        console.log(`   ⚠️  ${name}: ${color} non trouvé`);
    }
});

// 2. Vérifier les variables CSS
console.log('\n📝 2. Vérification des variables CSS...');
const cssVars = [
    '--color-primary-dark',
    '--color-primary',
    '--color-primary-light',
    '--color-success',
    '--color-neutral',
    '--color-neutral-dark',
    '--color-background',
    '--color-background-light',
    '--color-background-blue'
];

cssVars.forEach(varName => {
    if (dashboardContent.includes(varName)) {
        checks.styles.push({ var: varName, found: true });
        console.log(`   ✅ Variable ${varName} trouvée`);
    } else {
        checks.styles.push({ var: varName, found: false });
        console.log(`   ❌ Variable ${varName} manquante`);
        checks.errors.push(`Variable CSS manquante: ${varName}`);
    }
});

// 3. Vérifier les classes KPI
console.log('\n🎴 3. Vérification des cartes KPI...');
const kpiCardClasses = ['blue', 'green', 'yellow', 'red', 'purple', 'indigo', 'pink', 'teal'];
kpiCardClasses.forEach(color => {
    const regex = new RegExp(`kpi-card\\s+${color}`, 'i');
    if (dashboardContent.match(regex)) {
        checks.kpiCards.push({ color, found: true });
        console.log(`   ✅ Carte KPI ${color} trouvée`);
    } else {
        checks.kpiCards.push({ color, found: false });
        console.log(`   ⚠️  Carte KPI ${color} non trouvée`);
    }
});

// 4. Vérifier la typographie
console.log('\n📖 4. Vérification de la typographie...');
const typographyChecks = [
    { name: 'Police Inter', pattern: /font-family.*Inter/i, required: true },
    { name: 'H2 - 24px, 600', pattern: /h2.*24px|font-size:\s*24px|text-2xl.*font-bold/i, required: true },
    { name: 'H3 - 20px, 600', pattern: /h3.*20px|font-size:\s*20px|text-lg.*font-semibold/i, required: true },
    { name: 'Line-height 1.5', pattern: /line-height:\s*1\.5/i, required: true }
];

typographyChecks.forEach(check => {
    if (dashboardContent.match(check.pattern)) {
        checks.typography.push({ name: check.name, found: true });
        console.log(`   ✅ ${check.name} trouvé`);
    } else {
        checks.typography.push({ name: check.name, found: false });
        if (check.required) {
            console.log(`   ❌ ${check.name} manquant`);
            checks.errors.push(`Typographie manquante: ${check.name}`);
        } else {
            console.log(`   ⚠️  ${check.name} non trouvé`);
        }
    }
});

// 5. Vérifier la navbar
console.log('\n🧭 5. Vérification de la navbar...');
const navbarChecks = [
    { name: 'Bordure bleue', pattern: /border-blue-100|border.*blue/i, required: true },
    { name: 'Logo avec classe logo-primary', pattern: /logo-primary/i, required: true },
    { name: 'Menu mobile', pattern: /mobile-menu|toggleMobileMenu/i, required: true },
    { name: 'Bouton déconnexion', pattern: /bg-primary-500|bg-primary-600/i, required: true }
];

navbarChecks.forEach(check => {
    if (dashboardContent.match(check.pattern)) {
        checks.navbar.push({ name: check.name, found: true });
        console.log(`   ✅ ${check.name} trouvé`);
    } else {
        checks.navbar.push({ name: check.name, found: false });
        if (check.required) {
            console.log(`   ❌ ${check.name} manquant`);
            checks.errors.push(`Navbar: ${check.name} manquant`);
        } else {
            console.log(`   ⚠️  ${check.name} non trouvé`);
        }
    }
});

// 6. Vérifier les transitions
console.log('\n⚡ 6. Vérification des transitions...');
const transitionPattern = /transition.*0\.(2|3)|transition.*200ms|transition.*300ms/i;
if (dashboardContent.match(transitionPattern)) {
    console.log('   ✅ Transitions de 200-300ms trouvées');
} else {
    console.log('   ⚠️  Transitions de 200-300ms non trouvées');
    checks.errors.push('Transitions de 200-300ms manquantes');
}

// 7. Vérifier les animations fade-in
console.log('\n🎬 7. Vérification des animations...');
const fadeInCount = (dashboardContent.match(/fade-in/g) || []).length;
const delayCount = (dashboardContent.match(/delay-\d+/g) || []).length;
console.log(`   ✅ ${fadeInCount} animations fade-in trouvées`);
console.log(`   ✅ ${delayCount} délais d'animation trouvés`);

// 8. Vérifier le fichier CSS
console.log('\n📄 8. Vérification du lien CSS...');
if (dashboardContent.includes('css/style.css')) {
    console.log('   ✅ Lien vers css/style.css trouvé');
    const cssPath = path.join(__dirname, 'frontend', 'css', 'style.css');
    if (fs.existsSync(cssPath)) {
        console.log('   ✅ Fichier css/style.css existe');
    } else {
        console.log('   ⚠️  Fichier css/style.css n\'existe pas');
        checks.errors.push('Fichier css/style.css introuvable');
    }
} else {
    console.log('   ❌ Lien vers css/style.css manquant');
    checks.errors.push('Lien vers css/style.css manquant');
}

// Résumé
console.log('\n' + '='.repeat(60));
console.log('📋 RÉSUMÉ DE LA VÉRIFICATION\n');

const totalChecks = 
    checks.colors.length +
    checks.styles.length +
    checks.kpiCards.length +
    checks.typography.length +
    checks.navbar.length;

const passedChecks = 
    checks.colors.filter(c => c.found).length +
    checks.styles.filter(s => s.found).length +
    checks.kpiCards.filter(k => k.found).length +
    checks.typography.filter(t => t.found).length +
    checks.navbar.filter(n => n.found).length;

const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);

console.log(`✅ Vérifications réussies: ${passedChecks}/${totalChecks} (${successRate}%)`);
console.log(`❌ Erreurs trouvées: ${checks.errors.length}`);

if (checks.errors.length > 0) {
    console.log('\n🔴 ERREURS À CORRIGER:');
    checks.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
    });
} else {
    console.log('\n🎉 Aucune erreur trouvée ! Le dashboard respecte la charte graphique.');
}

// Détails par catégorie
console.log('\n📊 DÉTAILS PAR CATÉGORIE:');
console.log(`   Couleurs: ${checks.colors.filter(c => c.found).length}/${checks.colors.length}`);
console.log(`   Variables CSS: ${checks.styles.filter(s => s.found).length}/${checks.styles.length}`);
console.log(`   Cartes KPI: ${checks.kpiCards.filter(k => k.found).length}/${checks.kpiCards.length}`);
console.log(`   Typographie: ${checks.typography.filter(t => t.found).length}/${checks.typography.length}`);
console.log(`   Navbar: ${checks.navbar.filter(n => n.found).length}/${checks.navbar.length}`);

console.log('\n' + '='.repeat(60));

// Code de sortie
process.exit(checks.errors.length > 0 ? 1 : 0);

