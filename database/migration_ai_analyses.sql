-- Migration pour la table ai_analyses
-- Stocke les analyses IA pour le cache et l'historique

CREATE TABLE IF NOT EXISTS ai_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_id INT COMMENT 'ID de la RFQ analysée',
    type_analyse VARCHAR(50) NOT NULL COMMENT 'Type d\'analyse: quote_analysis, supplier_recommendation, anomaly_detection, etc.',
    resultat JSON NOT NULL COMMENT 'Résultat de l\'analyse au format JSON',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création',
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Date de dernière modification',
    FOREIGN KEY (rfq_id) REFERENCES rfq(id) ON DELETE CASCADE,
    INDEX idx_rfq_id (rfq_id),
    INDEX idx_type_analyse (type_analyse),
    INDEX idx_date_creation (date_creation),
    UNIQUE KEY unique_rfq_type (rfq_id, type_analyse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cache des analyses IA';

-- Table pour stocker les recommandations IA
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_recommendation VARCHAR(50) NOT NULL COMMENT 'Type: supplier, quote, etc.',
    contexte_id INT COMMENT 'ID du contexte (RFQ, demande_devis, etc.)',
    contexte_type VARCHAR(50) COMMENT 'Type de contexte: rfq, demande_devis, etc.',
    recommendation JSON NOT NULL COMMENT 'Recommandation au format JSON',
    priorite VARCHAR(20) DEFAULT 'medium' COMMENT 'Priorité: low, medium, high',
    accepte BOOLEAN DEFAULT FALSE COMMENT 'Recommandation acceptée ou non',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contexte (contexte_id, contexte_type),
    INDEX idx_type (type_recommendation),
    INDEX idx_priorite (priorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Recommandations générées par l\'IA';

-- Table pour stocker les anomalies détectées
CREATE TABLE IF NOT EXISTS ai_anomalies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_anomalie VARCHAR(50) NOT NULL COMMENT 'Type: prix_trop_bas, prix_trop_haut, incoherence_calcul, etc.',
    entite_type VARCHAR(50) NOT NULL COMMENT 'Type d\'entité: devis, commande, facture, etc.',
    entite_id INT NOT NULL COMMENT 'ID de l\'entité concernée',
    severite VARCHAR(20) DEFAULT 'info' COMMENT 'Severité: info, warning, error',
    message TEXT NOT NULL COMMENT 'Message descriptif de l\'anomalie',
    details JSON COMMENT 'Détails supplémentaires au format JSON',
    resolue BOOLEAN DEFAULT FALSE COMMENT 'Anomalie résolue ou non',
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_resolution DATETIME NULL,
    INDEX idx_entite (entite_type, entite_id),
    INDEX idx_type (type_anomalie),
    INDEX idx_severite (severite),
    INDEX idx_resolue (resolue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Anomalies détectées par l\'IA';

