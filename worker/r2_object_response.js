function resolve_range(range, object_size) {
  if ("suffix" in range) {
    const length = Math.min(range.suffix, object_size);
    return { offset: object_size - length, length };
  }

  const offset = range.offset ?? 0;
  const length = Math.min(range.length ?? object_size - offset, object_size - offset);

  return { offset, length };
}

function create_object_headers(object) {
  const headers = new Headers();

  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(object.size));
  headers.set("ETag", object.httpEtag);
  headers.set("Last-Modified", object.uploaded.toUTCString());

  return headers;
}

export function create_object_response(object, method) {
  const headers = create_object_headers(object);

  if (!("body" in object)) {
    headers.delete("Content-Length");
    return new Response(null, { status: 412, headers });
  }

  let status = 200;

  if (object.range) {
    const { offset, length } = resolve_range(object.range, object.size);
    const end = offset + length - 1;

    headers.set("Content-Length", String(length));
    headers.set("Content-Range", `bytes ${offset}-${end}/${object.size}`);
    status = 206;
  }

  return new Response(method === "HEAD" ? null : object.body, { status, headers });
}

export function create_range_not_satisfiable_response(object) {
  const headers = create_object_headers(object);

  headers.delete("Content-Length");
  headers.set("Content-Range", `bytes */${object.size}`);

  return new Response(null, { status: 416, headers });
}
