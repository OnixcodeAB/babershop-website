import { httpClient } from '../../client/shared/api';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export interface AdminSessionResponse {
  user: AdminUser;
}

export async function fetchAdminSession(): Promise<AdminSessionResponse> {
  const response = await httpClient.get<AdminSessionResponse>('/auth/session');
  return response.data;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export async function loginAdmin(payload: AdminLoginPayload): Promise<void> {
  await httpClient.post('/auth/login', payload);
}

export async function logoutAdmin(): Promise<void> {
  await httpClient.post('/auth/logout');
}


