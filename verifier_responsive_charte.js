// Script pour vérifier la responsivité et la charte graphique de toutes les pages HTML
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');
const cssDir = path.join(frontendDir, 'css');

// Couleurs de la charte graphique
const charteColors = {
    primary: ['#00387A', '#002855', '#0052A3', '#1E3A8A', '#3B82F6'],
    accent: ['#FF6600', '#FF8533', '#E55A00'],
    success: ['#10B981', '#00A651'],
    neutral: ['#6B7280', '#64748B', '#374151', '#475569'],
    background: ['#FFFFFF', '#F9FAFB', '#F8FAFC', '#E0E7FF']
};

// Breakpoints responsive attendus
const expectedBreakpoints = [
    'max-width: 1024px',
    'max-width: 768px',
    'max-width: 479px',
    'min-width: 768px',
    'min-width: 1025px',
    'orientation: portrait',
    'orientation: landscape'
];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    const checks = {
        viewport: false,
        styleCss: false,
        charteColors: false,
        responsive: false,
        sidebar: false,
        fontInter: false
    };

    // Vérifier viewport
    if (content.includes('viewport') && content.includes('width=device-width')) {
        checks.viewport = true;
    } else {
        issues.push('❌ Viewport manquant ou incorrect');
    }

    // Vérifier style.css
    const hasStyleCss = content.includes('css/style.css');
    if (hasStyleCss) {
        checks.styleCss = true;
    } else {
        issues.push('❌ style.css non inclus');
    }

    // Vérifier les couleurs de la charte (dans les styles inline ou CSS)
    // Si style.css est inclus, les couleurs sont dedans (bonne pratique)
    const hasCharteColor = charteColors.primary.some(color => 
        content.includes(color) || content.includes('var(--color-primary)')
    );
    const hasVariables = content.includes('--color-primary') || content.includes('--color-accent');
    
    if (hasStyleCss || hasCharteColor || hasVariables) {
        checks.charteColors = true;
    } else {
        issues.push('❌ Couleurs de la charte non détectées');
    }

    // Vérifier sidebar
    // Les pages publiques (index.html, home.html, devis-externe.html, suivi.html) n'ont pas besoin de sidebar
    const publicPages = ['index.html', 'home.html', 'devis-externe.html', 'suivi.html', 'test-dashboard.html'];
    const isPublicPage = publicPages.some(page => filePath.includes(page));
    
    if (content.includes('sidebar.js') || content.includes('class="sidebar"') || content.includes('DISABLE_SIDEBAR') || isPublicPage) {
        checks.sidebar = true;
    } else {
        // Vérifier si c'est une page avec l'ancien système (header/nav)
        if (content.includes('class="header"') && content.includes('class="nav"')) {
            // Ancien système mais toujours valide
            checks.sidebar = true;
        } else {
            issues.push('⚠️  Sidebar non détectée');
        }
    }

    // Vérifier police Inter
    if (content.includes('Inter') || (content.includes('font-family') && content.includes('Inter'))) {
        checks.fontInter = true;
    } else {
        issues.push('⚠️  Police Inter non détectée');
    }

    // Vérifier responsive (media queries dans le CSS ou styles inline)
    // Si style.css est inclus, les media queries sont dedans (bonne pratique)
    const hasResponsive = content.includes('@media') || content.includes('max-width') || content.includes('min-width');
    
    if (hasStyleCss || hasResponsive) {
        checks.responsive = true;
    } else {
        issues.push('❌ Responsive non détecté');
    }

    return { checks, issues, fileName: path.basename(filePath) };
}

function checkCSS() {
    const styleCssPath = path.join(cssDir, 'style.css');
    if (!fs.existsSync(styleCssPath)) {
        return { error: 'style.css non trouvé' };
    }

    const content = fs.readFileSync(styleCssPath, 'utf8');
    const cssIssues = [];
    const cssChecks = {
        charteColors: false,
        responsive: false,
        variables: false
    };

    // Vérifier les variables CSS de la charte
    if (content.includes('--color-primary') && content.includes('--color-accent')) {
        cssChecks.variables = true;
    } else {
        cssIssues.push('❌ Variables CSS de la charte manquantes');
    }

    // Vérifier les couleurs
    const hasPrimary = charteColors.primary.some(c => content.includes(c));
    const hasAccent = charteColors.accent.some(c => content.includes(c));
    if (hasPrimary && hasAccent) {
        cssChecks.charteColors = true;
    } else {
        cssIssues.push('⚠️  Certaines couleurs de la charte manquantes');
    }

    // Vérifier les media queries
    const mediaQueries = (content.match(/@media[^{]+{/g) || []).length;
    if (mediaQueries >= 5) {
        cssChecks.responsive = true;
    } else {
        cssIssues.push(`⚠️  Seulement ${mediaQueries} media queries trouvées (attendu: 5+)`);
    }

    return { checks: cssChecks, issues: cssIssues, mediaQueries };
}

// Main
console.log('🔍 Vérification de la responsivité et de la charte graphique\n');
console.log('='.repeat(60));

// Vérifier le CSS principal
console.log('\n📄 Vérification du CSS principal (style.css)');
const cssCheck = checkCSS();
console.log('✅ Variables CSS:', cssCheck.checks?.variables ? '✅' : '❌');
console.log('✅ Couleurs charte:', cssCheck.checks?.charteColors ? '✅' : '⚠️');
console.log('✅ Media queries:', cssCheck.checks?.responsive ? `✅ (${cssCheck.mediaQueries} trouvées)` : '⚠️');
if (cssCheck.issues?.length > 0) {
    cssCheck.issues.forEach(issue => console.log('  ', issue));
}

// Vérifier toutes les pages HTML
console.log('\n📄 Vérification des pages HTML\n');
const htmlFiles = fs.readdirSync(frontendDir)
    .filter(f => f.endsWith('.html'))
    .sort();

const results = [];
let totalIssues = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(frontendDir, file);
    const result = checkFile(filePath);
    results.push(result);
    
    const issueCount = result.issues.length;
    totalIssues += issueCount;
    
    const status = issueCount === 0 ? '✅' : issueCount <= 2 ? '⚠️' : '❌';
    console.log(`${status} ${file.padEnd(30)} ${issueCount} problème(s)`);
    
    if (issueCount > 0 && issueCount <= 3) {
        result.issues.forEach(issue => console.log(`   ${issue}`));
    }
});

// Résumé
console.log('\n' + '='.repeat(60));
console.log('\n📊 RÉSUMÉ\n');

const totalFiles = results.length;
const perfectFiles = results.filter(r => r.issues.length === 0).length;
const warningFiles = results.filter(r => r.issues.length > 0 && r.issues.length <= 2).length;
const errorFiles = results.filter(r => r.issues.length > 2).length;

console.log(`Total de pages: ${totalFiles}`);
console.log(`✅ Parfaites: ${perfectFiles} (${Math.round(perfectFiles/totalFiles*100)}%)`);
console.log(`⚠️  Avec avertissements: ${warningFiles} (${Math.round(warningFiles/totalFiles*100)}%)`);
console.log(`❌ Avec erreurs: ${errorFiles} (${Math.round(errorFiles/totalFiles*100)}%)`);
console.log(`\nTotal de problèmes: ${totalIssues}`);

// Détails par catégorie
console.log('\n📋 Détails par catégorie:\n');

const categories = {
    'Viewport manquant': results.filter(r => !r.checks.viewport).length,
    'style.css manquant': results.filter(r => !r.checks.styleCss).length,
    'Sidebar non détectée': results.filter(r => !r.checks.sidebar).length,
    'Police Inter manquante': results.filter(r => !r.checks.fontInter).length
};

Object.entries(categories).forEach(([cat, count]) => {
    if (count > 0) {
        console.log(`  ${cat}: ${count} page(s)`);
    }
});

// Recommandations
console.log('\n💡 Recommandations:\n');

if (errorFiles > 0) {
    console.log('  ❌ Corriger les pages avec erreurs critiques');
}

if (warningFiles > 0) {
    console.log('  ⚠️  Vérifier les pages avec avertissements');
}

if (!cssCheck.checks?.responsive) {
    console.log('  📱 Améliorer les media queries dans style.css');
}

if (categories['Sidebar non détectée'] > 0) {
    console.log('  🔄 Migrer les pages vers le nouveau système sidebar');
}

console.log('\n✅ Vérification terminée!\n');

