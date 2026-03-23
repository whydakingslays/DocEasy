export const ui = {
    showStatus: (id, message, type = 'info') => {
        const element = document.getElementById(id);
        if (!element) return;

        element.textContent = message;
        if (type === 'error') {
            element.className = 'min-h-5 text-sm text-red-600';
            return;
        }
        if (type === 'success') {
            element.className = 'min-h-5 text-sm text-green-700';
            return;
        }
        element.className = 'min-h-5 text-sm text-slate-600';
    }
};
