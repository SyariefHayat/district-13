export async function downloadReportExport(
  authorizedFetch: (url: string, init?: RequestInit) => Promise<Response>,
  type: string,
  format: "xlsx" | "csv",
  filters: Record<string, any> = {}
): Promise<void> {
  const params = new URLSearchParams();
  params.set("format", format);

  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.productId) params.set("productId", filters.productId);
  if (filters.shiftId) params.set("shiftId", filters.shiftId);
  if (filters.status) params.set("status", filters.status);

  const res = await authorizedFetch(
    `/reports/${type}/export?${params.toString()}`
  );

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const msg =
      errorBody?.message || `Gagal mengekspor laporan (${res.status})`;
    throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
  }

  const blob = await res.blob();
  const filename = `laporan-${type}-${new Date().toISOString().slice(0, 10)}.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
