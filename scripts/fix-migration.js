import { execSync } from 'child_process';

/**
 * Script pour résoudre l'erreur P3009 Prisma
 * Force la résolution de la migration si elle a échoué
 */

try {
  console.log('🔄 Tentative de résolution de la migration...');
  
  // Essayer de résoudre la migration comme appliquée
  try {
    execSync('npx prisma migrate resolve --applied 20240530213853_create_session_table', {
      stdio: 'inherit',
      env: process.env
    });
    console.log('✅ Migration marquée comme résolue');
  } catch (error) {
    console.log('⚠️ Migration déjà résolue ou non trouvée, continuons...');
  }
  
  // Essayer d'appliquer les migrations
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env
    });
    console.log('✅ Migrations appliquées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des migrations:', error.message);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

