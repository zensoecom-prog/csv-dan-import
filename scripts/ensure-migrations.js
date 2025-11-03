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
      
      // Si erreur P3009, la migration a échoué
      // Suivre Option 1 de la doc Prisma: https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing#failed-migration
      if (migrateError.message?.includes('P3009') || migrateError.message?.includes('failed migrations')) {
        console.log('🔧 Détection d\'une migration échouée. Application de la méthode Prisma (Option 1)...');
        try {
          // Étape 1: Marquer la migration comme rolled-back
          // Cela permet à Prisma de la réappliquer
          console.log('📋 Étape 1: Marquage de la migration comme rolled-back...');
          execSync('npx prisma migrate resolve --rolled-back 20240530213853_create_session_table', {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migration marquée comme rolled-back');
          
          // Étape 2: Réappliquer les migrations
          // La migration utilise maintenant IF NOT EXISTS, donc elle peut être appliquée même si partiellement exécutée
          console.log('🔄 Étape 2: Nouvelle tentative d\'application des migrations...');
          execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migrations appliquées avec succès après résolution (Option 1 Prisma)');
        } catch (resolveError) {
          console.error('❌ Impossible de résoudre les migrations avec Option 1:', resolveError.message);
          console.log('🔨 Passage à Option 2: Complétion manuelle de la migration...');
          try {
            // Option 2: Compléter manuellement et marquer comme appliquée
            // Voir: https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing#option-2-manually-complete-migration-and-resolve-as-applied
            const prisma = new PrismaClient();
            // Créer la table si elle n'existe pas (identique à la migration)
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
            
            console.log('✅ Table créée/complétée manuellement');
            // Marquer la migration comme appliquée (Option 2 Prisma)
            execSync('npx prisma migrate resolve --applied 20240530213853_create_session_table', {
              stdio: 'inherit',
              env: process.env
            });
            console.log('✅ Migration marquée comme appliquée (Option 2 Prisma)');
          } catch (manualError) {
            console.error('❌ Impossible de compléter la migration manuellement:', manualError.message);
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

