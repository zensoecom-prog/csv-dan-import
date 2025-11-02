import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  return (
    <s-page heading="CSV Dan -Stock Update Tool">
      <s-button slot="primary-action" href="/app/upload">
        Go to Upload Page
      </s-button>

      <s-section heading="Welcome to CSV Dan 📦">
        <s-paragraph>
          CSV Dan is a powerful tool for updating inventory levels in your Shopify store by uploading a simple CSV file. 
          Set stock quantities quickly and reliably across all your product variants.
        </s-paragraph>
      </s-section>

      <s-section heading="How It Works">
        <s-paragraph>
          The application allows you to update inventory levels by uploading a CSV file containing variant IDs. 
          Each row in the CSV represents one physical unit, and duplicates determine the target quantity for each variant.
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            <strong>Upload your CSV</strong> - A single column file with variant IDs
          </s-list-item>
          <s-list-item>
            <strong>Select a location</strong> - Choose which Shopify location to update
          </s-list-item>
          <s-list-item>
            <strong>Preview changes</strong> - Use dry-run mode to see what would change
          </s-list-item>
          <s-list-item>
            <strong>Update stock</strong> - Apply changes and receive detailed results
          </s-list-item>
          <s-list-item>
            <strong>Get email report</strong> - Optional email with CSV attachments and summary
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section heading="CSV Format Requirements">
        <s-paragraph>
          Your CSV file must follow a specific format to ensure accurate stock updates:
        </s-paragraph>
        
        <s-box
          padding="base"
          borderWidth="base"
          borderRadius="base"
          background="subdued"
        >
          <s-heading size="small">Required Header</s-heading>
          <s-paragraph>
            The first row must contain exactly: <code>variant_id</code> (lowercase, no spaces)
          </s-paragraph>
          
          <s-heading size="small">Data Format</s-heading>
          <s-paragraph>
            Each subsequent row contains a single variant ID (numeric only). Example:
          </s-paragraph>
          <pre style={{ margin: "10px 0", padding: "10px", background: "#f5f5f5", borderRadius: "4px", overflow: "auto" }}>
{`variant_id
39928617369774
39928617369774
42655464259824
47396585505115
42118288212208
42655464259824
42655464259824`}
          </pre>
          
          <s-paragraph>
            <strong>Result:</strong> This CSV would set variant 39928617369774 to 2 units, 
            variant 42655464259824 to 3 units, and so on.
          </s-paragraph>
        </s-box>

        <s-heading size="medium">Important Rules</s-heading>
        <s-unordered-list>
          <s-list-item>
            ✅ Header must be exactly <code>variant_id</code>
          </s-list-item>
          <s-list-item>
            ✅ Each row = 1 physical unit (duplicates count toward quantity)
          </s-list-item>
          <s-list-item>
            ✅ Variant IDs must be numeric only
          </s-list-item>
          <s-list-item>
            ✅ File size limit: 10 MB maximum
          </s-list-item>
          <s-list-item>
            ✅ UTF-8 encoding recommended
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section heading="Key Features">
        <s-stack direction="block" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading size="small">🔍 Dry-Run Mode</s-heading>
            <s-paragraph>
              Test your CSV before making actual changes. Preview what would be updated without modifying your inventory.
            </s-paragraph>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading size="small">📍 Location-Aware</s-heading>
            <s-paragraph>
              Update stock at specific Shopify locations. Perfect for multi-location stores.
            </s-paragraph>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading size="small">📊 Detailed Reporting</s-heading>
            <s-paragraph>
              Get comprehensive results with status for each variant: success, failed, not found, skipped, etc.
            </s-paragraph>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading size="small">📧 Email Reports</s-heading>
            <s-paragraph>
              Optionally receive an email with your input CSV, results CSV, and a visual summary of changes.
            </s-paragraph>
          </s-box>

          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-heading size="small">⚡ Batch Processing</s-heading>
            <s-paragraph>
              Efficiently processes large files with automatic batching and rate limit management.
            </s-paragraph>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Getting Started">
        <s-paragraph>
          Ready to update your inventory? Click the button above or navigate to the{" "}
          <s-link href="/app/upload">CSV Stock Update</s-link> page.
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            Prepare your CSV file with the <code>variant_id</code> header
          </s-list-item>
          <s-list-item>
            List each variant ID once per unit you want in stock
          </s-list-item>
          <s-list-item>
            Upload your file and select the target location
          </s-list-item>
          <s-list-item>
            Use dry-run first to verify everything looks correct
          </s-list-item>
          <s-list-item>
            Apply changes and download the results CSV
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Quick Tips">
        <s-unordered-list>
          <s-list-item>
            <strong>Variant IDs:</strong> Found in your product URLs or exported product data
          </s-list-item>
          <s-list-item>
            <strong>Absolute Set:</strong> The CSV sets exact quantities, not increments
          </s-list-item>
          <s-list-item>
            <strong>Missing Variants:</strong> Variants not in the CSV remain unchanged
          </s-list-item>
          <s-list-item>
            <strong>Tracking Required:</strong> Only variants with inventory tracking enabled will be updated
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Need Help?">
        <s-paragraph>
          If you encounter any issues or have questions:
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            Check the results CSV for detailed error messages
          </s-list-item>
          <s-list-item>
            Verify your CSV format matches the requirements
          </s-list-item>
          <s-list-item>
            Ensure variant IDs exist in your store
          </s-list-item>
          <s-list-item>
            Make sure inventory tracking is enabled for your variants
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
