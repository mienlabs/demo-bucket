import assert from "node:assert/strict";
import test from "node:test";

import { handle_request } from "../worker/index.js";
import { resolve_asset_key } from "../worker/resolve_asset_key.js";

const routing_cases = [
  ["root", "/", "index.html"],
  ["root index", "/index.html", "index.html"],
  ["client without slash", "/client/acme", "client/acme/index.html"],
  ["client with slash", "/client/acme/", "client/acme/index.html"],
  ["client CSS", "/client/acme/style.css", "client/acme/style.css"],
  ["nested client asset", "/client/acme/assets/app.js", "client/acme/assets/app.js"],
  ["shared root asset", "/assets/favicon.svg", "assets/favicon.svg"],
  ["shared internal script", "/internals/output.js", "internals/output.js"],
  ["explicit client index", "/client/acme/index.html", "client/acme/index.html"],
];

function create_object(overrides = {}) {
  const object = {
    size: 4,
    httpEtag: '"asset-etag"',
    uploaded: new Date("2026-08-05T18:00:00.000Z"),
    body: "demo",
    writeHttpMetadata(headers) {
      headers.set("Cache-Control", "public, max-age=3600");
      headers.set("Content-Encoding", "gzip");
      headers.set("Content-Type", "text/plain; charset=utf-8");
    },
    ...overrides,
  };

  if (overrides.without_body) {
    delete object.body;
    delete object.without_body;
  }

  return object;
}

for (const [case_name, pathname, expected_key] of routing_cases) {
  test(case_name, () => {
    assert.equal(resolve_asset_key(pathname), expected_key);
  });
}

test("nested client paths are not client roots", () => {
  assert.equal(resolve_asset_key("/client/acme/images"), "client/acme/images");
  assert.equal(
    resolve_asset_key("/client/acme/images/hero.webp"),
    "client/acme/images/hero.webp",
  );
});

test("resolved keys never contain double slashes", () => {
  for (const [, pathname] of routing_cases) {
    assert.equal(resolve_asset_key(pathname)?.includes("//"), false);
  }

  assert.equal(resolve_asset_key("/client/acme//images/hero.webp"), null);
  assert.equal(resolve_asset_key("//assets/favicon.svg"), null);
});

test("missing client index returns 404", async () => {
  let requested_key;
  const env = {
    supplier: {
      get(key) {
        requested_key = key;
        return null;
      },
    },
  };

  const response = await handle_request(
    new Request("https://demo.mien.works/client/missing"),
    env,
  );

  assert.equal(response.status, 404);
  assert.equal(requested_key, "client/missing/index.html");
  assert.equal(await response.text(), "Not Found");
});

test("GET streams an object with its HTTP metadata", async () => {
  let requested_key;
  let get_options;
  const env = {
    supplier: {
      get(key, options) {
        requested_key = key;
        get_options = options;
        return create_object();
      },
    },
  };

  const response = await handle_request(
    new Request("https://demo.mien.works/client/acme?preview=true"),
    env,
  );

  assert.equal(requested_key, "client/acme/index.html");
  assert.equal(get_options.onlyIf instanceof Headers, true);
  assert.equal(get_options.range instanceof Headers, true);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Accept-Ranges"), "bytes");
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=3600");
  assert.equal(response.headers.get("Content-Encoding"), "gzip");
  assert.equal(response.headers.get("Content-Length"), "4");
  assert.equal(response.headers.get("Content-Type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("ETag"), '"asset-etag"');
  assert.equal(response.headers.get("Last-Modified"), "Wed, 05 Aug 2026 18:00:00 GMT");
  assert.equal(await response.text(), "demo");
});

test("HEAD returns object headers without a body", async () => {
  const env = {
    supplier: {
      get() {
        return create_object();
      },
    },
  };

  const response = await handle_request(
    new Request("https://demo.mien.works/assets/favicon.svg", { method: "HEAD" }),
    env,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Length"), "4");
  assert.equal(await response.text(), "");
});

test("Range requests return partial-content headers", async () => {
  let range_header;
  const env = {
    supplier: {
      get(_key, options) {
        range_header = options.range.get("Range");
        return create_object({
          size: 200,
          range: { offset: 0, length: 100 },
        });
      },
    },
  };

  const response = await handle_request(
    new Request("https://demo.mien.works/assets/example.webp", {
      headers: { Range: "bytes=0-99" },
    }),
    env,
  );

  assert.equal(range_header, "bytes=0-99");
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Length"), "100");
  assert.equal(response.headers.get("Content-Range"), "bytes 0-99/200");
});

test("failed R2 preconditions return 412", async () => {
  const env = {
    supplier: {
      get() {
        return create_object({ without_body: true });
      },
    },
  };

  const response = await handle_request(
    new Request("https://demo.mien.works/assets/favicon.svg", {
      headers: { "If-Match": '"different-etag"' },
    }),
    env,
  );

  assert.equal(response.status, 412);
  assert.equal(response.headers.get("Content-Length"), null);
});

test("unsatisfiable ranges return 416 with the object size", async () => {
  const env = {
    supplier: {
      get() {
        throw new Error("The requested range is not satisfiable (10039)");
      },
      head() {
        return create_object({ size: 200 });
      },
    },
  };

  const response = await handle_request(
    new Request("https://demo.mien.works/assets/example.webp", {
      headers: { Range: "bytes=999-1000" },
    }),
    env,
  );

  assert.equal(response.status, 416);
  assert.equal(response.headers.get("Content-Length"), null);
  assert.equal(response.headers.get("Content-Range"), "bytes */200");
});

test("unsupported methods return 405 without reading R2", async () => {
  let was_object_requested = false;
  const env = {
    supplier: {
      get() {
        was_object_requested = true;
        return create_object();
      },
    },
  };

  const response = await handle_request(
    new Request("https://demo.mien.works/", { method: "POST" }),
    env,
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, HEAD");
  assert.equal(was_object_requested, false);
});
