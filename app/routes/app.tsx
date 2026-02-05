import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';

import { AppProvider } from '@shopify/shopify-app-remix/react';
import { Frame, Navigation } from '@shopify/polaris';
import translations from '@shopify/polaris/locales/en.json';

import { HomeIcon, FormsIcon, SettingsIcon } from '@shopify/polaris-icons';

import { authenticate, ensureShopRecord } from '../shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  await ensureShopRecord(session.shop);

  return json({
    apiKey: process.env.SHOPIFY_API_KEY!,
  });
}

export default function AppLayout() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={translations}>
      <Frame
        navigation={
          <Navigation location="/app">
            <Navigation.Section
              items={[
                { label: 'Dashboard', url: '/app', icon: HomeIcon },
                { label: 'Forms', url: '/app/forms', icon: FormsIcon },
                { label: 'Create Form', url: '/app/forms/new', icon: FormsIcon },
                { label: 'Settings', url: '/app/settings', icon: SettingsIcon },
              ]}
            />
          </Navigation>
        }
      >
        <Outlet />
      </Frame>
    </AppProvider>
  );
}
