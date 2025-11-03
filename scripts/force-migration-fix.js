import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Script de réparation FORCE pour les migrations Prisma bloquées
 * Ce script nettoie complètement l'état des migrations et réapplique
 */

async function forceFixMigrations() {
  try {
    console.log('🔧 DÉMARRAGE DU NETTOYAGE FORCE DES MIGRATIONS...');

    // 1. Générer le client Prisma
    console.log('📦 Génération du client Prisma...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: process.env
    });

    const prisma = new PrismaClient();

    try {
      // 2. Vérifier si la table Session existe
      console.log('🔍 Vérification de l\'état de la base de données...');
      let sessionTableExists = false;
      try {
        await prisma.$queryRaw`SELECT 1 FROM "Session" LIMIT 1`;
        sessionTableExists = true;
        console.log('ℹ️  La table Session existe déjà');
      } catch (e) {
        console.log('ℹ️  La table Session n\'existe pas');
      }

      // 3. Vérifier l'état de la migration dans _prisma_migrations
      console.log('🔍 Vérification de l\'état des migrations...');
      let migrationState = null;
      try {
        const migrations = await prisma.$queryRaw`
          SELECT migration_name, finished_at, applied_steps_count, logs 
          FROM _prisma_migrations 
          WHERE migration_name = '20240530213853_create_session_table'
        `;
        if (migrations && migrations.length > 0) {
          migrationState = migrations[0];
          console.log('ℹ️  État de la migration:', JSON.stringify(migrationState, null, 2));
        }
      } catch (e) {
        console.log('⚠️  Impossible de lire _prisma_migrations:', e.message);
      }

      // 4. Si la table n'existe pas, la créer
      if (!sessionTableExists) {
        console.log('🔨 Création de la table Session...');
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
        console.log('✅ Table Session créée');
      }

      // 5. Nettoyer l'état de la migration dans _prisma_migrations
      console.log('🧹 Nettoyage de l\'état des migrations...');
      try {
        // Supprimer l'ancienne entrée si elle existe
        await prisma.$executeRawUnsafe(`
          DELETE FROM "_prisma_migrations" 
          WHERE "migration_name" = '20240530213853_create_session_table'
        `);
        console.log('✅ Ancienne entrée de migration supprimée');
      } catch (e) {
        console.log('⚠️  Erreur lors du nettoyage:', e.message);
        // Essayer de créer la table _prisma_migrations si elle n'existe pas
        try {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
              "id" VARCHAR(36) PRIMARY KEY,
              "checksum" VARCHAR(64) NOT NULL,
              "finished_at" TIMESTAMP,
              "migration_name" VARCHAR(255) NOT NULL,
              "logs" TEXT,
              "rolled_back_at" TIMESTAMP,
              "started_at" TIMESTAMP NOT NULL DEFAULT now(),
              "applied_steps_count" INTEGER NOT NULL DEFAULT 0
            )
          `);
          console.log('✅ Table _prisma_migrations créée');
        } catch (createError) {
          console.log('⚠️  Impossible de créer _prisma_migrations:', createError.message);
        }
      }

      // 6. Réinsérer la migration comme "appliquée"
      console.log('📝 Marquage de la migration comme appliquée...');
      try {
        // D'abord, essayer de supprimer si elle existe
        await prisma.$executeRawUnsafe(`
          DELETE FROM "_prisma_migrations" 
          WHERE "migration_name" = '20240530213853_create_session_table'
        `);
        // Puis réinsérer
        const migrationId = randomUUID();
        await prisma.$executeRawUnsafe(`
          INSERT INTO "_prisma_migrations" (
            "id",
            "migration_name", 
            "checksum", 
            "finished_at", 
            "applied_steps_count",
            "started_at"
          ) VALUES (
            '${migrationId}',
            '20240530213853_create_session_table',
            '',
            NOW(),
            1,
            NOW()
          )
        `);
        console.log('✅ Migration marquée comme appliquée');
      } catch (insertError) {
        console.log('⚠️  Erreur lors de l\'insertion, utilisation de migrate resolve...');
        // Fallback : utiliser la commande Prisma
        try {
          execSync('npx prisma migrate resolve --applied 20240530213853_create_session_table', {
            stdio: 'inherit',
            env: process.env
          });
          console.log('✅ Migration résolue via commande Prisma');
        } catch (resolveError) {
          console.log('⚠️  Erreur avec migrate resolve:', resolveError.message);
          // On continue quand même, la table existe
        }
      }

      // 7. Vérification finale
      console.log('✅ Vérification finale...');
      try {
        await prisma.$queryRaw`SELECT 1 FROM "Session" LIMIT 1`;
        console.log('✅ Table Session vérifiée et accessible');
      } catch (e) {
        throw new Error('La table Session n\'est toujours pas accessible: ' + e.message);
      }

      await prisma.$disconnect();
      console.log('✅ NETTOYAGE TERMINÉ AVEC SUCCÈS');
      process.exit(0);
    } catch (dbError) {
      await prisma.$disconnect();
      throw dbError;
    }
  } catch (error) {
    console.error('❌ ERREUR LORS DU NETTOYAGE:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

forceFixMigrations();

