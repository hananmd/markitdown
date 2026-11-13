import type { BackendConversionResponse, BatchBackendResponse, HealthInfo } from '../types';

const API_BASE = '/api';

export async function getHealthInfo(): Promise<HealthInfo> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Failed to reach backend server');
  }
  return response.json();
}

export async function convertSinglePdf(file: File): Promise<BackendConversionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/convert`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Conversion failed with status ${response.status}`);
  }

  return response.json();
}

export async function convertBatchPdfs(files: File[]): Promise<BatchBackendResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${API_BASE}/convert/batch`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Batch conversion failed with status ${response.status}`);
  }

  return response.json();
}

export async function downloadZipArchive(
  items: Array<{ markdown_filename: string; content: string; word_count?: number; duration_ms?: number }>
): Promise<void> {
  const response = await fetch(`${API_BASE}/export/zip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate ZIP archive');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `markitdown_batch_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
