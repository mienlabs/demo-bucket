import { resolve_asset_key } from "./resolve_asset_key.js";
import {
  create_object_response,
  create_range_not_satisfiable_response,
} from "./r2_object_response.js";

const supported_methods = new Set(["GET", "HEAD"]);

function create_text_response(message, status, method, headers) {
  return new Response(method === "HEAD" ? null : message, { status, headers });
}

function is_invalid_range_error(error) {
  return error instanceof Error && error.message.includes("(10039)");
}

export async function handle_request(request, env) {
  if (!supported_methods.has(request.method)) {
    return create_text_response("Method Not Allowed", 405, request.method, {
      Allow: "GET, HEAD",
    });
  }

  const request_url = new URL(request.url);
  const asset_key = resolve_asset_key(request_url.pathname);

  if (!asset_key) return create_text_response("Not Found", 404, request.method);

  let object;

  try {
    object = await env.supplier.get(asset_key, {
      onlyIf: request.headers,
      range: request.headers,
    });
  } catch (error) {
    if (!is_invalid_range_error(error)) throw error;

    const full_object = await env.supplier.head(asset_key);

    if (!full_object) {
      return create_text_response("Not Found", 404, request.method);
    }

    return create_range_not_satisfiable_response(full_object);
  }

  if (!object) return create_text_response("Not Found", 404, request.method);

  return create_object_response(object, request.method);
}

export default {
  fetch(request, env) {
    return handle_request(request, env);
  },
};
