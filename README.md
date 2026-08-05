# Demo bucket

`demo.mien.works` is a framework-free static site containing a root holding page, shared files, and isolated client demos. A Cloudflare Worker owns URL routing and streams existing objects from the R2 bucket named `demonstrations` through the `supplier` binding.

## Architecture

The object keys in R2 mirror the repository's public static tree:

```text
index.html                 Root homepage
robots.txt
assets/                    Shared images, fonts, favicons, and branding
internals/                 Shared internal scripts
client/<client_slug>/      Client-specific demo files
client/<client_slug>/index.html
```

The Worker deployment contains only Worker code. It does not bundle, copy, synchronize, or upload the repository's static files. The existing bucket population process remains responsible for placing the public files in R2 with the keys shown above.

Every request runs through `worker/index.js`. It accepts `GET` and `HEAD`, resolves the URL pathname with the independently tested `resolve_asset_key` helper, and reads that exact key from the `supplier` R2 binding. Unsupported methods receive `405 Method Not Allowed` with `Allow: GET, HEAD`.

R2 object bodies are streamed rather than buffered. Stored HTTP metadata is applied to the response, including content type, cache control, content encoding, content language, and content disposition when present. The Worker also returns the object's content length, quoted ETag, upload timestamp as `Last-Modified`, and `Accept-Ranges: bytes`. Valid range reads return `206 Partial Content`; unsatisfiable ranges return `416 Range Not Satisfiable`.

There is no custom 404 page in this repository. A missing final R2 key receives a minimal `404 Not Found` and never falls back to the root homepage.

## Routing

| Request pathname | R2 object key |
| --- | --- |
| `/` | `index.html` |
| `/index.html` | `index.html` |
| `/client/acme` | `client/acme/index.html` |
| `/client/acme/` | `client/acme/index.html` |
| `/client/acme/index.html` | `client/acme/index.html` |
| `/client/acme/style.css` | `client/acme/style.css` |
| `/client/acme/assets/app.js` | `client/acme/assets/app.js` |
| `/assets/favicon.svg` | `assets/favicon.svg` |
| `/internals/output.js` | `internals/output.js` |

ACME is the current test client. Only `/client/<single_slug>` and `/client/<single_slug>/` receive client-index resolution. Every other valid pathname loses only its leading slash. Paths that would produce an object key containing `//` are rejected with a 404 rather than normalized.

The Worker does not redirect between trailing-slash and non-trailing-slash client roots. Query strings do not become part of the R2 key. Request headers remain available to R2 for conditional and range reads.

## Required binding

`wrangler.jsonc` declares this R2 binding:

| Worker binding | R2 bucket |
| --- | --- |
| `supplier` | `demonstrations` |

This matches the existing `demo-bucket` dashboard binding: `supplier` is the Worker-visible alias, while `demonstrations` is the actual bucket name. No credentials, account ID, or secret belong in the repository. If either value changes in Cloudflare, update the corresponding explicit value in `wrangler.jsonc`.

## Local development

Install the development dependency and run the unit tests:

```sh
npm install
npm test
```

Start the Worker locally:

```sh
npm run dev
```

Wrangler normally prints a URL such as `http://localhost:8787`. Local Wrangler R2 storage is separate from the production bucket, so requests return 404 until matching objects exist in the local R2 store. The unit tests use an in-memory binding substitute and do not read or modify the real bucket.

Run the complete repository check with:

```sh
npm run check
```

This runs the tests and creates a Wrangler deployment dry run. It does not deploy or upload static files.

## Deployment

Authenticate Wrangler with the Cloudflare account that owns the Worker and zone, then deploy the Worker code:

```sh
npx wrangler login
npm run deploy
```

The deployment does not upload `index.html`, `assets/`, `internals/`, `client/`, or any other static repository file. Populate or update the `demonstrations` bucket through the existing, separate bucket workflow.

For non-interactive CI, provide Cloudflare authentication through the CI secret store. Do not add API tokens, account IDs, or other credentials to source files.

## Cloudflare dashboard steps

Before production testing:

1. In the `mien.works` zone, delete or disable the old Redirect Rules and URL Rewrite Rules for this hostname.
2. In **Workers & Pages → demo-bucket → Settings → Bindings**, confirm the R2 binding is named `supplier` and points to the `demonstrations` bucket.
3. If `demo.mien.works` is still attached directly to the R2 bucket or another Worker, detach that old hostname assignment.
4. Deploy this Worker.
5. In **Workers & Pages → demo-bucket → Settings → Domains & Routes**, confirm `demo.mien.works` is an active Custom Domain with a valid certificate.
6. Confirm the Custom Domain has its Cloudflare-managed DNS record. Do not add a separate origin record for this Worker.

The Worker name, bucket name, binding name, compatibility date, and public hostname are already declared. The only manual value needed for deployment is valid Cloudflare authentication for the account that owns these resources.

## Production verification

After the old rules are disabled, the Worker is deployed, and the bucket contains the corresponding keys, verify:

```sh
curl -i https://demo.mien.works/
curl -i https://demo.mien.works/index.html
curl -i https://demo.mien.works/client/acme
curl -i https://demo.mien.works/client/acme/
curl -i https://demo.mien.works/client/acme/index.html
curl -I https://demo.mien.works/assets/favicon.svg
curl -I https://demo.mien.works/internals/output.js
curl -D - -o /dev/null -H 'Range: bytes=0-99' https://demo.mien.works/assets/webp/welding-840.webp
curl -i https://demo.mien.works/client/does-not-exist
curl -i -X POST https://demo.mien.works/
```

Expected results:

- The first five HTML requests return `200` without redirects and the two ACME root forms serve the same object.
- Shared assets return their stored MIME type and HTTP metadata.
- The valid range request returns `206` with `Content-Range` and the partial length.
- The missing client returns `404`, not the root homepage.
- The `POST` request returns `405` and advertises `GET, HEAD` in `Allow`.

The current ACME directory contains only `index.html`, so there is not yet a client-scoped asset URL to verify. Once one is uploaded, request its exact key, such as `/client/acme/assets/app.js`; the Worker will not append `index.html` to it.
