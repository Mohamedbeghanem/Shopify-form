var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// app/entry.server.tsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest
});
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { jsx } from "react/jsx-runtime";
function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  let markup = renderToString(
    /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url })
  );
  return responseHeaders.set("Content-Type", "text/html"), new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders
  });
}

// app/root.tsx
var root_exports = {};
__export(root_exports, {
  default: () => App,
  links: () => links,
  loader: () => loader
});
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";

// node_modules/@shopify/polaris/build/esm/styles.css
var styles_default = "/build/_assets/styles-62I325MT.css";

// app/root.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var links = () => [
  { rel: "stylesheet", href: styles_default }
];
async function loader({ request }) {
  return { shop: new URL(request.url).searchParams.get("shop") };
}
function App() {
  let { shop } = useLoaderData();
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx2("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx2("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx2(Meta, {}),
      /* @__PURE__ */ jsx2(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx2(Outlet, {}),
      /* @__PURE__ */ jsx2(ScrollRestoration, {}),
      /* @__PURE__ */ jsx2(Scripts, {}),
      /* @__PURE__ */ jsx2(
        "script",
        {
          dangerouslySetInnerHTML: {
            __html: `window.__SHOP__ = ${JSON.stringify(shop)};`
          }
        }
      )
    ] })
  ] });
}

// app/routes/apps.cod.locations.ts
var apps_cod_locations_exports = {};
__export(apps_cod_locations_exports, {
  loader: () => loader2
});
import { json } from "@remix-run/node";
import crypto from "node:crypto";
import { getAlgeriaLocations } from "~/utils/algeria.server";
function verifyProxySignature(params, secret) {
  let signature = params.get("signature") || "", sorted = [...params.entries()].filter(([key]) => key !== "signature").sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join(""), computed = crypto.createHmac("sha256", secret).update(sorted).digest("hex");
  return signature.length !== computed.length ? !1 : crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}
async function loader2({ request }) {
  let url = new URL(request.url), secret = process.env.SHOPIFY_API_SECRET || "";
  return verifyProxySignature(url.searchParams, secret) ? json({ ok: !0, locations: getAlgeriaLocations() }) : json({ ok: !1, message: "Invalid signature" }, { status: 401 });
}

// app/routes/apps.cod.submit.ts
var apps_cod_submit_exports = {};
__export(apps_cod_submit_exports, {
  action: () => action
});
import { json as json2 } from "@remix-run/node";
import crypto2 from "node:crypto";
import { shopify } from "~/shopify.server";
import { db } from "~/db.server";
import { createSubmission } from "~/models/submission.server";
import { submitSchema } from "~/utils/validation";
function verifyProxySignature2(params, secret) {
  let signature = params.get("signature") || "", sorted = [...params.entries()].filter(([key]) => key !== "signature").sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join(""), computed = crypto2.createHmac("sha256", secret).update(sorted).digest("hex");
  return signature.length !== computed.length ? !1 : crypto2.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}
async function action({ request }) {
  let url = new URL(request.url), secret = process.env.SHOPIFY_API_SECRET || "";
  if (!verifyProxySignature2(url.searchParams, secret))
    return json2({ ok: !1, message: "Invalid signature" }, { status: 401 });
  let body = await request.json(), parsed = submitSchema.safeParse(body);
  if (!parsed.success)
    return json2({ ok: !1, message: parsed.error.message }, { status: 400 });
  let {
    formId,
    variantId,
    quantity,
    name,
    phone,
    wilaya,
    baladiya,
    address,
    notes,
    shippingOption,
    productPrice,
    deliveryPrice,
    discountAmount
  } = parsed.data, shop = url.searchParams.get("shop");
  if (!shop)
    return json2({ ok: !1, message: "Missing shop" }, { status: 400 });
  let adminSession = (await shopify.sessionStorage.findSessionsByShop(shop))[0];
  if (!adminSession)
    return json2({ ok: !1, message: "App not installed" }, { status: 403 });
  let client = new shopify.api.clients.Graphql({ session: adminSession }), formSettings = (await db.form.findFirst({ where: { shop, id: formId } }))?.settings || {}, mutation = `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder { id name }
        userErrors { field message }
      }
    }
  `, result = (await client.query({
    data: {
      query: mutation,
      variables: {
        input: {
          lineItems: [
            {
              variantId: `gid://shopify/ProductVariant/${variantId}`,
              quantity
            }
          ],
          appliedDiscount: discountAmount > 0 ? {
            description: "COD Discount",
            title: "Discount",
            valueType: "FIXED_AMOUNT",
            value: discountAmount.toString()
          } : null,
          shippingLine: {
            title: shippingOption === "express" ? "Express" : "Standard",
            price: deliveryPrice.toString()
          },
          tags: [
            "COD",
            "Algeria-COD",
            `Wilaya:${wilaya}`,
            `Baladiya:${baladiya}`
          ],
          noteAttributes: [
            { name: "Full name", value: name },
            { name: "Phone", value: phone },
            { name: "Wilaya", value: wilaya },
            { name: "Baladiya", value: baladiya },
            { name: "Address", value: address },
            { name: "Notes", value: notes || "" }
          ]
        }
      }
    }
  })).body.data?.draftOrderCreate, errors = result?.userErrors || [];
  if (errors.length > 0)
    return json2({ ok: !1, message: errors[0].message }, { status: 400 });
  let draftOrderId = result?.draftOrder?.id, shouldComplete = formSettings.submitBehavior?.autoComplete || formSettings.submitBehavior?.method === "order";
  if (draftOrderId && shouldComplete) {
    let completeMutation = `
      mutation DraftOrderComplete($id: ID!) {
        draftOrderComplete(id: $id, paymentPending: true) {
          draftOrder { id name }
          userErrors { field message }
        }
      }
    `;
    await client.query({
      data: { query: completeMutation, variables: { id: draftOrderId } }
    });
  }
  let totalPrice = productPrice * quantity + deliveryPrice - discountAmount;
  return await createSubmission({
    shop,
    formId,
    productVariantId: variantId,
    quantity,
    name,
    phone,
    wilaya,
    baladiya,
    address,
    notes: notes || null,
    shippingOption,
    productPrice,
    deliveryPrice,
    discountAmount,
    totalPrice,
    status: "submitted",
    draftOrderId: draftOrderId || null
  }), json2({ ok: !0, message: "success", draftOrderId });
}

// app/routes/apps.cod.track.ts
var apps_cod_track_exports = {};
__export(apps_cod_track_exports, {
  action: () => action2
});
import { json as json3 } from "@remix-run/node";
import crypto3 from "node:crypto";
import { trackEvent } from "~/models/event.server";
function verifyProxySignature3(params, secret) {
  let signature = params.get("signature") || "", sorted = [...params.entries()].filter(([key]) => key !== "signature").sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join(""), computed = crypto3.createHmac("sha256", secret).update(sorted).digest("hex");
  return signature.length !== computed.length ? !1 : crypto3.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}
async function action2({ request }) {
  let url = new URL(request.url), secret = process.env.SHOPIFY_API_SECRET || "";
  if (!verifyProxySignature3(url.searchParams, secret))
    return json3({ ok: !1 }, { status: 401 });
  let { formId, type } = await request.json(), shop = url.searchParams.get("shop");
  return !shop || !formId || !type ? json3({ ok: !1 }, { status: 400 }) : (await trackEvent(shop, formId, type), json3({ ok: !0 }));
}

// app/routes/app.forms.$id.tsx
var app_forms_id_exports = {};
__export(app_forms_id_exports, {
  action: () => action3,
  default: () => FormBuilder,
  loader: () => loader3
});
import { json as json4, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData as useLoaderData2 } from "@remix-run/react";
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
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getForm, updateForm } from "~/models/form.server";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
async function loader3({ request, params }) {
  let { session } = await authenticate.admin(request), form = await getForm(session.shop, params.id || "");
  return form ? json4({ form }) : redirect("/app/forms");
}
async function action3({ request, params }) {
  let { session } = await authenticate.admin(request), form = await getForm(session.shop, params.id || "");
  if (!form)
    return redirect("/app/forms");
  let current = form.settings, data = await request.formData(), settings = {
    ...current,
    defaultLanguage: String(data.get("defaultLanguage") || "ar"),
    tokens: {
      ...current.tokens,
      radius: Number(data.get("radius") || current.tokens.radius || 14),
      spacing: Number(data.get("spacing") || current.tokens.spacing || 12),
      accent: String(data.get("accent") || current.tokens.accent || "#F58220")
    },
    shipping: {
      enableExpress: data.get("enableExpress") === "on",
      standard: {
        ...current.shipping.standard,
        price: Number(data.get("standardPrice") || 0)
      },
      express: {
        ...current.shipping.express,
        price: Number(data.get("expressPrice") || 0)
      }
    },
    discount: {
      enabled: data.get("discountEnabled") === "on",
      amount: Number(data.get("discountAmount") || 0)
    },
    rtl: data.get("rtl") === "on",
    successMessage: {
      ar: String(data.get("successAr") || current.successMessage?.ar || ""),
      fr: String(data.get("successFr") || current.successMessage?.fr || "")
    },
    requiredFields: {
      name: data.get("reqName") === "on",
      phone: data.get("reqPhone") === "on",
      wilaya: data.get("reqWilaya") === "on",
      baladiya: data.get("reqBaladiya") === "on",
      address: data.get("reqAddress") === "on"
    },
    submitBehavior: {
      method: String(data.get("submitMethod") || "draft"),
      autoComplete: data.get("autoComplete") === "on"
    },
    mapping: {
      products: String(data.get("products") || "").split(",").map((s) => s.trim()).filter(Boolean),
      collections: String(data.get("collections") || "").split(",").map((s) => s.trim()).filter(Boolean)
    }
  };
  return await updateForm(session.shop, form.id, { settings }), json4({ ok: !0 });
}
function FormBuilder() {
  let { form } = useLoaderData2(), actionData = useActionData(), settings = form.settings;
  return /* @__PURE__ */ jsx3(Page, { title: form.name, subtitle: "Form Builder", children: /* @__PURE__ */ jsxs2(Layout, { children: [
    /* @__PURE__ */ jsxs2(Layout.Section, { oneThird: !0, children: [
      /* @__PURE__ */ jsxs2(Card, { children: [
        /* @__PURE__ */ jsx3(Text, { variant: "headingMd", as: "h2", children: "Fields" }),
        /* @__PURE__ */ jsxs2(BlockStack, { gap: "200", children: [
          /* @__PURE__ */ jsx3(Text, { children: "Full name" }),
          /* @__PURE__ */ jsx3(Text, { children: "Phone" }),
          /* @__PURE__ */ jsx3(Text, { children: "Wilaya" }),
          /* @__PURE__ */ jsx3(Text, { children: "Baladiya" }),
          /* @__PURE__ */ jsx3(Text, { children: "Address" }),
          /* @__PURE__ */ jsx3(Text, { children: "Notes (optional)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs2(Card, { children: [
        /* @__PURE__ */ jsx3(Text, { variant: "headingMd", as: "h2", children: "Settings" }),
        /* @__PURE__ */ jsx3(Form, { method: "post", children: /* @__PURE__ */ jsxs2(BlockStack, { gap: "300", children: [
          /* @__PURE__ */ jsx3(
            Select,
            {
              label: "Default language",
              name: "defaultLanguage",
              options: [
                { label: "Arabic", value: "ar" },
                { label: "French", value: "fr" }
              ],
              value: settings.defaultLanguage || "ar"
            }
          ),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Radius",
              name: "radius",
              type: "number",
              defaultValue: String(settings.tokens?.radius ?? 14)
            }
          ),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Spacing",
              name: "spacing",
              type: "number",
              defaultValue: String(settings.tokens?.spacing ?? 12)
            }
          ),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Accent",
              name: "accent",
              type: "text",
              defaultValue: String(settings.tokens?.accent ?? "#F58220")
            }
          ),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "RTL layout (Arabic)",
              name: "rtl",
              checked: Boolean(settings.rtl)
            }
          ),
          /* @__PURE__ */ jsx3(Text, { variant: "headingSm", as: "h3", children: "Shipping" }),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Standard price (DZD)",
              name: "standardPrice",
              type: "number",
              defaultValue: String(settings.shipping?.standard?.price ?? 0)
            }
          ),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Enable express",
              name: "enableExpress",
              checked: Boolean(settings.shipping?.enableExpress)
            }
          ),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Express price (DZD)",
              name: "expressPrice",
              type: "number",
              defaultValue: String(settings.shipping?.express?.price ?? 0)
            }
          ),
          /* @__PURE__ */ jsx3(Text, { variant: "headingSm", as: "h3", children: "Discount" }),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Enable discount",
              name: "discountEnabled",
              checked: Boolean(settings.discount?.enabled)
            }
          ),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Discount amount (DZD)",
              name: "discountAmount",
              type: "number",
              defaultValue: String(settings.discount?.amount ?? 0)
            }
          ),
          /* @__PURE__ */ jsx3(Text, { variant: "headingSm", as: "h3", children: "Success Messages" }),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Arabic",
              name: "successAr",
              defaultValue: String(settings.successMessage?.ar || "")
            }
          ),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "French",
              name: "successFr",
              defaultValue: String(settings.successMessage?.fr || "")
            }
          ),
          /* @__PURE__ */ jsx3(Text, { variant: "headingSm", as: "h3", children: "Required Fields" }),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Full name",
              name: "reqName",
              checked: Boolean(settings.requiredFields?.name)
            }
          ),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Phone",
              name: "reqPhone",
              checked: Boolean(settings.requiredFields?.phone)
            }
          ),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Wilaya",
              name: "reqWilaya",
              checked: Boolean(settings.requiredFields?.wilaya)
            }
          ),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Baladiya",
              name: "reqBaladiya",
              checked: Boolean(settings.requiredFields?.baladiya)
            }
          ),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Address",
              name: "reqAddress",
              checked: Boolean(settings.requiredFields?.address)
            }
          ),
          /* @__PURE__ */ jsx3(Text, { variant: "headingSm", as: "h3", children: "Submit Behavior" }),
          /* @__PURE__ */ jsx3(
            Select,
            {
              label: "Method",
              name: "submitMethod",
              options: [
                { label: "Draft Order", value: "draft" },
                { label: "Order", value: "order" }
              ],
              value: String(settings.submitBehavior?.method || "draft")
            }
          ),
          /* @__PURE__ */ jsx3(
            Checkbox,
            {
              label: "Auto-complete draft order",
              name: "autoComplete",
              checked: Boolean(settings.submitBehavior?.autoComplete)
            }
          ),
          /* @__PURE__ */ jsx3(Text, { variant: "headingSm", as: "h3", children: "Product Mapping" }),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Product handles (comma separated)",
              name: "products",
              defaultValue: (settings.mapping?.products || []).join(", ")
            }
          ),
          /* @__PURE__ */ jsx3(
            TextField,
            {
              label: "Collection handles (comma separated)",
              name: "collections",
              defaultValue: (settings.mapping?.collections || []).join(", ")
            }
          ),
          /* @__PURE__ */ jsx3(Button, { submit: !0, variant: "primary", children: "Save" }),
          actionData?.ok && /* @__PURE__ */ jsx3(Text, { tone: "success", children: "Saved" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx3(Layout.Section, { children: /* @__PURE__ */ jsxs2(Card, { children: [
      /* @__PURE__ */ jsx3(Text, { variant: "headingMd", as: "h2", children: "Live Preview" }),
      /* @__PURE__ */ jsx3(
        "div",
        {
          style: {
            padding: 16,
            background: "#F7F7F7",
            borderRadius: 16
          },
          children: /* @__PURE__ */ jsxs2(
            "div",
            {
              style: {
                background: "#fff",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
              },
              children: [
                /* @__PURE__ */ jsx3(Text, { as: "h3", variant: "headingMd", children: "COD Order Form" }),
                /* @__PURE__ */ jsxs2("div", { style: { display: "grid", gap: 10, marginTop: 12 }, children: [
                  /* @__PURE__ */ jsx3(
                    "div",
                    {
                      style: {
                        background: "#FFF7ED",
                        borderRadius: 12,
                        padding: 12
                      },
                      children: /* @__PURE__ */ jsx3(Text, { children: "Price summary card" })
                    }
                  ),
                  /* @__PURE__ */ jsx3(
                    "div",
                    {
                      style: {
                        background: "#F8FAFC",
                        borderRadius: 12,
                        padding: 12
                      },
                      children: /* @__PURE__ */ jsx3(Text, { children: "Fields + delivery options" })
                    }
                  ),
                  /* @__PURE__ */ jsx3(Button, { variant: "primary", children: "Preview CTA" })
                ] })
              ]
            }
          )
        }
      )
    ] }) })
  ] }) });
}

// app/routes/app.forms.new.tsx
var app_forms_new_exports = {};
__export(app_forms_new_exports, {
  action: () => action4,
  default: () => NewForm,
  loader: () => loader4
});
import { json as json5, redirect as redirect2 } from "@remix-run/node";
import { Form as Form2, useActionData as useActionData2 } from "@remix-run/react";
import { Page as Page2, Card as Card2, TextField as TextField2, Button as Button2, BlockStack as BlockStack2, Text as Text2 } from "@shopify/polaris";
import { authenticate as authenticate2 } from "~/shopify.server";
import { createForm } from "~/models/form.server";

// app/utils/validation.ts
import { z } from "zod";
var submitSchema2 = z.object({
  formId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99),
  name: z.string().min(2),
  phone: z.string().min(8),
  wilaya: z.string().min(1),
  baladiya: z.string().min(1),
  address: z.string().min(4),
  notes: z.string().optional().nullable(),
  shippingOption: z.enum(["standard", "express"]),
  productPrice: z.coerce.number().int().nonnegative(),
  deliveryPrice: z.coerce.number().int().nonnegative(),
  discountAmount: z.coerce.number().int().min(0),
  locale: z.string().optional()
}), formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  isActive: z.boolean().default(!0),
  settings: z.any()
});

// app/routes/app.forms.new.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var defaultSettings = {
  defaultLanguage: "ar",
  tokens: {
    radius: 14,
    spacing: 12,
    accent: "#F58220"
  },
  shipping: {
    enableExpress: !0,
    standard: { name: "Standard", days: "5-7", price: 400 },
    express: { name: "Express", days: "2-3", price: 700 }
  },
  discount: { enabled: !1, amount: 0 },
  submitBehavior: { method: "draft", autoComplete: !1 },
  successMessage: {
    ar: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u0628\u0646\u062C\u0627\u062D. \u0633\u0646\u062A\u0635\u0644 \u0628\u0643 \u0644\u0644\u062A\u0623\u0643\u064A\u062F.",
    fr: "Commande envoy\xE9e. Nous vous contacterons pour confirmer."
  },
  rtl: !0,
  mapping: { products: [], collections: [] },
  requiredFields: {
    name: !0,
    phone: !0,
    wilaya: !0,
    baladiya: !0,
    address: !0
  }
};
async function loader4({ request }) {
  return await authenticate2.admin(request), json5({});
}
async function action4({ request }) {
  let { session } = await authenticate2.admin(request), formData = await request.formData(), name = String(formData.get("name") || "COD Form"), slug = String(
    formData.get("slug") || name.toLowerCase().replace(/\s+/g, "-")
  ), parsed = formSchema.safeParse({
    name,
    slug,
    isActive: !0,
    settings: defaultSettings
  });
  if (!parsed.success)
    return json5({ error: parsed.error.message }, { status: 400 });
  let form = await createForm(session.shop, parsed.data);
  return redirect2(`/app/forms/${form.id}`);
}
function NewForm() {
  let actionData = useActionData2();
  return /* @__PURE__ */ jsx4(Page2, { title: "Create Form", children: /* @__PURE__ */ jsx4(Card2, { children: /* @__PURE__ */ jsx4(Form2, { method: "post", children: /* @__PURE__ */ jsxs3(BlockStack2, { gap: "400", children: [
    /* @__PURE__ */ jsx4(Text2, { variant: "headingMd", as: "h2", children: "One-click setup" }),
    /* @__PURE__ */ jsx4(
      TextField2,
      {
        name: "name",
        label: "Form name",
        autoComplete: "off",
        defaultValue: "Algeria COD"
      }
    ),
    /* @__PURE__ */ jsx4(
      TextField2,
      {
        name: "slug",
        label: "Slug",
        autoComplete: "off",
        defaultValue: "algeria-cod"
      }
    ),
    actionData?.error && /* @__PURE__ */ jsx4(Text2, { tone: "critical", children: actionData.error }),
    /* @__PURE__ */ jsx4(Button2, { submit: !0, variant: "primary", children: "Create form" })
  ] }) }) }) });
}

// app/routes/apps.cod.form.ts
var apps_cod_form_exports = {};
__export(apps_cod_form_exports, {
  loader: () => loader5
});
import { json as json6 } from "@remix-run/node";
import crypto4 from "node:crypto";
import { db as db2 } from "~/db.server";
function verifyProxySignature4(params, secret) {
  let signature = params.get("signature") || "", sorted = [...params.entries()].filter(([key]) => key !== "signature").sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join(""), computed = crypto4.createHmac("sha256", secret).update(sorted).digest("hex");
  return signature.length !== computed.length ? !1 : crypto4.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
}
async function loader5({ request }) {
  let url = new URL(request.url), secret = process.env.SHOPIFY_API_SECRET || "";
  if (!verifyProxySignature4(url.searchParams, secret))
    return json6({ ok: !1, message: "Invalid signature" }, { status: 401 });
  let shop = url.searchParams.get("shop"), slug = url.searchParams.get("slug");
  if (!shop || !slug)
    return json6({ ok: !1, message: "Missing params" }, { status: 400 });
  let form = await db2.form.findFirst({ where: { shop, slug, isActive: !0 } });
  return form ? json6({
    ok: !0,
    form: {
      id: form.id,
      name: form.name,
      slug: form.slug,
      settings: form.settings
    }
  }) : json6({ ok: !1, message: "Not found" }, { status: 404 });
}

// app/routes/api.webhooks.tsx
var api_webhooks_exports = {};
__export(api_webhooks_exports, {
  action: () => action5
});
import { json as json7 } from "@remix-run/node";
import { shopify as shopify2 } from "~/shopify.server";
import { db as db3 } from "~/db.server";
async function action5({ request }) {
  let { topic, shop } = await shopify2.authenticate.webhook(request);
  return topic === "APP_UNINSTALLED" && shop && await db3.session.deleteMany({ where: { shop } }), json7({ ok: !0 });
}

// app/routes/app.settings.tsx
var app_settings_exports = {};
__export(app_settings_exports, {
  default: () => Settings,
  loader: () => loader6
});
import { json as json8 } from "@remix-run/node";
import { Page as Page3, Card as Card3, Select as Select2, Checkbox as Checkbox2, BlockStack as BlockStack3, Text as Text3 } from "@shopify/polaris";
import { authenticate as authenticate3 } from "~/shopify.server";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
async function loader6({ request }) {
  return await authenticate3.admin(request), json8({});
}
function Settings() {
  return /* @__PURE__ */ jsx5(Page3, { title: "Settings", children: /* @__PURE__ */ jsx5(Card3, { children: /* @__PURE__ */ jsxs4(BlockStack3, { gap: "300", children: [
    /* @__PURE__ */ jsx5(Text3, { variant: "headingMd", as: "h2", children: "Order Creation" }),
    /* @__PURE__ */ jsx5(
      Select2,
      {
        label: "Create method",
        options: [
          { label: "Draft Order (recommended)", value: "draft" },
          { label: "Order", value: "order" }
        ],
        value: "draft"
      }
    ),
    /* @__PURE__ */ jsx5(Checkbox2, { label: "Auto-complete draft order", checked: !1 }),
    /* @__PURE__ */ jsx5(Text3, { variant: "headingSm", as: "h3", children: "Notifications" }),
    /* @__PURE__ */ jsx5(Checkbox2, { label: "Send email to admin", checked: !1 })
  ] }) }) });
}

// app/routes/app._index.tsx
var app_index_exports = {};
__export(app_index_exports, {
  default: () => Dashboard,
  loader: () => loader7
});
import { json as json9 } from "@remix-run/node";
import { useLoaderData as useLoaderData3 } from "@remix-run/react";
import {
  Page as Page4,
  Layout as Layout2,
  Card as Card4,
  Text as Text4,
  DataTable,
  InlineStack
} from "@shopify/polaris";
import { authenticate as authenticate4 } from "~/shopify.server";
import { countDraftOrders, countSubmissions, getSubmissions } from "~/models/submission.server";
import { countEvents } from "~/models/event.server";
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
async function loader7({ request }) {
  let { session } = await authenticate4.admin(request), [count7, count30, submissions, views30, submits30, draft30] = await Promise.all([
    countSubmissions(session.shop, 7),
    countSubmissions(session.shop, 30),
    getSubmissions(session.shop, 10),
    countEvents(session.shop, "view", 30),
    countEvents(session.shop, "submit", 30),
    countDraftOrders(session.shop, 30)
  ]);
  return json9({
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
function Dashboard() {
  let { count7, count30, submissions, views30, submits30, draft30 } = useLoaderData3(), rows = submissions.map((s) => [
    s.createdAt.slice(0, 10),
    s.name,
    s.phone,
    `${s.totalPrice} DZD`,
    s.status
  ]);
  return /* @__PURE__ */ jsx6(Page4, { title: "Dashboard", children: /* @__PURE__ */ jsxs5(Layout2, { children: [
    /* @__PURE__ */ jsx6(Layout2.Section, { children: /* @__PURE__ */ jsxs5(InlineStack, { gap: "400", children: [
      /* @__PURE__ */ jsxs5(Card4, { children: [
        /* @__PURE__ */ jsx6(Text4, { variant: "headingMd", as: "h2", children: "Orders (7 days)" }),
        /* @__PURE__ */ jsx6(Text4, { variant: "heading2xl", as: "p", children: count7 })
      ] }),
      /* @__PURE__ */ jsxs5(Card4, { children: [
        /* @__PURE__ */ jsx6(Text4, { variant: "headingMd", as: "h2", children: "Orders (30 days)" }),
        /* @__PURE__ */ jsx6(Text4, { variant: "heading2xl", as: "p", children: count30 })
      ] }),
      /* @__PURE__ */ jsxs5(Card4, { children: [
        /* @__PURE__ */ jsx6(Text4, { variant: "headingMd", as: "h2", children: "Funnel (30 days)" }),
        /* @__PURE__ */ jsxs5(Text4, { as: "p", children: [
          "Views: ",
          views30
        ] }),
        /* @__PURE__ */ jsxs5(Text4, { as: "p", children: [
          "Submits: ",
          submits30
        ] }),
        /* @__PURE__ */ jsxs5(Text4, { as: "p", children: [
          "Draft Orders: ",
          draft30
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx6(Layout2.Section, { children: /* @__PURE__ */ jsxs5(Card4, { children: [
      /* @__PURE__ */ jsx6(Text4, { variant: "headingMd", as: "h2", children: "Recent Submissions" }),
      /* @__PURE__ */ jsx6(
        DataTable,
        {
          columnContentTypes: ["text", "text", "text", "text", "text"],
          headings: ["Date", "Name", "Phone", "Total", "Status"],
          rows
        }
      )
    ] }) })
  ] }) });
}

// app/routes/app.forms.tsx
var app_forms_exports = {};
__export(app_forms_exports, {
  default: () => Forms,
  loader: () => loader8
});
import { json as json10 } from "@remix-run/node";
import { useLoaderData as useLoaderData4 } from "@remix-run/react";
import { Page as Page5, Card as Card5, ResourceList, Text as Text5, Button as Button3 } from "@shopify/polaris";
import { authenticate as authenticate5 } from "~/shopify.server";
import { getForms } from "~/models/form.server";
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
async function loader8({ request }) {
  let { session } = await authenticate5.admin(request), forms = await getForms(session.shop);
  return json10({ forms });
}
function Forms() {
  let { forms } = useLoaderData4();
  return /* @__PURE__ */ jsx7(
    Page5,
    {
      title: "Forms",
      primaryAction: { content: "Create Form", url: "/app/forms/new" },
      children: /* @__PURE__ */ jsxs6(Card5, { children: [
        /* @__PURE__ */ jsx7(
          ResourceList,
          {
            resourceName: { singular: "form", plural: "forms" },
            items: forms,
            renderItem: (item) => /* @__PURE__ */ jsxs6(ResourceList.Item, { id: item.id, url: `/app/forms/${item.id}`, children: [
              /* @__PURE__ */ jsx7(Text5, { as: "h3", variant: "headingMd", children: item.name }),
              /* @__PURE__ */ jsxs6(Text5, { as: "p", children: [
                "Slug: ",
                item.slug
              ] })
            ] })
          }
        ),
        forms.length === 0 && /* @__PURE__ */ jsxs6("div", { style: { padding: 16 }, children: [
          /* @__PURE__ */ jsx7(Text5, { as: "p", children: "No forms yet." }),
          /* @__PURE__ */ jsx7(Button3, { url: "/app/forms/new", variant: "primary", children: "Create your first form" })
        ] })
      ] })
    }
  );
}

// app/routes/auth.$.tsx
var auth_exports = {};
__export(auth_exports, {
  loader: () => loader9
});
import { authenticate as authenticate6 } from "~/shopify.server";
var loader9 = async ({ request }) => (await authenticate6.admin(request), null);

// app/routes/_index.tsx
var index_exports = {};
__export(index_exports, {
  loader: () => loader10
});
import { redirect as redirect3 } from "@remix-run/node";
async function loader10({ request }) {
  let shop = new URL(request.url).searchParams.get("shop");
  return shop ? redirect3(`/app?shop=${shop}`) : redirect3("/app");
}

// app/routes/app.tsx
var app_exports = {};
__export(app_exports, {
  default: () => AppLayout,
  loader: () => loader11
});
import { json as json11 } from "@remix-run/node";
import { Outlet as Outlet2, useLoaderData as useLoaderData5 } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Frame, Navigation } from "@shopify/polaris";
import translations from "@shopify/polaris/locales/en.json";
import { HomeIcon, FormsIcon, SettingsIcon } from "@shopify/polaris-icons";

// app/shopify.server.ts
import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { LATEST_API_VERSION, DeliveryMethod } from "@shopify/shopify-api";

// app/db.server.ts
import { PrismaClient } from "@prisma/client";
var db4 = global.__db__ || new PrismaClient();

// app/shopify.server.ts
var sessionStorage = new PrismaSessionStorage(db4), shopify3 = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: (process.env.SCOPES || "").split(",").filter(Boolean),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  apiVersion: LATEST_API_VERSION,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks"
    }
  },
  sessionStorage,
  distribution: "AppStore",
  future: {
    unstable_newEmbeddedAuthStrategy: !0
  }
}), authenticate7 = shopify3.authenticate;
async function ensureShopRecord(shop) {
  await db4.shop.upsert({
    where: { shop },
    update: {},
    create: { shop }
  });
}

// app/routes/app.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
async function loader11({ request }) {
  let { session } = await authenticate7.admin(request);
  return await ensureShopRecord(session.shop), json11({
    apiKey: process.env.SHOPIFY_API_KEY
  });
}
function AppLayout() {
  let { apiKey } = useLoaderData5();
  return /* @__PURE__ */ jsx8(AppProvider, { isEmbeddedApp: !0, apiKey, i18n: translations, children: /* @__PURE__ */ jsx8(
    Frame,
    {
      navigation: /* @__PURE__ */ jsx8(Navigation, { location: "/app", children: /* @__PURE__ */ jsx8(
        Navigation.Section,
        {
          items: [
            { label: "Dashboard", url: "/app", icon: HomeIcon },
            { label: "Forms", url: "/app/forms", icon: FormsIcon },
            { label: "Create Form", url: "/app/forms/new", icon: FormsIcon },
            { label: "Settings", url: "/app/settings", icon: SettingsIcon }
          ]
        }
      ) }),
      children: /* @__PURE__ */ jsx8(Outlet2, {})
    }
  ) });
}

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-UJQDPRD6.js", imports: ["/build/_shared/chunk-UJIABNU3.js", "/build/_shared/chunk-GG4UNW5U.js", "/build/_shared/chunk-T36URGAI.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-A27F2ZXN.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_index": { id: "routes/_index", parentId: "root", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/_index-IFUUUBIO.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.webhooks": { id: "routes/api.webhooks", parentId: "root", path: "api/webhooks", index: void 0, caseSensitive: void 0, module: "/build/routes/api.webhooks-O3HVZN5M.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app": { id: "routes/app", parentId: "root", path: "app", index: void 0, caseSensitive: void 0, module: "/build/routes/app-KGHO2KOX.js", imports: ["/build/_shared/chunk-3L3JZH4R.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app._index": { id: "routes/app._index", parentId: "routes/app", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/app._index-QFSIABGB.js", imports: ["/build/_shared/chunk-LCL4ITIE.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.forms": { id: "routes/app.forms", parentId: "routes/app", path: "forms", index: void 0, caseSensitive: void 0, module: "/build/routes/app.forms-23SBHEAS.js", imports: ["/build/_shared/chunk-6Q4GXTV2.js", "/build/_shared/chunk-LCL4ITIE.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.forms.$id": { id: "routes/app.forms.$id", parentId: "routes/app.forms", path: ":id", index: void 0, caseSensitive: void 0, module: "/build/routes/app.forms.$id-AYLNRXIT.js", imports: ["/build/_shared/chunk-3L3JZH4R.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.forms.new": { id: "routes/app.forms.new", parentId: "routes/app.forms", path: "new", index: void 0, caseSensitive: void 0, module: "/build/routes/app.forms.new-FO64KO5L.js", imports: ["/build/_shared/chunk-3L3JZH4R.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.settings": { id: "routes/app.settings", parentId: "routes/app", path: "settings", index: void 0, caseSensitive: void 0, module: "/build/routes/app.settings-AEDNHQF5.js", imports: ["/build/_shared/chunk-LCL4ITIE.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/apps.cod.form": { id: "routes/apps.cod.form", parentId: "root", path: "apps/cod/form", index: void 0, caseSensitive: void 0, module: "/build/routes/apps.cod.form-NKCU36XD.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/apps.cod.locations": { id: "routes/apps.cod.locations", parentId: "root", path: "apps/cod/locations", index: void 0, caseSensitive: void 0, module: "/build/routes/apps.cod.locations-KULM6ZO5.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/apps.cod.submit": { id: "routes/apps.cod.submit", parentId: "root", path: "apps/cod/submit", index: void 0, caseSensitive: void 0, module: "/build/routes/apps.cod.submit-TTK3ZT34.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/apps.cod.track": { id: "routes/apps.cod.track", parentId: "root", path: "apps/cod/track", index: void 0, caseSensitive: void 0, module: "/build/routes/apps.cod.track-HXHE23DE.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.$": { id: "routes/auth.$", parentId: "root", path: "auth/*", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.$-QR56DKA3.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 } }, version: "60aa7399", hmr: void 0, url: "/build/manifest-60AA7399.js" };

// server-entry-module:@remix-run/dev/server-build
var mode = "production", assetsBuildDirectory = "public/build", future = { v3_fetcherPersist: !1, v3_relativeSplatPath: !1, v3_throwAbortReason: !1, v3_routeConfig: !1, v3_singleFetch: !1, v3_lazyRouteDiscovery: !1, unstable_optimizeDeps: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/apps.cod.locations": {
    id: "routes/apps.cod.locations",
    parentId: "root",
    path: "apps/cod/locations",
    index: void 0,
    caseSensitive: void 0,
    module: apps_cod_locations_exports
  },
  "routes/apps.cod.submit": {
    id: "routes/apps.cod.submit",
    parentId: "root",
    path: "apps/cod/submit",
    index: void 0,
    caseSensitive: void 0,
    module: apps_cod_submit_exports
  },
  "routes/apps.cod.track": {
    id: "routes/apps.cod.track",
    parentId: "root",
    path: "apps/cod/track",
    index: void 0,
    caseSensitive: void 0,
    module: apps_cod_track_exports
  },
  "routes/app.forms.$id": {
    id: "routes/app.forms.$id",
    parentId: "routes/app.forms",
    path: ":id",
    index: void 0,
    caseSensitive: void 0,
    module: app_forms_id_exports
  },
  "routes/app.forms.new": {
    id: "routes/app.forms.new",
    parentId: "routes/app.forms",
    path: "new",
    index: void 0,
    caseSensitive: void 0,
    module: app_forms_new_exports
  },
  "routes/apps.cod.form": {
    id: "routes/apps.cod.form",
    parentId: "root",
    path: "apps/cod/form",
    index: void 0,
    caseSensitive: void 0,
    module: apps_cod_form_exports
  },
  "routes/api.webhooks": {
    id: "routes/api.webhooks",
    parentId: "root",
    path: "api/webhooks",
    index: void 0,
    caseSensitive: void 0,
    module: api_webhooks_exports
  },
  "routes/app.settings": {
    id: "routes/app.settings",
    parentId: "routes/app",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: app_settings_exports
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: app_index_exports
  },
  "routes/app.forms": {
    id: "routes/app.forms",
    parentId: "routes/app",
    path: "forms",
    index: void 0,
    caseSensitive: void 0,
    module: app_forms_exports
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: auth_exports
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: index_exports
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: app_exports
  }
};
export {
  assets_manifest_default as assets,
  assetsBuildDirectory,
  entry,
  future,
  mode,
  publicPath,
  routes
};
