import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { Page, Card, TextField, Button, BlockStack, Text } from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import { createForm } from '../models/form.server';
import { formSchema } from '../utils/validation';


const defaultSettings = {
  defaultLanguage: 'ar',
  tokens: {
    radius: 14,
    spacing: 12,
    accent: '#F58220'
  },
  shipping: {
    enableExpress: true,
    standard: { name: 'Standard', days: '5-7', price: 400 },
    express: { name: 'Express', days: '2-3', price: 700 }
  },
  discount: { enabled: false, amount: 0 },
  submitBehavior: { method: 'draft', autoComplete: false },
  successMessage: {
    ar: 'تم إرسال الطلب بنجاح. سنتصل بك للتأكيد.',
    fr: 'Commande envoyée. Nous vous contacterons pour confirmer.'
  },
  rtl: true,
  mapping: { products: [], collections: [] },
  requiredFields: {
    name: true,
    phone: true,
    wilaya: true,
    baladiya: true,
    address: true
  }
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const name = String(formData.get('name') || 'COD Form');
  const slug = String(
    formData.get('slug') || name.toLowerCase().replace(/\s+/g, '-')
  );
  const parsed = formSchema.safeParse({
    name,
    slug,
    isActive: true,
    settings: defaultSettings
  });
  if (!parsed.success) {
    return json({ error: parsed.error.message }, { status: 400 });
  }
  const form = await createForm(session.shop, parsed.data);
  return redirect(`/app/forms/${form.id}`);
}

export default function NewForm() {
  const actionData = useActionData<typeof action>();
  return (
    <Page title="Create Form">
      <Card>
        <Form method="post">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              One-click setup
            </Text>
            <TextField
              name="name"
              label="Form name"
              autoComplete="off"
              defaultValue="Algeria COD"
            />
            <TextField
              name="slug"
              label="Slug"
              autoComplete="off"
              defaultValue="algeria-cod"
            />
            {actionData?.error && (
              <Text tone="critical">{actionData.error}</Text>
            )}
            <Button submit variant="primary">
              Create form
            </Button>
          </BlockStack>
        </Form>
      </Card>
    </Page>
  );
}

