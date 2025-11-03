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
      
      // Si erreur P3009, essayer de résoudre
      if (migrateError.message?.includes('P3009')) {
        console.log('🔧 Tentative de résolution de l\'erreur P3009...');
        try {
          execSync('npx prisma migrate resolve --applied 20240530213853_create_session_table', {
            stdio: 'inherit',
            env: process.env
          });
          // Réessayer migrate deploy
          execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migrations résolues et appliquées');
        } catch (resolveError) {
          console.error('❌ Impossible de résoudre les migrations:', resolveError.message);
          throw resolveError;
        }
      } else {
        throw migrateError;
      }
    }

    // 3. Vérifier que la table Session existe
    console.log('🔍 Vérification de la table Session...');
    const prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1 FROM "Session" LIMIT 1`;
      console.log('✅ Table Session existe');
    } catch (error) {
      console.error('❌ Table Session n\'existe pas. Tentative de création...');
      // La table devrait exister après migrate deploy
      // Si elle n'existe pas, il y a un problème
      throw new Error('Table Session non trouvée après migrations');
    } finally {
      await prisma.$disconnect();
    }

    console.log('✅ Toutes les migrations sont prêtes');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la préparation des migrations:', error.message);
    process.exit(1);
  }
}

ensureMigrations();

