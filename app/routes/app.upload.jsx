import { Page, Card, Button, Text, Select, InlineStack, BlockStack, Checkbox, Banner, ProgressBar, Spinner } from '@shopify/polaris';
import { useState, useEffect } from 'react';
import { useLoaderData, useFetcher } from 'react-router';
import { authenticate } from '../shopify.server';
import { sendResultsEmail, getShopOwnerEmail } from '../utils/email.server';

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Récupérer les locations
  const response = await admin.graphql(
    `#graphql
      query {
        locations(first: 50) {
          edges {
            node {
              id
              name
            }
          }
        }
      }`
  );
  
  const responseJson = await response.json();
  const locations = responseJson.data?.locations?.edges?.map(edge => ({
    id: edge.node.id,
    name: edge.node.name
  })) || [];
  
  return { locations };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const file = formData.get('file');
  const dryRun = formData.get('dryRun') === 'true';
  const locationId = formData.get('locationId');
  const sendEmail = formData.get('sendEmail') === 'true';

  if (!file || !locationId) {
    return {
      error: 'CSV file and location are required',
    };
  }

  // Validation de la taille (10 MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      error: `File too large (max ${maxSize / 1024 / 1024} MB)`,
    };
  }

  try {
    // Sauvegarder le CSV original pour l'email
    const originalCSV = await file.text();
    const inputFileName = file.name || 'input.csv';
    
    // Parser le CSV
    const text = originalCSV;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return { error: 'CSV file is empty' };
    }

    // Vérifier le header
    const header = lines[0].toLowerCase();
    if (header !== 'variant_id') {
      return { error: `Invalid header. Expected: "variant_id", received: "${lines[0]}"` };
    }

    // Extraire les variant_ids (ignorer les lignes vides et non-numériques)
    const variantIds = [];
    for (let i = 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed && /^\d+$/.test(trimmed)) {
        variantIds.push(trimmed);
      }
    }

    if (variantIds.length === 0) {
      return { error: 'No valid variant_id found in CSV' };
    }

    // Compter les occurrences de chaque variant_id
    const variantCounts = {};
    for (const vid of variantIds) {
      variantCounts[vid] = (variantCounts[vid] || 0) + 1;
    }

    const uniqueVariants = Object.keys(variantCounts);
    
    // Récupérer le nom de la location pour l'email
    let locationName = 'Unknown';
    try {
      const locationResponse = await admin.graphql(
        `#graphql
          query getLocation($id: ID!) {
            location(id: $id) {
              name
            }
          }`,
        {
          variables: { id: locationId },
        }
      );
      const locationJson = await locationResponse.json();
      locationName = locationJson.data?.location?.name || 'Unknown';
    } catch (e) {
      console.error('Error fetching location name:', e);
    }
    
    // Récupérer les informations des variants par batch
    const batchSize = 50;
    const variantMap = {}; // variant_id -> { inventory_item_id, tracked, current_quantity }
    const results = [];

    for (let i = 0; i < uniqueVariants.length; i += batchSize) {
      const batch = uniqueVariants.slice(i, i + batchSize);

      const response = await admin.graphql(
        `#graphql
          query getVariants($ids: [ID!]!, $locationId: ID!) {
            nodes(ids: $ids) {
              ... on ProductVariant {
                id
                inventoryItem {
                  id
                  tracked
                  inventoryLevel(locationId: $locationId) {
                    quantities(names: "available") {
                      quantity
                    }
                  }
                }
              }
            }
          }`,
        {
          variables: {
            ids: batch.map(id => `gid://shopify/ProductVariant/${id}`),
            locationId: locationId,
          },
        }
      );

      const responseJson = await response.json();
      const nodes = responseJson.data?.nodes || [];

      for (const node of nodes) {
        if (!node) continue;
        const variantGid = node.id;
        const variantId = variantGid.split('/').pop();
        const inventoryItem = node.inventoryItem;
        
        const inventoryLevel = inventoryItem?.inventoryLevel;
        const availableQuantity = inventoryLevel?.quantities?.find(q => q.name === 'available')?.quantity || 0;
        
        variantMap[variantId] = {
          inventory_item_id: inventoryItem?.id,
          tracked: inventoryItem?.tracked || false,
          current_quantity: availableQuantity,
          hasInventoryLevel: !!inventoryLevel,
        };
      }

      // Marquer comme "not_found" les variants qui n'ont pas été retournés
      for (const vid of batch) {
        if (!variantMap[vid]) {
          variantMap[vid] = {
            status: 'not_found',
            message: 'Variant ID not found in Shopify',
          };
        }
      }
    }

    // Traiter chaque variant et mettre à jour le stock
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let variantsToUpdate = []; // Pour stocker les variants valides à mettre à jour en batch

    for (const variantId of uniqueVariants) {
      const targetQuantity = variantCounts[variantId];
      const variantInfo = variantMap[variantId];

      if (variantInfo.status === 'not_found') {
        results.push({
          variant_id: variantId,
          count: targetQuantity,
          status: 'not_found',
          message: variantInfo.message,
        });
        failedCount++;
        continue;
      }

      if (!variantInfo.tracked) {
        results.push({
          variant_id: variantId,
          count: targetQuantity,
          status: 'skipped_not_tracked',
          message: 'Inventory tracking is not enabled for this variant',
        });
        skippedCount++;
        continue;
      }

      const inventoryItemId = variantInfo.inventory_item_id;
      if (!inventoryItemId) {
        results.push({
          variant_id: variantId,
          count: targetQuantity,
          status: 'failed',
          message: 'Could not retrieve inventory_item_id',
        });
        failedCount++;
        continue;
      }

      // Vérifier si l'inventory level existe à cette location
      if (!variantInfo.hasInventoryLevel) {
        results.push({
          variant_id: variantId,
          count: targetQuantity,
          status: 'no_inventory_level',
          message: 'No inventory level at this location. The variant must be connected to the location.',
        });
        failedCount++;
        continue;
      }

      // Si dry-run, juste logger sans modifier
      if (dryRun) {
        // Pour le dry-run, on accumule les résultats directement
        results.push({
          variant_id: variantId,
          count: targetQuantity,
          status: 'dry_run',
          message: `Would be updated from ${variantInfo.current_quantity} to ${targetQuantity}`,
        });
        successCount++;
      } else {
        // Stocker pour traitement batch après la boucle
        variantsToUpdate.push({
          variant_id: variantId,
          inventory_item_id: inventoryItemId,
          target_quantity: targetQuantity,
          current_quantity: variantInfo.current_quantity,
        });
      }
    }

    // Traitement batch des mises à jour (seulement si pas dry-run)
    if (!dryRun && variantsToUpdate && variantsToUpdate.length > 0) {
      const updateBatchSize = 10; // Shopify recommande ~10 par mutation pour inventorySetOnHandQuantities
      const delayBetweenBatches = 500; // 500ms entre les batches

      for (let i = 0; i < variantsToUpdate.length; i += updateBatchSize) {
        const batch = variantsToUpdate.slice(i, i + updateBatchSize);
        
        try {
          // Créer une mutation batch avec plusieurs setQuantities
          const setQuantities = batch.map(v => ({
            inventoryItemId: v.inventory_item_id,
            locationId: locationId,
            quantity: v.target_quantity,
          }));

          const setResponse = await admin.graphql(
            `#graphql
              mutation inventorySetOnHandQuantities($input: InventorySetOnHandQuantitiesInput!) {
                inventorySetOnHandQuantities(input: $input) {
                  userErrors {
                    field
                    message
                  }
                }
              }`,
            {
              variables: {
                input: {
                  reason: 'correction',
                  setQuantities: setQuantities,
                },
              },
            }
          );

          const setResponseJson = await setResponse.json();
          const errors = setResponseJson.data?.inventorySetOnHandQuantities?.userErrors || [];

          // Traiter les résultats du batch
          if (errors.length > 0) {
            // Si erreur globale, marquer tout le batch comme failed
            for (const variant of batch) {
              results.push({
                variant_id: variant.variant_id,
                count: variant.target_quantity,
                status: 'failed',
                message: errors.map(e => e.message).join('; '),
              });
              failedCount++;
            }
          } else {
            // Succès pour le batch
            for (const variant of batch) {
              results.push({
                variant_id: variant.variant_id,
                count: variant.target_quantity,
                status: 'success',
                message: `Stock updated from ${variant.current_quantity} to ${variant.target_quantity}`,
              });
              successCount++;
            }
          }

          // Délai entre les batches pour respecter les rate limits
          if (i + updateBatchSize < variantsToUpdate.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        } catch (error) {
          // En cas d'erreur réseau ou rate limit (429)
          const isRateLimit = error.response?.status === 429 || 
                             error.message?.includes('429') ||
                             error.message?.includes('rate limit') ||
                             error.message?.includes('Rate limit');
          
          const errorMessage = isRateLimit 
            ? 'Rate limit reached - please try again later'
            : (error.message || 'Error updating stock');

          for (const variant of batch) {
            results.push({
              variant_id: variant.variant_id,
              count: variant.target_quantity,
              status: 'failed',
              message: errorMessage,
            });
            failedCount++;
          }

          // Si rate limit, attendre plus longtemps avant de continuer (2 secondes)
          if (isRateLimit && i + updateBatchSize < variantsToUpdate.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    }

    const summary = {
      total: uniqueVariants.length,
      success: successCount,
      failed: failedCount,
      skipped: skippedCount,
    };

    // Envoyer l'email si demandé (asynchrone, ne bloque PAS - fire and forget)
    if (sendEmail) {
      // Ne PAS utiliser await - exécuter en arrière-plan
      (async () => {
        try {
          // Récupérer l'email du propriétaire
          const ownerEmail = await getShopOwnerEmail(admin);
          const recipientEmail = ownerEmail || (session?.shop ? session.shop.replace('.myshopify.com', '') + '@shopify.com' : null);

          if (recipientEmail) {
            // L'envoi se fait en arrière-plan, ne bloque pas la réponse HTTP
            sendResultsEmail({
              to: recipientEmail,
              shopDomain: session?.shop || 'Unknown',
              locationName: locationName,
              summary: summary,
              results: results,
              inputCSV: originalCSV,
              inputFileName: inputFileName,
              dryRun: dryRun,
            }).catch((emailError) => {
              console.error('Error sending email (background):', emailError);
            });
          }
        } catch (emailError) {
          console.error('Error initiating email send (background):', emailError);
        }
      })(); // IIFE - Immediate Invoked Function Expression
    }

    return {
      summary,
      results,
      dryRun,
      emailSent: sendEmail ? 'queued' : false, // Indique que l'email est en queue
      emailError: null, // Ne plus afficher d'erreur car on ne sait pas encore si ça a réussi
    };
  } catch (error) {
    console.error('Error processing CSV:', error);
    return {
      error: `Processing error: ${error.message}`,
    };
  }
};

export default function UploadPage() {
  const { locations } = useLoaderData();
  const fetcher = useFetcher();
  const [file, setFile] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [locationId, setLocationId] = useState(locations[0]?.id || '');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';
  const hasResults = fetcher.data?.summary;
  const actionError = fetcher.data?.error;

  // Simuler la progression pendant le traitement
  useEffect(() => {
    if (isLoading && !hasResults && !actionError) {
      setProgress(0);
      setProcessingStep('Uploading CSV file...');
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // S'arrêter à 90% jusqu'à ce que le job soit terminé
          return prev + 5;
        });
      }, 500);

      // Changer les étapes de traitement
      const stepInterval = setInterval(() => {
        setProcessingStep((prev) => {
          const steps = [
            'Uploading CSV file...',
            'Parsing and validating data...',
            'Fetching variant information...',
            'Processing inventory updates...',
            'Finalizing results...'
          ];
          const currentIndex = steps.indexOf(prev);
          return steps[Math.min(currentIndex + 1, steps.length - 1)] || steps[0];
        });
      }, 2000);

      return () => {
        clearInterval(interval);
        clearInterval(stepInterval);
      };
    }
  }, [isLoading, hasResults, actionError]);

  useEffect(() => {
    if (locations.length > 0 && !locationId) {
      setLocationId(locations[0].id);
    }
  }, [locations, locationId]);

  useEffect(() => {
    if (actionError) {
      setError(actionError);
    }
  }, [actionError]);

  const downloadTemplateCSV = () => {
    // Template CSV avec exemple
    const templateCSV = `variant_id
39928617369774
39928617369774
42655464259824
47396585505115
42118288212208
42655464259824
42655464259824`;

    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'csv_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadResultsCSV = () => {
    if (!fetcher.data?.results) return;
    
    const headers = ['variant_id', 'count', 'status', 'message'];
    const csvRows = [
      headers.join(','),
      ...fetcher.data.results.map(r => [
        r.variant_id,
        r.count,
        r.status,
        `"${(r.message || '').replace(/"/g, '""')}"`
      ].join(','))
    ];
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `results_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    if (!file || !locationId) {
      setError('Please select a CSV file and a location');
      return;
    }

    // Vérifier si un job est déjà en cours
    if (isProcessing) {
      setError('A job is already in progress. Please wait for it to complete before uploading another file.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Starting upload...');
    
    const form = new FormData();
    form.append('file', file);
    form.append('dryRun', String(dryRun));
    form.append('sendEmail', String(sendEmail));
    form.append('locationId', locationId);
    
    fetcher.submit(form, {
      method: 'POST',
      action: '/app/upload',
      encType: 'multipart/form-data',
    });
  };

  // Réinitialiser isProcessing quand le job est terminé ou en cas d'erreur
  useEffect(() => {
    if (!isLoading) {
      if (hasResults) {
        setIsProcessing(false);
        setProgress(100);
        setTimeout(() => {
          setProgress(0);
          setProcessingStep('');
        }, 1000);
      } else if (actionError) {
        // En cas d'erreur, réinitialiser aussi
        setIsProcessing(false);
        setProgress(0);
        setProcessingStep('');
      }
    }
  }, [isLoading, hasResults, actionError]);

  const locationOptions = locations.map(l => ({ 
    label: l.name, 
    value: l.id 
  }));

  return (
    <Page 
      title="CSV Dan — Stock Update"
      secondaryActions={[
        {
          content: 'Download Template',
          onAction: downloadTemplateCSV,
          helpText: 'Download a CSV template with example data'
        }
      ]}
    >
      <BlockStack gap="500">
        {error && (
          <Banner status="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        {/* Job queue status - Afficher si un job est en cours */}
        {isProcessing && (
          <Banner status="info" title="Processing in progress">
            <BlockStack gap="300">
              <Text as="p">
                A file is currently being processed. Please wait for it to complete before uploading another file.
              </Text>
              {processingStep && (
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    {processingStep}
                  </Text>
                  <ProgressBar progress={progress} size="small" />
                </BlockStack>
              )}
            </BlockStack>
          </Banner>
        )}

        {/* Progress indicator pendant le traitement */}
        {isLoading && !hasResults && (
          <Card>
            <BlockStack gap="400">
              <Text as="p" variant="bodyMd" fontWeight="semibold">
                Processing your CSV file
              </Text>
              {processingStep && (
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    {processingStep}
                  </Text>
                  <ProgressBar progress={progress} size="small" />
                  <InlineStack gap="200" align="center">
                    <Spinner size="small" />
                    <Text as="span" variant="bodySm" tone="subdued">
                      This may take a few moments for large files...
                    </Text>
                  </InlineStack>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        )}
        
        {hasResults && (
          <Card>
            <BlockStack gap="400">
              <Banner 
                status={fetcher.data.summary.success === fetcher.data.summary.total ? "success" : "warning"}
                title={fetcher.data.summary.success === fetcher.data.summary.total ? "Success!" : "Completed with errors"}
              >
                <BlockStack gap="200">
                  <Text as="p">
                    {fetcher.data.summary.total} variants processed: {fetcher.data.summary.success} successful, {fetcher.data.summary.failed} failed, {fetcher.data.summary.skipped} skipped
                    {fetcher.data.dryRun && ' (Dry-run mode - no changes made)'}
                  </Text>
                  
                  {/* Afficher les erreurs détaillées */}
                  {fetcher.data.results && fetcher.data.results.filter(r => r.status === 'failed' || r.status === 'not_found' || r.status === 'no_inventory_level').length > 0 && (
                    <BlockStack gap="100">
                      <Text as="p" fontWeight="semibold">Errors:</Text>
                      {fetcher.data.results
                        .filter(r => r.status === 'failed' || r.status === 'not_found' || r.status === 'no_inventory_level')
                        .slice(0, 5) // Limiter à 5 erreurs pour ne pas surcharger
                        .map((r, idx) => (
                          <Text key={idx} as="p" variant="bodySm">
                            • Variant {r.variant_id}: {r.message}
                          </Text>
                        ))}
                      {fetcher.data.results.filter(r => r.status === 'failed' || r.status === 'not_found' || r.status === 'no_inventory_level').length > 5 && (
                        <Text as="p" variant="bodySm" tone="subdued">
                          ... and {fetcher.data.results.filter(r => r.status === 'failed' || r.status === 'not_found' || r.status === 'no_inventory_level').length - 5} more errors. Check the results CSV for details.
                        </Text>
                      )}
                    </BlockStack>
                  )}
                  
                  {fetcher.data.emailSent && fetcher.data.emailSent !== false && (
                    <Text as="p" tone="success">
                      ✓ Email queued for sending (check your inbox in a few moments)
                    </Text>
                  )}
                </BlockStack>
              </Banner>
              <Button onClick={downloadResultsCSV}>
                Download Results CSV
              </Button>
            </BlockStack>
          </Card>
        )}

      <Card>
        <BlockStack gap="400">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              Required CSV Format
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Single column header "variant_id". Each row represents one physical unit. 
              Duplicates determine the target quantity for each variant.
            </Text>
            
            <BlockStack gap="300">
              <label>
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  CSV File
                </Text>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={isLoading}
                  style={{ marginTop: '8px', display: 'block' }}
                />
                {file && (
                  <Text as="p" variant="bodySm" tone="subdued" style={{ marginTop: '4px' }}>
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Text>
                )}
              </label>

              <InlineStack gap="400" align="start">
                <div style={{ flex: 1 }}>
            <Select
              label="Location"
                    options={locationOptions}
              onChange={setLocationId}
              value={locationId}
                    disabled={isLoading || locations.length === 0}
                  />
                </div>
              </InlineStack>

              <BlockStack gap="200">
                <Checkbox
                  label="Dry-run (no changes)"
                  checked={dryRun}
                  onChange={setDryRun}
                  disabled={isLoading}
                />
                <Checkbox
                  label="Send email with results (input CSV + results CSV)"
                  checked={sendEmail}
                  onChange={setSendEmail}
                  disabled={isLoading}
                  helpText="An email will be sent to the store owner with both CSV files attached and a summary"
                />
              </BlockStack>
            </BlockStack>

            <Button 
              primary 
              onClick={handleUpload}
              loading={isLoading}
              disabled={!file || !locationId || isLoading || isProcessing}
            >
              {dryRun ? 'Preview' : 'Update Stock'}
            </Button>
            
            {isProcessing && !isLoading && (
              <Text as="p" variant="bodySm" tone="subdued">
                ⚠ Another job is in progress. Please wait before uploading a new file.
              </Text>
            )}
        </BlockStack>
      </Card>
      </BlockStack>
    </Page>
  );
}

