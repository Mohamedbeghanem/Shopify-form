import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Checkbox,
  Select,
  Button,
  BlockStack
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getForm, updateForm } from '~/models/form.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form = await getForm(session.shop, params.id || '');
  if (!form) return redirect('/app/forms');
  return json({ form });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const form = await getForm(session.shop, params.id || '');
  if (!form) return redirect('/app/forms');

  const current = form.settings as any;
  const data = await request.formData();
  const settings = {
    ...current,
    defaultLanguage: String(data.get('defaultLanguage') || 'ar'),
    tokens: {
      ...current.tokens,
      radius: Number(data.get('radius') || current.tokens.radius || 14),
      spacing: Number(data.get('spacing') || current.tokens.spacing || 12),
      accent: String(data.get('accent') || current.tokens.accent || '#F58220')
    },
    shipping: {
      enableExpress: data.get('enableExpress') === 'on',
      standard: {
        ...current.shipping.standard,
        price: Number(data.get('standardPrice') || 0)
      },
      express: {
        ...current.shipping.express,
        price: Number(data.get('expressPrice') || 0)
      }
    },
    discount: {
      enabled: data.get('discountEnabled') === 'on',
      amount: Number(data.get('discountAmount') || 0)
    },
    rtl: data.get('rtl') === 'on',
    successMessage: {
      ar: String(data.get('successAr') || current.successMessage?.ar || ''),
      fr: String(data.get('successFr') || current.successMessage?.fr || '')
    },
    requiredFields: {
      name: data.get('reqName') === 'on',
      phone: data.get('reqPhone') === 'on',
      wilaya: data.get('reqWilaya') === 'on',
      baladiya: data.get('reqBaladiya') === 'on',
      address: data.get('reqAddress') === 'on'
    },
    submitBehavior: {
      method: String(data.get('submitMethod') || 'draft'),
      autoComplete: data.get('autoComplete') === 'on'
    },
    mapping: {
      products: String(data.get('products') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      collections: String(data.get('collections') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }
  };

  await updateForm(session.shop, form.id, { settings });
  return json({ ok: true });
}

export default function FormBuilder() {
  const { form } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const settings = form.settings as any;

  return (
    <Page title={form.name} subtitle="Form Builder">
      <Layout>
        <Layout.Section oneThird>
          <Card>
            <Text variant="headingMd" as="h2">
              Fields
            </Text>
            <BlockStack gap="200">
              <Text>Full name</Text>
              <Text>Phone</Text>
              <Text>Wilaya</Text>
              <Text>Baladiya</Text>
              <Text>Address</Text>
              <Text>Notes (optional)</Text>
            </BlockStack>
          </Card>
          <Card>
            <Text variant="headingMd" as="h2">
              Settings
            </Text>
            <Form method="post">
              <BlockStack gap="300">
                <Select
                  label="Default language"
                  name="defaultLanguage"
                  options={[
                    { label: 'Arabic', value: 'ar' },
                    { label: 'French', value: 'fr' }
                  ]}
                  value={settings.defaultLanguage || 'ar'}
                />
                <TextField
                  label="Radius"
                  name="radius"
                  type="number"
                  defaultValue={String(settings.tokens?.radius ?? 14)}
                />
                <TextField
                  label="Spacing"
                  name="spacing"
                  type="number"
                  defaultValue={String(settings.tokens?.spacing ?? 12)}
                />
                <TextField
                  label="Accent"
                  name="accent"
                  type="text"
                  defaultValue={String(settings.tokens?.accent ?? '#F58220')}
                />
                <Checkbox
                  label="RTL layout (Arabic)"
                  name="rtl"
                  checked={Boolean(settings.rtl)}
                />
                <Text variant="headingSm" as="h3">
                  Shipping
                </Text>
                <TextField
                  label="Standard price (DZD)"
                  name="standardPrice"
                  type="number"
                  defaultValue={String(settings.shipping?.standard?.price ?? 0)}
                />
                <Checkbox
                  label="Enable express"
                  name="enableExpress"
                  checked={Boolean(settings.shipping?.enableExpress)}
                />
                <TextField
                  label="Express price (DZD)"
                  name="expressPrice"
                  type="number"
                  defaultValue={String(settings.shipping?.express?.price ?? 0)}
                />
                <Text variant="headingSm" as="h3">
                  Discount
                </Text>
                <Checkbox
                  label="Enable discount"
                  name="discountEnabled"
                  checked={Boolean(settings.discount?.enabled)}
                />
                <TextField
                  label="Discount amount (DZD)"
                  name="discountAmount"
                  type="number"
                  defaultValue={String(settings.discount?.amount ?? 0)}
                />
                <Text variant="headingSm" as="h3">
                  Success Messages
                </Text>
                <TextField
                  label="Arabic"
                  name="successAr"
                  defaultValue={String(settings.successMessage?.ar || '')}
                />
                <TextField
                  label="French"
                  name="successFr"
                  defaultValue={String(settings.successMessage?.fr || '')}
                />
                <Text variant="headingSm" as="h3">
                  Required Fields
                </Text>
                <Checkbox
                  label="Full name"
                  name="reqName"
                  checked={Boolean(settings.requiredFields?.name)}
                />
                <Checkbox
                  label="Phone"
                  name="reqPhone"
                  checked={Boolean(settings.requiredFields?.phone)}
                />
                <Checkbox
                  label="Wilaya"
                  name="reqWilaya"
                  checked={Boolean(settings.requiredFields?.wilaya)}
                />
                <Checkbox
                  label="Baladiya"
                  name="reqBaladiya"
                  checked={Boolean(settings.requiredFields?.baladiya)}
                />
                <Checkbox
                  label="Address"
                  name="reqAddress"
                  checked={Boolean(settings.requiredFields?.address)}
                />
                <Text variant="headingSm" as="h3">
                  Submit Behavior
                </Text>
                <Select
                  label="Method"
                  name="submitMethod"
                  options={[
                    { label: 'Draft Order', value: 'draft' },
                    { label: 'Order', value: 'order' }
                  ]}
                  value={String(settings.submitBehavior?.method || 'draft')}
                />
                <Checkbox
                  label="Auto-complete draft order"
                  name="autoComplete"
                  checked={Boolean(settings.submitBehavior?.autoComplete)}
                />
                <Text variant="headingSm" as="h3">
                  Product Mapping
                </Text>
                <TextField
                  label="Product handles (comma separated)"
                  name="products"
                  defaultValue={(settings.mapping?.products || []).join(', ')}
                />
                <TextField
                  label="Collection handles (comma separated)"
                  name="collections"
                  defaultValue={(settings.mapping?.collections || []).join(', ')}
                />
                <Button submit variant="primary">
                  Save
                </Button>
                {actionData?.ok && <Text tone="success">Saved</Text>}
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">
              Live Preview
            </Text>
            <div
              style={{
                padding: 16,
                background: '#F7F7F7',
                borderRadius: 16
              }}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
                }}
              >
                <Text as="h3" variant="headingMd">
                  COD Order Form
                </Text>
                <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                  <div
                    style={{
                      background: '#FFF7ED',
                      borderRadius: 12,
                      padding: 12
                    }}
                  >
                    <Text>Price summary card</Text>
                  </div>
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderRadius: 12,
                      padding: 12
                    }}
                  >
                    <Text>Fields + delivery options</Text>
                  </div>
                  <Button variant="primary">Preview CTA</Button>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
