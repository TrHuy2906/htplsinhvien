// Gradient Colors for Avatars
const avatarGradients = [
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #3b82f6, #06b6d4)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #14b8a6, #0284c7)'
];

function getAvatarGradient(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return avatarGradients[hash % avatarGradients.length];
}

function getInitials(name) {
    if (!name) return 'SV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAcademicRank(score) {
    if (score >= 9.0) return { label: 'Xuất sắc', css: 'score-excellent', icon: 'fa-crown', code: 'EXCELLENT' };
    if (score >= 8.0) return { label: 'Giỏi', css: 'score-good', icon: 'fa-award', code: 'GOOD' };
    if (score >= 6.5) return { label: 'Khá', css: 'score-good', icon: 'fa-thumbs-up', code: 'FAIR' };
    if (score >= 5.0) return { label: 'Trung bình', css: 'score-average', icon: 'fa-check', code: 'AVERAGE' };
    return { label: 'Yếu', css: 'score-poor', icon: 'fa-triangle-exclamation', code: 'POOR' };
}

// Toast helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info');
    const color = type === 'success' ? 'var(--success)' : (type === 'error' ? 'var(--danger)' : 'var(--info)');
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}" style="color: ${color}; font-size: 18px;"></i>
        <div style="font-size: 14px; font-weight: 500;">${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Check Health
async function checkHealth() {
    try {
        const res = await fetch('/health');
        const badge = document.getElementById('systemHealthBadge');
        const text = document.getElementById('systemHealthText');
        if (!badge || !text) return;
        if (res.ok) {
            badge.style.background = 'rgba(16, 185, 129, 0.15)';
            badge.style.color = 'var(--success)';
            text.textContent = 'Hệ thống Trực tuyến';
        } else {
            badge.style.background = 'rgba(239, 68, 68, 0.15)';
            badge.style.color = 'var(--danger)';
            text.textContent = 'Mất kết nối CSDL';
        }
    } catch (err) {
        const badge = document.getElementById('systemHealthBadge');
        const text = document.getElementById('systemHealthText');
        if (!badge || !text) return;
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.style.color = 'var(--danger)';
        text.textContent = 'Mất kết nối Backend';
    }
}

// Init theme toggle
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    if (themeBtn && themeIcon) {
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            if (current === 'light') {
                document.documentElement.removeAttribute('data-theme');
                themeIcon.className = 'fa-solid fa-moon';
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                themeIcon.className = 'fa-solid fa-sun';
                localStorage.setItem('theme', 'light');
            }
        });
    }

    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
    }
});
