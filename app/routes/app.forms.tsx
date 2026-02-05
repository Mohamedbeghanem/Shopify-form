import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Page, Card, ResourceList, Text, Button } from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getForms } from '~/models/form.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const forms = await getForms(session.shop);
  return json({ forms });
}

export default function Forms() {
  const { forms } = useLoaderData<typeof loader>();
  return (
    <Page
      title="Forms"
      primaryAction={{ content: 'Create Form', url: '/app/forms/new' }}
    >
      <Card>
        <ResourceList
          resourceName={{ singular: 'form', plural: 'forms' }}
          items={forms}
          renderItem={(item) => {
            return (
              <ResourceList.Item id={item.id} url={`/app/forms/${item.id}`}>
                <Text as="h3" variant="headingMd">
                  {item.name}
                </Text>
                <Text as="p">Slug: {item.slug}</Text>
              </ResourceList.Item>
            );
          }}
        />
        {forms.length === 0 && (
          <div style={{ padding: 16 }}>
            <Text as="p">No forms yet.</Text>
            <Button url="/app/forms/new" variant="primary">
              Create your first form
            </Button>
          </div>
        )}
      </Card>
    </Page>
  );
}
