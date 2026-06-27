/**
 * Apex City - Community Hero — Frontend API Client
 * All calls proxy through Vite → http://localhost:3001
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── Token Management ─────────────────────────────────────────────────────

export function getToken() {
  return localStorage.getItem('ch_token');
}

export function setToken(token) {
  localStorage.setItem('ch_token', token);
}

export function clearToken() {
  localStorage.removeItem('ch_token');
  localStorage.removeItem('ch_user');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('ch_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem('ch_user', JSON.stringify(user));
}

// ── HTTP Helpers ──────────────────────────────────────────────────────────

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const options = {
    method,
    headers,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined
  };

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  postForm: (path, formData) => request('POST', path, formData, true),
};

// ── Auth ──────────────────────────────────────────────────────────────────

export async function login(credentials) {
  const res = await request('POST', '/auth/login', credentials);
  if (res.requiresRegistration) {
    return res;
  }
  setToken(res.token);
  setStoredUser(res.user);
  return res;
}

import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export async function getMe() {
  return api.get('/auth/me');
}

export function logout() {
  clearToken();
  signOut(auth).catch((err) => console.warn('Firebase signout failed:', err.message));
}

// ── Issues ────────────────────────────────────────────────────────────────

export async function getIssues(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/issues${qs ? '?' + qs : ''}`);
}

export async function getIssue(id) {
  return api.get(`/issues/${id}`);
}

export async function submitIssue({ title, type, lat, lng, address, description, severity, category, photo }) {
  const form = new FormData();
  form.append('title', title || `${category} Incident`);
  form.append('type', type || 'other');
  if (lat) form.append('lat', lat);
  if (lng) form.append('lng', lng);
  if (address) form.append('address', address);
  if (description) form.append('description', description);
  if (severity) form.append('severity', severity);
  if (category) form.append('category', category);
  if (photo) form.append('photo', photo);
  return api.postForm('/issues', form);
}

export async function updateIssueStatus(id, status) {
  return api.patch(`/issues/${id}/status`, { status });
}

// ── AI Analysis ───────────────────────────────────────────────────────────

export async function analyzePhoto(photo) {
  const form = new FormData();
  form.append('photo', photo);
  return api.postForm('/analyze', form);
}

// ── Missions ──────────────────────────────────────────────────────────────

export async function getMissions(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/missions${qs ? '?' + qs : ''}`);
}

export async function getMission(id) {
  return api.get(`/missions/${id}`);
}

export async function acceptMission(id) {
  return api.post(`/missions/${id}/accept`);
}

export async function uploadBeforePhoto(missionId, photo) {
  const form = new FormData();
  form.append('photo', photo);
  return api.postForm(`/missions/${missionId}/before-photo`, form);
}

export async function uploadAfterPhoto(missionId, photo) {
  const form = new FormData();
  form.append('photo', photo);
  return api.postForm(`/missions/${missionId}/after-photo`, form);
}

export async function verifyMission(missionId, verdict) {
  return api.post(`/missions/${missionId}/verify`, { verdict });
}

// ── Users ─────────────────────────────────────────────────────────────────

export async function getUser(id) {
  return api.get(`/users/${id}`);
}

export async function updateUser(id, data) {
  return api.patch(`/users/${id}`, data);
}

// ── Leaderboard ───────────────────────────────────────────────────────────

export async function getLeaderboard(scope = 'national', params = {}) {
  const qs = new URLSearchParams({ scope, ...params }).toString();
  return api.get(`/leaderboard?${qs}`);
}

// ── Stats ─────────────────────────────────────────────────────────────────

export async function getStats() {
  return api.get('/stats');
}

// ── Achievements ──────────────────────────────────────────────────────────

export async function getAchievements(userId) {
  return api.get(`/achievements/${userId}`);
}

// ── Health Check ──────────────────────────────────────────────────────────

export async function healthCheck() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export default api;
