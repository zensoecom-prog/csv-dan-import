import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

/**
 * Script pour s'assurer que les migrations Prisma sont appliquées
 * S'exécute avant le démarrage de l'application
 */

async function ensureMigrations() {
  try {
    console.log('🔄 Vérification et application des migrations Prisma...');

    // 1. Générer le client Prisma
    console.log('📦 Génération du client Prisma...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: process.env
    });

    // 2. Appliquer les migrations
    console.log('🚀 Application des migrations...');
    try {
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env
      });
      console.log('✅ Migrations appliquées avec succès');
    } catch (migrateError) {
      console.error('⚠️ Erreur lors de migrate deploy:', migrateError.message);
      
      // Si erreur P3009, la migration a échoué - il faut la résoudre comme rolled-back
      if (migrateError.message?.includes('P3009') || migrateError.message?.includes('failed migrations')) {
        console.log('🔧 Détection d\'une migration échouée. Résolution en cours...');
        try {
          // Résoudre comme "rolled-back" car la table n'existe probablement pas
          console.log('📋 Résolution de la migration comme rolled-back...');
          execSync('npx prisma migrate resolve --rolled-back 20240530213853_create_session_table', {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migration résolue comme rolled-back');
          
          // Réessayer migrate deploy
          console.log('🔄 Nouvelle tentative d\'application des migrations...');
          execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migrations appliquées avec succès après résolution');
        } catch (resolveError) {
          console.error('❌ Impossible de résoudre les migrations:', resolveError.message);
          // Dernier recours : essayer de créer la table manuellement si elle n'existe pas
          console.log('🔨 Tentative de création manuelle de la table...');
          try {
            const prisma = new PrismaClient();
            // Créer la table directement avec SQL brut
            await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);`);
            await prisma.$disconnect();
            
            console.log('✅ Table créée manuellement');
            // Marquer la migration comme appliquée
            execSync('npx prisma migrate resolve --applied 20240530213853_create_session_table', {
              stdio: 'inherit',
              env: process.env
            });
          } catch (manualError) {
            console.error('❌ Impossible de créer la table manuellement:', manualError.message);
            throw resolveError;
          }
        }
      } else {
        throw migrateError;
      }
    }

    // 3. Vérification finale
    console.log('✅ Migrations terminées. La table Session devrait être créée.');

    console.log('✅ Toutes les migrations sont prêtes');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la préparation des migrations:', error.message);
    process.exit(1);
  }
}

ensureMigrations();

