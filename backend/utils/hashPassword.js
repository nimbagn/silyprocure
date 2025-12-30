const bcrypt = require('bcryptjs');

// Script pour hasher un mot de passe
// Usage: node backend/utils/hashPassword.js "monMotDePasse"

const password = process.argv[2];

if (!password) {
    console.error('Usage: node hashPassword.js "motdepasse"');
    process.exit(1);
}

bcrypt.hash(password, 10)
    .then(hash => {
        console.log('Mot de passe hashé:');
        console.log(hash);
    })
    .catch(err => {
        console.error('Erreur:', err);
    });

