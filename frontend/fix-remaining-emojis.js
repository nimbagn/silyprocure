#!/usr/bin/env node
// Script pour remplacer les emojis restants dans les fichiers JS et HTML

const fs = require('fs');
const path = require('path');

const emojiReplacements = {
    '👁️': '<i class="fas fa-eye"></i>',
    '👀': '<i class="fas fa-eye"></i>',
    '✅': '<i class="fas fa-check-circle"></i>',
    '❌': '<i class="fas fa-times-circle"></i>',
    '⚠️': '<i class="fas fa-exclamation-triangle"></i>',
    'ℹ️': '<i class="fas fa-info-circle"></i>',
    '📊': '<i class="fas fa-chart-line"></i>',
    '📋': '<i class="fas fa-file-alt"></i>',
    '💼': '<i class="fas fa-briefcase"></i>',
    '🛒': '<i class="fas fa-shopping-cart"></i>',
    '🧾': '<i class="fas fa-file-invoice"></i>',
    '🏢': '<i class="fas fa-building"></i>',
    '📦': '<i class="fas fa-box"></i>',
    '🗺️': '<i class="fas fa-map"></i>',
    '➕': '<i class="fas fa-plus"></i>',
    '🔄': '<i class="fas fa-sync-alt"></i>',
    '📈': '<i class="fas fa-arrow-up"></i>',
    '📉': '<i class="fas fa-arrow-down"></i>',
    '⭐': '<i class="fas fa-star"></i>',
    '💰': '<i class="fas fa-money-bill-wave"></i>',
    '📝': '<i class="fas fa-edit"></i>',
    '📤': '<i class="fas fa-paper-plane"></i>',
    '⏳': '<i class="fas fa-clock"></i>',
    '🔍': '<i class="fas fa-search"></i>',
    '✏️': '<i class="fas fa-edit"></i>',
    '🗑️': '<i class="fas fa-trash"></i>',
    '📄': '<i class="fas fa-file"></i>',
    '📧': '<i class="fas fa-envelope"></i>',
    '🔒': '<i class="fas fa-lock"></i>',
    '🚀': '<i class="fas fa-rocket"></i>',
    '🏠': '<i class="fas fa-home"></i>',
};

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Remplacer les emojis
        for (const [emoji, icon] of Object.entries(emojiReplacements)) {
            content = content.replace(new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), icon);
        }
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${path.basename(filePath)}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Erreur avec ${filePath}:`, error.message);
        return false;
    }
}

// Traiter tous les fichiers JS et HTML
const frontendDir = path.join(__dirname);
const files = [];

// HTML files
fs.readdirSync(frontendDir)
    .filter(file => file.endsWith('.html') && file !== 'test-dashboard.html')
    .forEach(file => files.push(path.join(frontendDir, file)));

// JS files
const jsDir = path.join(frontendDir, 'js');
if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir)
        .filter(file => file.endsWith('.js'))
        .forEach(file => files.push(path.join(jsDir, file)));
}

console.log('🔧 Remplacement des emojis restants...\n');

let processed = 0;
files.forEach(file => {
    if (processFile(file)) {
        processed++;
    }
});

console.log(`\n✅ ${processed} fichier(s) modifié(s) sur ${files.length} fichier(s) au total.`);

