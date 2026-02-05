import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { AppProvider, NavMenu, TitleBar } from '@shopify/shopify-app-remix/react';
import translations from '@shopify/polaris/locales/en.json';
import { authenticate, ensureShopRecord } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  await ensureShopRecord(session.shop);
  return json({ apiKey: process.env.SHOPIFY_API_KEY });
}

export default function AppLayout() {
  const { apiKey } = useLoaderData<typeof loader>();
  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={translations}>
      <TitleBar title="Algeria COD Form Builder" />
      <NavMenu>
        <a href="/app">Dashboard</a>
        <a href="/app/forms">Forms</a>
        <a href="/app/forms/new">Create Form</a>
        <a href="/app/settings">Settings</a>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}
