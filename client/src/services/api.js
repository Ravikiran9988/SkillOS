import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
    // In production build, default to the official Render backend URL
    if (import.meta.env.PROD) {
      return 'https://skillos.onrender.com/api';
    }
    return '/api';
  }
  let url = envUrl.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith('/api') && url !== '/api') {
    url = `${url}/api`;
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
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

// ─── Health ──────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health').then((r) => r.data);

// ─── Students ────────────────────────────────────────────────────────────────
export const getStudents = () => api.get('/students').then((r) => r.data.data);
export const getStudent = (id) => api.get(`/students/${id}`).then((r) => r.data.data);
export const createStudent = (data) => api.post('/students', data).then((r) => r.data.data);
export const getStudentSkills = (id) => api.get(`/students/${id}/skills`).then((r) => r.data.data);
export const addStudentSkill = (id, skillId, proficiency) =>
  api.post(`/students/${id}/skills`, { skillId, proficiency }).then((r) => r.data.data);
export const removeStudentSkill = (id, skillId) =>
  api.delete(`/students/${id}/skills/${skillId}`).then((r) => r.data);
export const setTargetCareer = (id, careerRoleId) =>
  api.post(`/students/${id}/target-career`, { careerRoleId }).then((r) => r.data.data);
export const getCareerMatch = (id, careerId) =>
  api.get(`/students/${id}/career-match`, careerId ? { params: { careerId } } : {}).then((r) => r.data.data);
export const getLearningPath = (id, careerId) =>
  api.get(`/students/${id}/learning-path`, { params: { careerId } }).then((r) => r.data.data);
export const getRecommendedJobs = (id) =>
  api.get(`/students/${id}/recommended-jobs`).then((r) => r.data.data);
export const getStudentGraph = (id) =>
  api.get(`/students/${id}/graph`).then((r) => r.data.data);

// ─── Careers ─────────────────────────────────────────────────────────────────
export const getCareers = () => api.get('/careers').then((r) => r.data.data);
export const getCareer = (id) => api.get(`/careers/${id}`).then((r) => r.data.data);
export const getCareerJobs = (id) => api.get(`/careers/${id}/jobs`).then((r) => r.data.data);
export const getCareerExploration = () => api.get('/careers/explore').then((r) => r.data.data);

// ─── Jobs ────────────────────────────────────────────────────────────────────
export const getJobs = () => api.get('/jobs').then((r) => r.data.data);
export const getJob = (id) => api.get(`/jobs/${id}`).then((r) => r.data.data);
export const getCompanies = () => api.get('/jobs/companies').then((r) => r.data.data);

// ─── Projects ────────────────────────────────────────────────────────────────
export const getProjects = () => api.get('/projects').then((r) => r.data.data);
export const getProjectSkills = (id) => api.get(`/projects/${id}/skills`).then((r) => r.data.data);
export const getTechnologies = () => api.get('/projects/technologies').then((r) => r.data.data);
export const getAllSkills = () => api.get('/projects/skills').then((r) => r.data.data);
export const createProject = (data) => api.post('/projects', data).then((r) => r.data.data);
