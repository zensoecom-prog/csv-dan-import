import nodemailer from 'nodemailer';

/**
 * Créer un transport email (SMTP ou autre)
 * Utilise les variables d'environnement pour la configuration
 */
function createEmailTransport() {
  // Log toutes les variables email disponibles pour debug
  console.log('📧 [createEmailTransport] Variables email disponibles:');
  console.log('📧 [createEmailTransport] - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'OUI (masqué)' : 'NON');
  console.log('📧 [createEmailTransport] - SMTP_HOST:', process.env.SMTP_HOST ? 'OUI' : 'NON');
  console.log('📧 [createEmailTransport] - GMAIL_USER:', process.env.GMAIL_USER ? 'OUI (masqué)' : 'NON');
  console.log('📧 [createEmailTransport] - GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'OUI (masqué)' : 'NON');
  
  // Support pour SendGrid (PRIORITÉ - plus fiable depuis Render)
  if (process.env.SENDGRID_API_KEY) {
    console.log('📧 [createEmailTransport] ✅ Utilisation de SendGrid (prioritaire)');
    console.log('📧 [createEmailTransport] SENDGRID_API_KEY présent:', process.env.SENDGRID_API_KEY ? 'Oui (masqué)' : 'Non');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });
  }

  // Support pour SMTP standard
  if (process.env.SMTP_HOST) {
    console.log('📧 [createEmailTransport] ⚠️ Utilisation de SMTP standard (SendGrid non disponible)');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });
  }

  // Support pour Gmail (OAuth2 ou app password) - Dernier recours
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('📧 [createEmailTransport] ⚠️ Utilisation de Gmail (SendGrid non disponible - peut être bloqué depuis Render)');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      // Timeouts réduits pour éviter les blocages
      connectionTimeout: 10000, // 10 secondes
      greetingTimeout: 5000, // 5 secondes
      socketTimeout: 10000, // 10 secondes
      // Pas de pooling pour éviter les connexions persistantes qui timeout
      pool: false,
    });
  }

  // Mode développement : console.log seulement
  console.log('📧 [createEmailTransport] ⚠️ Mode développement - aucun transport email configuré');
  return {
    sendMail: async (options) => {
      console.log('📧 EMAIL (dev mode):', {
        to: options.to,
        subject: options.subject,
        attachments: options.attachments?.map(a => a.filename) || [],
      });
      return { messageId: 'dev-mode-' + Date.now() };
    },
  };
}

/**
 * Générer le résumé HTML pour l'email
 */
function generateEmailSummary(summary, results, locationName, dryRun, shopDomain) {
  const successRate = summary.total > 0 
    ? Math.round((summary.success / summary.total) * 100) 
    : 0;

  const statusColors = {
    success: '#28a745',
    failed: '#dc3545',
    skipped: '#ffc107',
    warning: '#fd7e14',
  };

  const statusBadges = {
    success: summary.success,
    failed: summary.failed,
    skipped: summary.skipped,
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .summary-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stats { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
    .stat { flex: 1; min-width: 120px; text-align: center; padding: 15px; background: white; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; margin: 5px 0; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-success { background: ${statusColors.success}; color: white; }
    .badge-failed { background: ${statusColors.failed}; color: white; }
    .badge-skipped { background: ${statusColors.skipped}; color: #333; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-label { font-weight: 600; color: #555; }
    .info-value { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📦 Stock Update Report</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">CSV Dan - Inventory Update Summary</p>
    </div>
    
    <div class="content">
      <div class="summary-box">
        <h2 style="margin-top: 0;">Summary</h2>
        <div class="info-row">
          <span class="info-label">Shop:</span>
          <span class="info-value">${shopDomain}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Location:</span>
          <span class="info-value">${locationName || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mode:</span>
          <span class="info-value">${dryRun ? '🔍 Dry-run (No changes made)' : '✅ Production (Changes applied)'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</span>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-value" style="color: ${statusColors.success};">${summary.success}</div>
          <div class="stat-label">✅ Successful</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: ${statusColors.failed};">${summary.failed}</div>
          <div class="stat-label">❌ Failed</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: ${statusColors.skipped};">${summary.skipped}</div>
          <div class="stat-label">⚠️ Skipped</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #333;">${summary.total}</div>
          <div class="stat-label">📊 Total</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: ${successRate >= 80 ? statusColors.success : statusColors.warning};">${successRate}%</div>
          <div class="stat-label">📈 Success Rate</div>
        </div>
      </div>

      ${summary.failed > 0 || summary.skipped > 0 ? `
      <div class="summary-box" style="margin-top: 20px;">
        <h3 style="margin-top: 0;">⚠️ Issues Detected</h3>
        <p>Some variants could not be updated. Please check the attached results CSV for details.</p>
        ${summary.failed > 0 ? `<span class="badge badge-failed">${summary.failed} Failed</span> ` : ''}
        ${summary.skipped > 0 ? `<span class="badge badge-skipped">${summary.skipped} Skipped</span> ` : ''}
      </div>
      ` : ''}

      <div class="summary-box" style="margin-top: 20px;">
        <h3 style="margin-top: 0;">📎 Attachments</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li><strong>input.csv</strong> - Original CSV file uploaded</li>
          <li><strong>results.csv</strong> - Detailed results with status for each variant</li>
        </ul>
      </div>

      <div class="footer">
        <p>Generated by CSV Dan - Shopify Inventory Update Tool</p>
        <p>This is an automated email. Please do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Envoyer un email avec les résultats
 */
/**
 * Envoyer un email avec les résultats (asynchrone, ne bloque pas)
 */
export async function sendResultsEmail({
  to,
  shopDomain,
  locationName,
  summary,
  results,
  inputCSV,
  inputFileName,
  dryRun,
}) {
  console.log('📧 [sendResultsEmail] Fonction appelée');
  console.log('📧 [sendResultsEmail] Paramètres:', {
    to,
    shopDomain,
    locationName,
    summaryTotal: summary?.total,
    resultsCount: results?.length,
    inputCSVLength: inputCSV?.length,
    inputFileName,
    dryRun,
  });
  
  // Fonction interne pour envoyer l'email avec timeout
  const sendEmailWithTimeout = async () => {
    console.log('📧 [sendEmailWithTimeout] Début de l\'envoi');
    console.log('📧 [sendEmailWithTimeout] Création du transport email...');
    const transporter = createEmailTransport();
    console.log('📧 [sendEmailWithTimeout] Transport créé');

    // Générer le CSV de résultats
    const resultsCSV = generateResultsCSV(results);

    // Préparer les pièces jointes
    const attachments = [
      {
        filename: inputFileName || 'input.csv',
        content: inputCSV,
      },
      {
        filename: `results_${new Date().toISOString().split('T')[0]}.csv`,
        content: resultsCSV,
      },
    ];

    // Générer le résumé HTML
    console.log('📧 [sendEmailWithTimeout] Génération du résumé HTML...');
    const html = generateEmailSummary(summary, results, locationName, dryRun, shopDomain);
    console.log('📧 [sendEmailWithTimeout] Résumé HTML généré, longueur:', html.length);

    // Timeout de 15 secondes pour l'envoi
    console.log('📧 [sendEmailWithTimeout] Préparation de l\'envoi SMTP...');
    console.log('📧 [sendEmailWithTimeout] From:', process.env.EMAIL_FROM || `CSV Dan <noreply@${shopDomain || 'shopify.com'}>`);
    console.log('📧 [sendEmailWithTimeout] To:', to);
    console.log('📧 [sendEmailWithTimeout] CC: zenso.ecom@gmail.com');
    console.log('📧 [sendEmailWithTimeout] Attachments:', attachments.length);
    
    const sendPromise = transporter.sendMail({
      from: process.env.EMAIL_FROM || `CSV Dan <noreply@${shopDomain || 'shopify.com'}>`,
      to: to,
      cc: 'zenso.ecom@gmail.com',
      subject: `${dryRun ? '[DRY-RUN] ' : ''}Stock Update Complete - ${summary.success}/${summary.total} successful`,
      html: html,
      text: generateTextSummary(summary, locationName, dryRun, shopDomain),
      attachments: attachments,
    });
    
    console.log('📧 [sendEmailWithTimeout] Promesse sendMail créée, en attente...');

    // Timeout après 30 secondes (SendGrid peut prendre plus de temps)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error('⏱️ [sendEmailWithTimeout] TIMEOUT après 30 secondes');
        reject(new Error('Email send timeout after 30s'));
      }, 30000);
    });

    console.log('📧 [sendEmailWithTimeout] Lancement de Promise.race...');
    const result = await Promise.race([sendPromise, timeoutPromise]);
    console.log('📧 [sendEmailWithTimeout] Promise résolue:', result);
    return result;
  };

  // Exécuter de manière asynchrone (fire and forget)
  // Ne pas bloquer la réponse HTTP
  console.log('📧 [sendResultsEmail] Démarrage de sendEmailWithTimeout...');
  sendEmailWithTimeout()
    .then((info) => {
      console.log('✅ [EMAIL] Email envoyé avec succès:', info.messageId);
      console.log('✅ [EMAIL] Email envoyé à:', to);
      console.log('✅ [EMAIL] Email CC: zenso.ecom@gmail.com');
    })
    .catch((error) => {
      // Logger avec plus de détails pour le debugging
      console.error('❌ [EMAIL] ERREUR EMAIL (non-bloquant):');
      console.error('❌ [EMAIL]    - Destinataire:', to);
      console.error('❌ [EMAIL]    - Erreur:', error.message);
      console.error('❌ [EMAIL]    - Code:', error.code);
      console.error('❌ [EMAIL]    - Command:', error.command);
      console.error('❌ [EMAIL]    - Stack:', error.stack);
      
      // Si c'est un timeout ou connexion refusée, suggérer SendGrid
      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.error('💡 [EMAIL] SUGGESTION: Gmail bloque probablement les connexions depuis Render.');
        console.error('💡 [EMAIL] Utilisez SendGrid à la place: ajoutez SENDGRID_API_KEY dans les variables d\'environnement.');
      }
    });

  // Retourner immédiatement sans attendre
  console.log('📧 [sendResultsEmail] Retour immédiat (queued)');
  return { success: true, messageId: 'queued' };
}

/**
 * Générer le CSV de résultats
 */
function generateResultsCSV(results) {
  const headers = ['variant_id', 'count', 'status', 'message'];
  const csvRows = [
    headers.join(','),
    ...results.map(r => [
      r.variant_id,
      r.count,
      r.status,
      `"${(r.message || '').replace(/"/g, '""')}"`
    ].join(','))
  ];
  return csvRows.join('\n');
}

/**
 * Générer le résumé texte (pour clients email qui ne supportent pas HTML)
 */
function generateTextSummary(summary, locationName, dryRun, shopDomain) {
  return `
Stock Update Report - CSV Dan
==============================

Shop: ${shopDomain}
Location: ${locationName || 'N/A'}
Mode: ${dryRun ? 'Dry-run (No changes made)' : 'Production (Changes applied)'}
Date: ${new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}

Summary:
--------
✅ Successful: ${summary.success}
❌ Failed: ${summary.failed}
⚠️ Skipped: ${summary.skipped}
📊 Total: ${summary.total}
📈 Success Rate: ${summary.total > 0 ? Math.round((summary.success / summary.total) * 100) : 0}%

Attachments:
- input.csv: Original CSV file uploaded
- results.csv: Detailed results with status for each variant

---
Generated by CSV Dan - Shopify Inventory Update Tool
  `.trim();
}

/**
 * Récupérer l'email du propriétaire de la boutique via l'API Shopify
 */
export async function getShopOwnerEmail(admin) {
  try {
    const response = await admin.graphql(
      `#graphql
        query {
          shop {
            email
            contactEmail
          }
        }`
    );

    const responseJson = await response.json();
    return responseJson.data?.shop?.email || responseJson.data?.shop?.contactEmail || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email:', error);
    return null;
  }
}

