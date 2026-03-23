import { api, downloadBlob, parseFilenameFromDisposition } from './api.js';

function formatDate(value) {
    if (!value) return 'N/A';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';

    return parsed.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function isExpired(value) {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.getTime() < Date.now();
}

function setDashboardStatus(message, type = 'info') {
    const status = document.getElementById('dashboard-status');
    if (!status) return;

    status.textContent = message;
    if (type === 'error') {
        status.className = 'min-h-5 text-sm text-red-600';
        return;
    }
    if (type === 'success') {
        status.className = 'min-h-5 text-sm text-green-700';
        return;
    }
    status.className = 'min-h-5 text-sm text-slate-600';
}

export async function refreshDashboard() {
    const container = document.getElementById('file-history');
    if (!container) return;

    container.innerHTML = '<p class="text-sm text-slate-500">Loading files...</p>';
    setDashboardStatus('');

    let files = [];
    try {
        const response = await api.getUserFiles();
        files = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        container.innerHTML = '<p class="text-sm text-red-600">Unable to load files.</p>';
        const detail = error?.response?.data?.detail || error?.message || 'Unknown error';
        setDashboardStatus(detail, 'error');
        return;
    }

    if (!files.length) {
        container.innerHTML = '<p class="text-sm text-slate-500">No files yet.</p>';
        return;
    }

    container.innerHTML = '';

    files.forEach((file) => {
        const fileExpired = isExpired(file.expired_at);
        const fileType = file.tool ? 'Processed' : 'Uploaded';

        const card = document.createElement('article');
        card.className = `rounded-xl border bg-white p-4 shadow-sm ${
            fileExpired ? 'border-amber-300' : 'border-slate-200'
        }`;

        const title = document.createElement('h3');
        title.className = 'truncate text-base font-semibold text-slate-900';
        title.textContent = file.original_filename || `file_${file.file_id}`;

        const meta = document.createElement('p');
        meta.className = 'mt-1 text-xs text-slate-500';
        meta.textContent = `Type: ${fileType}${file.tool ? ` | Tool: ${file.tool}` : ''}`;

        const timeMeta = document.createElement('p');
        timeMeta.className = 'mt-1 text-xs text-slate-500';
        timeMeta.textContent = `Created: ${formatDate(file.created_at)} | Expires: ${formatDate(file.expired_at)}`;

        const expiryBadge = document.createElement('p');
        expiryBadge.className = `mt-2 text-xs font-medium ${
            fileExpired ? 'text-amber-700' : 'text-emerald-700'
        }`;
        expiryBadge.textContent = fileExpired ? 'Expired' : 'Active (3-day expiry)';

        const actions = document.createElement('div');
        actions.className = 'mt-4 flex flex-wrap gap-2';

        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.className = 'rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300';
        downloadBtn.textContent = fileExpired ? 'Expired' : 'Download';
        downloadBtn.disabled = fileExpired;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300';
        deleteBtn.textContent = 'Delete';

        downloadBtn.addEventListener('click', async () => {
            downloadBtn.disabled = true;
            deleteBtn.disabled = true;
            setDashboardStatus('Downloading file...', 'info');

            try {
                const response = await api.downloadFile(file.file_id);
                const filename =
                    parseFilenameFromDisposition(response.headers['content-disposition']) ||
                    file.original_filename ||
                    `file_${file.file_id}`;
                downloadBlob(response.data, filename);
                setDashboardStatus('Download completed.', 'success');
            } catch (error) {
                const detail = error?.response?.data?.detail || error?.message || 'Download failed';
                setDashboardStatus(detail, 'error');
            } finally {
                downloadBtn.disabled = false;
                deleteBtn.disabled = false;
            }
        });

        deleteBtn.addEventListener('click', async () => {
            const shouldDelete = window.confirm('Delete this file permanently?');
            if (!shouldDelete) return;

            downloadBtn.disabled = true;
            deleteBtn.disabled = true;
            setDashboardStatus('Deleting file...', 'info');

            try {
                await api.deleteFile(file.file_id);
                setDashboardStatus('File deleted.', 'success');
                await refreshDashboard();
            } catch (error) {
                const detail = error?.response?.data?.detail || error?.message || 'Delete failed';
                setDashboardStatus(detail, 'error');
                downloadBtn.disabled = false;
                deleteBtn.disabled = false;
            }
        });

        actions.appendChild(downloadBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(timeMeta);
        card.appendChild(expiryBadge);
        card.appendChild(actions);
        container.appendChild(card);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('file-history')) {
        refreshDashboard();
    }
});
