import api from './axios';

/**
 * Downloads a generated report PDF through the authenticated API endpoint
 * rather than linking directly to its stored pdf_url — that URL can point at
 * the API server's own origin (different port than the client in dev) or at
 * S3, and a plain <a href> either 404s or skips auth. Fetching as a blob
 * through the api client works uniformly for local disk and S3-backed
 * storage alike.
 */
export async function downloadReport(reportId: string, filename = 'report.pdf') {
  const res = await api.get(`/admin/reports/${reportId}/download`, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
