import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Page, Card, Select, Checkbox, BlockStack, Text } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({});
}

export default function Settings() {
  return (
    <Page title="Settings">
      <Card>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h2">
            Order Creation
          </Text>
          <Select
            label="Create method"
            options={[
              { label: 'Draft Order (recommended)', value: 'draft' },
              { label: 'Order', value: 'order' }
            ]}
            value="draft"
          />
          <Checkbox label="Auto-complete draft order" checked={false} />
          <Text variant="headingSm" as="h3">
            Notifications
          </Text>
          <Checkbox label="Send email to admin" checked={false} />
        </BlockStack>
      </Card>
    </Page>
  );
}
