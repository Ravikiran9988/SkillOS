import axios from 'axios';

// ─── Base URL ─────────────────────────────────────────────────────────────────
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    if (import.meta.env.PROD) return 'https://skillos.onrender.com/api';
    return '/api';
  }
  let url = envUrl.trim().replace(/\/$/, '');
  if (!url.endsWith('/api') && url !== '/api') url = `${url}/api`;
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor — attach JWT access token ───────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor — auto-refresh on 401 ──────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (
      err.response?.status === 401 &&
      err.response?.data?.error === 'token_expired' &&
      !original._retry
    ) {
      original._retry = true;

      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem('skillos_refresh_token');

      try {
        const res = await axios.post(`${getBaseUrl()}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data;
        localStorage.setItem('skillos_token', accessToken);
        if (newRefresh) localStorage.setItem('skillos_refresh_token', newRefresh);

        refreshQueue.forEach(({ resolve }) => resolve(accessToken));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr));
        refreshQueue = [];
        // Force logout
        localStorage.removeItem('skillos_token');
        localStorage.removeItem('skillos_refresh_token');
        localStorage.removeItem('skillos_user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      err.response?.data?.message ||
      (err.code === 'ERR_NETWORK'
        ? 'Cannot reach the SkillOS server. Is it running?'
        : err.message || 'An unexpected error occurred.');
    const status = err.response?.status || 0;
    const error = new Error(message);
    error.status = status;
    error.data = err.response?.data;
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data).then((r) => r.data);
export const register = (data) => api.post('/auth/register', data).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data.student);
export const refreshToken = (rt) => api.post('/auth/refresh', { refreshToken: rt }).then((r) => r.data);
export const logoutApi = (rt) => api.post('/auth/logout', { refreshToken: rt }).then((r) => r.data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data);
export const resetPassword = (data) => api.post('/auth/reset-password', data).then((r) => r.data);
export const verifyEmail = (token) => api.post('/auth/verify-email', { token }).then((r) => r.data);
export const getDemoStudents = () => api.get('/auth/demo-students').then((r) => r.data.students);

// ─── Health ───────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health').then((r) => r.data);

// ─── /me endpoints (authenticated user's own data) ────────────────────────────
export const getMyProfile = () => api.get('/students/me').then((r) => r.data.data);
export const updateMyProfile = (data) => api.put('/students/me', data).then((r) => r.data.data);
export const getMySkills = () => api.get('/students/me/skills').then((r) => r.data.data);
export const addMySkill = (skillId, proficiency) =>
  api.post('/students/me/skills', { skillId, proficiency }).then((r) => r.data.data);
export const removeMySkill = (skillId) =>
  api.delete(`/students/me/skills/${skillId}`).then((r) => r.data);
export const setMyTargetCareer = (careerRoleId) =>
  api.post('/students/me/target-career', { careerRoleId }).then((r) => r.data.data);
export const getMyCareerMatch = (careerId) =>
  api.get('/students/me/career-match', careerId ? { params: { careerId } } : {}).then((r) => r.data.data);
export const getMyLearningPath = (careerId) =>
  api.get('/students/me/learning-path', careerId ? { params: { careerId } } : {}).then((r) => r.data.data);
export const getMyJobs = () => api.get('/students/me/recommended-jobs').then((r) => r.data.data);
export const getMyGraph = () => api.get('/students/me/graph').then((r) => r.data.data);

// ─── Legacy /:id endpoints (backward compat, still protected) ────────────────
export const getStudent = (id) => api.get(`/students/${id}`).then((r) => r.data.data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data).then((r) => r.data.data);
export const getCareerMatch = (id, careerId) =>
  api.get(`/students/${id}/career-match`, careerId ? { params: { careerId } } : {}).then((r) => r.data.data);
export const getLearningPath = (id, careerId) =>
  api.get(`/students/${id}/learning-path`, { params: { careerId } }).then((r) => r.data.data);
export const getRecommendedJobs = (id) =>
  api.get(`/students/${id}/recommended-jobs`).then((r) => r.data.data);

// ─── Careers ─────────────────────────────────────────────────────────────────
export const getCareers = (params) => api.get('/careers', { params }).then((r) => r.data.data);
export const getCareer = (id) => api.get(`/careers/${id}`).then((r) => r.data.data);
export const getCareerJobs = (id) => api.get(`/careers/${id}/jobs`).then((r) => r.data.data);
export const getCareerExploration = () => api.get('/careers/explore').then((r) => r.data.data);

// ─── Jobs ────────────────────────────────────────────────────────────────────
export const getJobs = (params) => api.get('/jobs', { params }).then((r) => r.data.data);
export const getJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data.data);

// ─── Projects ────────────────────────────────────────────────────────────────
export const getProjects = () => api.get('/projects').then((r) => r.data.data);
export const getProjectSkills = (id) => api.get(`/projects/${id}/skills`).then((r) => r.data.data);
export const getTechnologies = () => api.get('/projects/technologies').then((r) => r.data.data);
export const getAllSkills = () => api.get('/projects/skills').then((r) => r.data.data);
export const createProject = (data) => api.post('/projects', data).then((r) => r.data.data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data).then((r) => r.data.data);
export const deleteProject = (id) => api.delete(`/projects/${id}`).then((r) => r.data);

// ─── AI Career Copilot ───────────────────────────────────────────────────────
export const careerChat = (message, history = []) =>
  api.post('/ai/career-chat', { message, history }).then((r) => r.data.data);
export const getAiStatus = () =>
  api.get('/ai/status').then((r) => r.data.data).catch(() => null);
export const evaluateInterview = (question, answer) =>
  api.post('/ai/interview-eval', { question, answer }).then((r) => r.data.data);
export const generateResumeSummary = (targetRole) =>
  api.post('/ai/resume-summary', { targetRole }).then((r) => r.data.data);

// ─── Saved Items ─────────────────────────────────────────────────────────────
export const getSavedItems = () => api.get('/students/me/saved').then((r) => r.data.data).catch(() => []);
export const saveItem = (type, itemId) =>
  api.post('/students/me/saved', { type, itemId }).then((r) => r.data.data).catch(() => null);
export const unsaveItem = (savedId) =>
  api.delete(`/students/me/saved/${savedId}`).then((r) => r.data).catch(() => null);

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = () => api.get('/students/me/notifications').then((r) => r.data.data).catch(() => []);
export const markNotificationRead = (id) =>
  api.patch(`/students/me/notifications/${id}/read`).then((r) => r.data).catch(() => null);

// ─── Backward-compat aliases (for existing pages that haven't been rewritten) ─
export const getStudentSkills = (id) => api.get(`/students/${id}/skills`).then((r) => r.data.data);
export const addStudentSkill = (id, skillId, proficiency) =>
  api.post(`/students/${id}/skills`, { skillId, proficiency }).then((r) => r.data.data);
export const removeStudentSkill = (id, skillId) =>
  api.delete(`/students/${id}/skills/${skillId}`).then((r) => r.data);
export const setTargetCareer = (id, careerRoleId) =>
  api.post(`/students/${id}/target-career`, { careerRoleId }).then((r) => r.data.data);
export const askCareerCopilot = (id, message) => api.post('/ai/career-chat', { message }).then((r) => r.data.data);
export const getAllCareers = (params) => getCareers(params);
export const getStudents = () => Promise.resolve([]); // disabled — stub to prevent crashes
export const getStudentById = (id) => getStudent(id);
export const getStudentGraph = (id) =>
  id === 'me'
    ? getMyGraph()
    : api.get(`/students/${id}/graph`).then((r) => r.data.data);
