const DEFAULT_LOCAL_API_URL = 'http://localhost:8001';
const BROWSER_ORIGIN =
    window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : DEFAULT_LOCAL_API_URL;

export const API_BASE_URL =
    window.__API_BASE_URL__ ||
    localStorage.getItem('api_base_url') ||
    BROWSER_ORIGIN;
const REQUEST_TIMEOUT_MS = 120000;

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.timeout = REQUEST_TIMEOUT_MS;

axios.interceptors.request.use(
    (config) => {
        const url = config.url || '';
        const isAuthFreeRoute = url.startsWith('/users/login') || url.startsWith('/users/register');
        if (isAuthFreeRoute) {
            return config;
        }

        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const api = {
    register: (userData) => axios.post('/users/register', userData),
    login: ({ username, email, password }) => {
        const loginId = username || email;
        return axios.post(
            '/users/login',
            new URLSearchParams({
                username: loginId,
                password
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
    },
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post('/users/me/files', formData);
    },
    processTool: (tool, fileId) => axios.post(`/users/me/tools/${tool}/${fileId}`),
    downloadFile: (fileId) => axios.get(`/users/me/files/${fileId}`, { responseType: 'blob' }),
    getUserFiles: () => axios.get('/users/me/files'),
    deleteFile: (fileId) => axios.delete(`/users/me/files/${fileId}`)
};

export function parseFilenameFromDisposition(contentDisposition) {
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    if (!match) return null;

    const rawFilename = match[1] || match[2];
    if (!rawFilename) return null;

    try {
        return decodeURIComponent(rawFilename);
    } catch {
        return rawFilename;
    }
}

export function downloadBlob(blob, filename) {
    const fileUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(fileUrl);
}
