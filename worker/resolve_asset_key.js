const client_root_pattern = /^\/client\/([^/]+)\/?$/;

export function resolve_asset_key(pathname) {
  if (pathname === "/" || pathname === "/index.html") return "index.html";
  if (pathname.startsWith("//")) return null;

  const client_root_match = pathname.match(client_root_pattern);

  if (client_root_match) {
    return `client/${client_root_match[1]}/index.html`;
  }

  const asset_key = pathname.startsWith("/") ? pathname.slice(1) : pathname;

  if (!asset_key || asset_key.includes("//")) return null;
  return asset_key;
}
