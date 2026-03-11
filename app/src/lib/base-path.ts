const basePath = import.meta.env.VITE_BASE_PATH
  ? import.meta.env.VITE_BASE_PATH.replace(/\/$/, "")
  : "";

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }

  if (!basePath || basePath === "/") {
    return path;
  }

  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path;
  }

  return `${basePath}${path}`;
}
