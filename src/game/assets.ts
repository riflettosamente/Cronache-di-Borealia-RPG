export function asset(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const clean = path.replace(/^\/+/, "").replace(/^src\/assets\/game\//, "");
  return `/src/assets/game/${clean}`;
}
