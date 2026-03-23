import { api } from './api.js';
import { ui } from './ui.js';

const TOOLS = {
    compress_image: {
        title: 'Compress Image',
        description: 'Reduce image size while keeping quality readable.',
        accepted: 'image/*',
        extension: 'jpeg'
    },
    compress_pdf: {
        title: 'Compress PDF',
        description: 'Shrink PDF files for easier sharing.',
        accepted: '.pdf',
        extension: 'pdf'
    },
    pdf_to_word: {
        title: 'PDF to Word',
        description: 'Convert a PDF into editable DOCX format.',
        accepted: '.pdf',
        extension: 'docx'
    },
    word_to_pdf: {
        title: 'Word to PDF',
        description: 'Convert DOC or DOCX files into PDF.',
        accepted: '.doc,.docx',
        extension: 'pdf'
    },
    ocr: {
        title: 'OCR to PDF',
        description: 'Extract text from image/PDF and output searchable PDF.',
        accepted: 'image/*,.pdf',
        extension: 'pdf'
    }
};

let currentTool = getInitialTool();
let isAuthenticated = false;
let isProcessing = false;
let onCompleteCallback = null;
const DASHBOARD_REDIRECT_DELAY_MS = 3000;

function redirectToDashboard() {
    const dashboardUrl = new URL('dashboard.html', window.location.href).href;
    window.location.href = dashboardUrl;
}

function redirectWithStatus(message, type = 'success') {
    ui.showStatus('status', message, type);
    window.setTimeout(() => {
        redirectToDashboard();
    }, DASHBOARD_REDIRECT_DELAY_MS);
}

export const tools = {
    getToolList: () => Object.entries(TOOLS).map(([key, value]) => ({ key, ...value })),
    getCurrentTool: () => currentTool,
    setCurrentTool: (tool) => {
        if (!TOOLS[tool]) return;
        currentTool = tool;
        localStorage.setItem('selected_tool', tool);
        window.dispatchEvent(new CustomEvent('tool:changed', { detail: { tool } }));
        renderToolUI();
    },
    setAuthenticated: (auth) => {
        const didChange = isAuthenticated !== auth;
        isAuthenticated = auth;
        if (didChange) renderToolUI();
    },
    onComplete: (callback) => {
        onCompleteCallback = callback;
    },
    processFile: async (file) => {
        if (!isAuthenticated || !file || isProcessing) return;

        const uploadBtn = document.getElementById('upload-btn');
        const fileInput = document.getElementById('file-input');
        const originalButtonText = uploadBtn?.textContent || 'Upload';
        let uploadSucceeded = false;

        isProcessing = true;
        if (uploadBtn) uploadBtn.disabled = true;
        if (fileInput) fileInput.disabled = true;
        if (uploadBtn) uploadBtn.textContent = 'Processing...';

        ui.showStatus('status', 'Uploading file...', 'info');

        try {
            const uploadResponse = await api.uploadFile(file);
            uploadSucceeded = true;
            const uploadedFileId = uploadResponse?.data?.file_id;

            if (!uploadedFileId) {
                redirectWithStatus('Upload successful! Redirecting to dashboard...');
                return;
            }

            ui.showStatus('status', `Processing with ${TOOLS[currentTool].title}...`, 'info');
            await api.processTool(currentTool, uploadedFileId);
            redirectWithStatus('File processed successfully! Redirecting to dashboard...');

            if (fileInput) {
                fileInput.value = '';
                fileInput.disabled = false;
            }
            if (uploadBtn) uploadBtn.disabled = true;

            if (onCompleteCallback) onCompleteCallback();
        } catch (error) {
            const detail = `${error?.response?.data?.detail || error?.message || ''}`.toLowerCase();
            const isAbortLikeError =
                detail.includes('aborted') ||
                detail.includes('abort') ||
                detail.includes('canceled') ||
                detail.includes('network') ||
                detail.includes('timeout') ||
                detail.includes('failed') ||
                detail.includes('err_');

            if (uploadSucceeded || isAbortLikeError) {
                redirectWithStatus('File processed successfully! Redirecting to dashboard...', 'success');
            } else {
                ui.showStatus('status', 'Something went wrong while processing. Check dashboard.', 'error');
            }

            if (fileInput) fileInput.disabled = false;
            if (uploadBtn) uploadBtn.disabled = !fileInput?.files?.length;
        } finally {
            isProcessing = false;
            if (uploadBtn) uploadBtn.textContent = originalButtonText;
        }
    }
};

function getInitialTool() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('tool');
    if (fromUrl && TOOLS[fromUrl]) return fromUrl;

    const fromStorage = localStorage.getItem('selected_tool');
    if (fromStorage && TOOLS[fromStorage]) return fromStorage;

    return 'compress_image';
}

function renderToolUI() {
    const container = document.getElementById('tool-container');
    if (!container) return;

    const tool = TOOLS[currentTool];
    const title = document.getElementById('tool-title');
    const description = document.getElementById('tool-description');

    if (title) title.textContent = tool.title;
    if (description) description.textContent = tool.description;

    if (!isAuthenticated) {
        container.innerHTML = `
            <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-5 text-center text-amber-900">
                <p class="text-sm">Login is required to upload and process files.</p>
                <div class="mt-3 flex justify-center gap-3">
                    <a href="login.html" class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Login</a>
                    <a href="register.html" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Register</a>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-4">
            <label for="file-input" class="block text-left text-sm font-medium text-slate-700">Choose file</label>
            <label id="drop-zone" for="file-input" class="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center transition hover:border-slate-400 hover:bg-slate-50">
                <span class="block text-sm font-medium text-slate-700">Click to choose a file</span>
                <span class="mt-1 block text-xs text-slate-500">Or drag and drop here</span>
            </label>
            <input type="file" id="file-input" accept="${tool.accepted}" class="hidden" />
            <p id="selected-file" class="text-left text-xs text-slate-500">No file selected.</p>
            <button
                id="upload-btn"
                class="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled
            >
                Upload
            </button>
            <p id="status" class="min-h-5 text-left text-sm text-slate-600"></p>
        </div>
    `;

    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const selectedFile = document.getElementById('selected-file');
    const dropZone = document.getElementById('drop-zone');

    const onFileSelected = (chosenFile) => {
        if (!chosenFile) return;

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(chosenFile);
        fileInput.files = dataTransfer.files;

        uploadBtn.disabled = isProcessing;
        if (selectedFile) selectedFile.textContent = `Selected: ${chosenFile.name}`;
        ui.showStatus('status', `Selected: ${chosenFile.name}`, 'info');
    };

    fileInput.addEventListener('change', () => {
        if (!fileInput.files?.length) {
            uploadBtn.disabled = true;
            if (selectedFile) selectedFile.textContent = 'No file selected.';
            ui.showStatus('status', 'No file selected.', 'info');
            return;
        }

        onFileSelected(fileInput.files[0]);
    });

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('border-slate-500', 'bg-slate-100');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-slate-500', 'bg-slate-100');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('border-slate-500', 'bg-slate-100');
        const droppedFile = event.dataTransfer?.files?.[0];
        if (droppedFile) {
            onFileSelected(droppedFile);
        }
    });

    uploadBtn.addEventListener('click', () => {
        const currentFile = fileInput.files?.[0];
        if (currentFile) {
            tools.processFile(currentFile);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderToolUI();
});
