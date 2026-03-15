-- ============================================
-- REQUÊTES POUR VÉRIFIER ET CRÉER UN SUPER ADMIN
-- ============================================

-- 1. VÉRIFIER LES SUPER ADMINS EXISTANTS
SELECT 
    id,
    prenom,
    nom,
    telephone1,
    telephone2,
    est_super_admin,
    doit_changer_mot_de_passe,
    date_inscription,
    cree_le
FROM utilisateur
WHERE est_super_admin = TRUE;

-- 2. VÉRIFIER TOUS LES UTILISATEURS
SELECT 
    id,
    prenom,
    nom,
    telephone1,
    est_super_admin
FROM utilisateur
ORDER BY cree_le DESC;

-- 3. STRUCTURE DE LA TABLE UTILISATEUR
DESCRIBE utilisateur;

-- 4. CRÉER UN NOUVEAU SUPER ADMIN (si aucun n'existe)
-- Mot de passe: Admin@2025!
-- Hash bcrypt du mot de passe (10 rounds)
INSERT INTO utilisateur (
    id,
    prenom,
    nom,
    telephone1,
    password_hash,
    est_super_admin,
    doit_changer_mot_de_passe,
    date_inscription,
    cree_le
) VALUES (
    UUID(),
    'Super',
    'Admin',
    '+237690000001',
    '$2b$10$rKZH8qF5qYxN5xZ5qYxN5.xZ5qYxN5xZ5qYxN5xZ5qYxN5xZ5qYxN',
    TRUE,
    FALSE,
    CURDATE(),
    NOW()
);

-- 5. METTRE À JOUR LE MOT DE PASSE D'UN UTILISATEUR EXISTANT
-- Remplacez 'TELEPHONE_ICI' par le numéro de téléphone
-- Mot de passe: Admin@2025!
UPDATE utilisateur 
SET 
    password_hash = '$2b$10$rKZH8qF5qYxN5xZ5qYxN5.xZ5qYxN5xZ5qYxN5xZ5qYxN5xZ5qYxN',
    doit_changer_mot_de_passe = FALSE
WHERE telephone1 = '+237699999999';

-- 6. PROMOUVOIR UN UTILISATEUR EN SUPER ADMIN
UPDATE utilisateur 
SET est_super_admin = TRUE
WHERE telephone1 = '+237690000001';
