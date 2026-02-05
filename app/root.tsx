import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import polarisStyles from '@shopify/polaris/build/esm/styles.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: polarisStyles }
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get('shop');
  return { shop };
}

export default function App() {
  const { shop } = useLoaderData<typeof loader>();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SHOP__ = ${JSON.stringify(shop)};`
          }}
        />
      </body>
    </html>
  );
}
