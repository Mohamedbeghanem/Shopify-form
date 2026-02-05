import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Text,
  DataTable,
  InlineStack
} from '@shopify/polaris';
import { authenticate } from '../shopify.server';
import { countDraftOrders, countSubmissions, getSubmissions } from '../models/submission.server';
import { countEvents } from '../models/event.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const [count7, count30, submissions, views30, submits30, draft30] = await Promise.all([
    countSubmissions(session.shop, 7),
    countSubmissions(session.shop, 30),
    getSubmissions(session.shop, 10),
    countEvents(session.shop, 'view', 30),
    countEvents(session.shop, 'submit', 30),
    countDraftOrders(session.shop, 30)
  ]);
  return json({
    count7,
    count30,
    views30,
    submits30,
    draft30,
    submissions: submissions.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString()
    }))
  });
}

export default function Dashboard() {
  const { count7, count30, submissions, views30, submits30, draft30 } =
    useLoaderData<typeof loader>();

  const rows = submissions.map((s) => [
    s.createdAt.slice(0, 10),
    s.name,
    s.phone,
    `${s.totalPrice} DZD`,
    s.status
  ]);

  return (
    <Page title="Dashboard">
      <Layout>
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <Text variant="headingMd" as="h2">
                Orders (7 days)
              </Text>
              <Text variant="heading2xl" as="p">
                {count7}
              </Text>
            </Card>
            <Card>
              <Text variant="headingMd" as="h2">
                Orders (30 days)
              </Text>
              <Text variant="heading2xl" as="p">
                {count30}
              </Text>
            </Card>
            <Card>
              <Text variant="headingMd" as="h2">
                Funnel (30 days)
              </Text>
              <Text as="p">Views: {views30}</Text>
              <Text as="p">Submits: {submits30}</Text>
              <Text as="p">Draft Orders: {draft30}</Text>
            </Card>
          </InlineStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Text variant="headingMd" as="h2">
              Recent Submissions
            </Text>
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text']}
              headings={['Date', 'Name', 'Phone', 'Total', 'Status']}
              rows={rows}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

