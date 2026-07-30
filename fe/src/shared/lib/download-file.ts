import { getAuthToken } from "./auth-token";

export async function downloadAuthenticatedFile(
  url: string,
  filename: string,
  init?: RequestInit
) {
  const token = getAuthToken();

  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const text = await response.text();
    let message = "Xuất file thất bại";
    try {
      message = JSON.parse(text).message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
