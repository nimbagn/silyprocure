<?php
/**
 * Configuration de la base de données SilyProcure
 * 
 * Copiez ce fichier en config.php et modifiez les valeurs si nécessaire
 */

return [
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'dbname' => 'silypro',
        'username' => 'soul',
        'password' => 'Satina2025',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'options' => [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    ]
];

