import { auth } from '../js/auth.js';
import { tools } from '../js/tools.js';

function setActiveToolButton(activeTool) {
    document.querySelectorAll('.tool-nav-btn').forEach((button) => {
        const isActive = button.dataset.tool === activeTool;
        button.classList.toggle('bg-slate-900', isActive);
        button.classList.toggle('text-white', isActive);
        button.classList.toggle('text-slate-700', !isActive);
        button.classList.toggle('hover:bg-slate-100', !isActive);
    });
}

function gotoTool(toolKey) {
    tools.setCurrentTool(toolKey);
    setActiveToolButton(toolKey);

    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page !== 'index.html') {
        window.location.href = `index.html?tool=${encodeURIComponent(toolKey)}`;
        return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('tool', toolKey);
    window.history.replaceState({}, '', nextUrl);
}

function renderNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return;

    const loggedIn = auth.isLoggedIn();
    tools.setAuthenticated(loggedIn);

    const currentTool = tools.getCurrentTool();
    const toolButtons = tools
        .getToolList()
        .map(
            (tool) =>
                `<button type="button" class="tool-nav-btn rounded-lg px-3 py-2 text-sm font-medium ${
                    tool.key === currentTool
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                }" data-tool="${tool.key}">${tool.title}</button>`
        )
        .join('');

    container.innerHTML = `
        <nav class="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
                <a href="index.html" class="text-2xl font-extrabold tracking-tight text-slate-900">DocEasy</a>
                ${
                    loggedIn
                        ? `
                <div class="flex flex-wrap items-center gap-2">
                    ${toolButtons}
                </div>
                `
                        : ''
                }
                <div class="flex items-center gap-2">
                    ${
                        loggedIn
                            ? `
                    <a href="dashboard.html" class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Dashboard</a>
                    <button id="logout-btn" class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">Logout</button>
                    `
                            : `
                    <a href="login.html" class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Login</a>
                    <a href="register.html" class="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700">Register</a>
                    `
                    }
                </div>
            </div>
        </nav>
    `;

    document.querySelectorAll('.tool-nav-btn').forEach((button) => {
        button.addEventListener('click', () => gotoTool(button.dataset.tool));
    });
    setActiveToolButton(currentTool);

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', auth.logout);
    }
}

document.addEventListener('DOMContentLoaded', renderNavbar);
window.addEventListener('tool:changed', (event) => {
    if (event?.detail?.tool) {
        setActiveToolButton(event.detail.tool);
    }
});
