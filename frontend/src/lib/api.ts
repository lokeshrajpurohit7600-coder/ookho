import { UploadResponse, DetectionReport, HistoryResponse } from './types';

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  // When running locally in browser on port 3000, route to local FastAPI backend on port 8000
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000') {
      return 'http://localhost:8000';
    }
  }
  // In production / Vercel, keep URLs relative on the same domain
  return '';
}

function getSessionHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('aookho_session_id');
    if (!sessionId) {
      try {
        sessionId = crypto.randomUUID();
      } catch {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      localStorage.setItem('aookho_session_id', sessionId);
    }
    headers['X-Session-ID'] = sessionId;

    const token = localStorage.getItem('aookho_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

function parseErrorMessage(errorData: any, status: number): string {
  if (errorData?.error?.message) {
    return errorData.error.message;
  }
  if (typeof errorData?.detail === 'string') {
    return errorData.detail;
  }
  if (Array.isArray(errorData?.detail)) {
    return errorData.detail.map((d: any) => d.msg || d.message).join(', ');
  }
  return `Request failed with HTTP ${status}`;
}

export async function uploadMediaFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}/api/uploads`, {
    method: 'POST',
    headers: getSessionHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, response.status));
  }

  const data = await response.json();
  return {
    ...data,
    upload_id: data.upload_id || data.id,
  };
}

export async function uploadTextSnippet(text: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('text_content', text);

  const response = await fetch(`${getApiBaseUrl()}/api/uploads`, {
    method: 'POST',
    headers: getSessionHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, response.status));
  }

  const data = await response.json();
  return {
    ...data,
    upload_id: data.upload_id || data.id,
  };
}

export async function getReport(uploadId: string): Promise<DetectionReport> {
  const response = await fetch(`${getApiBaseUrl()}/api/reports/${uploadId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getSessionHeaders(),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, response.status));
  }

  return response.json();
}

export async function getSearchHistory(limit: number = 10, offset: number = 0): Promise<HistoryResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/history?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...getSessionHeaders(),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, response.status));
  }

  return response.json();
}

export async function deleteUpload(uploadId: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/uploads/${uploadId}`, {
    method: 'DELETE',
    headers: getSessionHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, response.status));
  }
}

export async function sendChatMessage(
  uploadId: string, 
  message: string, 
  language: string = 'english'
): Promise<{ reply: string; session_id: string; transcript: any[] }> {
  const response = await fetch(`${getApiBaseUrl()}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getSessionHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify({
      upload_id: uploadId,
      message,
      language
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, response.status));
  }

  return response.json();
}
