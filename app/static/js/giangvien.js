// State quản lý giảng viên
let allLecturers = [];
let lecturerToDeleteId = null;

// Tải danh sách giảng viên từ API
async function loadLecturers() {
    try {
        const res = await fetch('/lecturers');
        if (!res.ok) throw new Error('Không thể tải dữ liệu giảng viên');
        allLecturers = await res.json();
        updateStats();
        populateClassFilter();
        renderLecturers();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// Cập nhật các chỉ số thống kê
function updateStats() {
    const total = allLecturers.length;
    const statTotalEl = document.getElementById('statTotalLecturers');
    if (statTotalEl) statTotalEl.textContent = total;

    if (total === 0) {
        const avgEl = document.getElementById('statAvgScore');
        if (avgEl) avgEl.textContent = '0.0';
        const topEl = document.getElementById('statTopLecturers');
        if (topEl) topEl.textContent = '0';
        const classEl = document.getElementById('statTotalClasses');
        if (classEl) classEl.textContent = '0';
        return;
    }

    const sumScore = allLecturers.reduce((acc, s) => acc + (s.specialization || 0), 0);
    const avg = (sumScore / total).toFixed(2);
    const avgEl = document.getElementById('statAvgScore');
    if (avgEl) avgEl.textContent = avg;

    const topCount = allLecturers.filter(s => s.specialization >= 8.0).length;
    const topEl = document.getElementById('statTopLecturers');
    if (topEl) topEl.textContent = topCount;

    const classes = new Set(allLecturers.map(s => s.department_id).filter(Boolean));
    const classEl = document.getElementById('statTotalClasses');
    if (classEl) classEl.textContent = classes.size;
}

// Đổ dữ liệu vào bộ lọc Lớp học
function populateClassFilter() {
    const filter = document.getElementById('classFilter');
    if (!filter) return;
    const currentVal = filter.value;
    const classes = Array.from(new Set(allLecturers.map(s => s.department_id).filter(Boolean))).sort();

    filter.innerHTML = '<option value="ALL">Tất cả các lớp</option>';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `Mã bộ môn ${c}`;
        filter.appendChild(opt);
    });
    if (classes.includes(currentVal)) {
        filter.value = currentVal;
    }
}

// Lọc và hiển thị danh sách giảng viên lên bảng
function renderLecturers() {
    const searchInput = document.getElementById('searchInput');
    const classFilter = document.getElementById('classFilter');
    const rankFilter = document.getElementById('rankFilter');
    const sortByEl = document.getElementById('sortBy');

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const classVal = classFilter ? classFilter.value : 'ALL';
    const rankVal = rankFilter ? rankFilter.value : 'ALL';
    const sortBy = sortByEl ? sortByEl.value : 'ID_DESC';

    let filtered = allLecturers.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(search);
        const codeMatch = (s.lecturer_code || '').toLowerCase().includes(search);
        const classMatch = (s.department_id || '').toLowerCase().includes(search);
        const matchesSearch = !search || nameMatch || codeMatch || classMatch;

        const matchesClass = (classVal === 'ALL') || (s.department_id) === classVal;

        const rank = {label: s.education_level || "Chưa có", css: "info", icon: "fa-certificate"};
        const matchesRank = (rankVal === 'ALL') || (rank.code === rankVal);

        return matchesSearch && matchesClass && matchesRank;
    });

    // Sắp xếp
    filtered.sort((a, b) => {
        if (sortBy === 'ID_DESC') return b.id - a.id;
        if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name, 'vi');
        if (sortBy === 'SCORE_DESC') return b.score - a.score;
        if (sortBy === 'SCORE_ASC') return a.score - b.score;
        return 0;
    });

    const tbody = document.getElementById('lecturerTableBody');
    const empty = document.getElementById('emptyState');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    tbody.innerHTML = filtered.map(s => {
        const rank = {label: s.education_level || "Chưa có", css: "info", icon: "fa-certificate"};
        const initials = getInitials(s.name);
        const avatarBg = getAvatarGradient(s.name);
        const className = s.department_id || 'Chưa xếp lớp';

        return `
            <tr>
                <td>
                    <strong style="color: var(--text-dim); font-size: 13px;">${s.lecturer_code || 'Chưa có'}</strong>
                </td>
                <td>
                    <div class="lecturer-info">
                        <div class="avatar" style="background: ${avatarBg};">${initials}</div>
                        <div>
                            <div class="lecturer-name">${s.name}</div>
                            <div class="lecturer-id">${s.gender || ''}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 13px;">
                        <div><i class="fa-solid fa-envelope" style="color: var(--text-muted);"></i> ${s.email || 'Chưa có email'}</div>
                        <div style="margin-top: 4px;"><i class="fa-solid fa-user-gear" style="color: var(--text-muted);"></i> ID Tài khoản: ${s.account_id || 'Trống'}</div>
                    </div>
                </td>
                <td>
                    <span class="badge-class">${className}</span>
                </td>
                <td>
                    <span class="badge-score ${rank.css}">
                        <i class="fa-solid ${rank.icon}"></i> ${s.specialization || "Chưa cập nhật"}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 600; font-size: 13px;">${rank.label}</span>
                </td>
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn-action edit" onclick="editLecturer(${s.id})" title="Chỉnh sửa" aria-label="Sửa giảng viên ${s.name}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action delete" onclick="openDeleteModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Xóa" aria-label="Xóa giảng viên ${s.name}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Thiết lập các Modal và sự kiện khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    const lecturerModal = document.getElementById('lecturerModal');
    const lecturerForm = document.getElementById('lecturerForm');
    const deleteModal = document.getElementById('deleteConfirmModal');

    // Xem trước xếp loại điểm số
    const scoreInput = document.getElementById('lecturerScore');
    if (scoreInput) {
        scoreInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const preview = document.getElementById('scoreRatingPreview');
            if (!preview) return;
            if (isNaN(val) || val < 0 || val > 10) {
                preview.textContent = 'Điểm không hợp lệ (0-10)';
                preview.style.color = 'var(--danger)';
            } else {
                const rank = getAcademicRank(val);
                preview.textContent = `${rank.label} (${val.toFixed(1)})`;
                preview.style.color = val >= 8 ? 'var(--success)' : (val >= 6.5 ? 'var(--info)' : (val >= 5 ? 'var(--warning)' : 'var(--danger)'));
            }
        });
    }

    // Nút mở modal thêm giảng viên
    const openAddBtn = document.getElementById('openAddModalBtn');
    if (openAddBtn) {
        openAddBtn.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Thêm Giảng Viên Mới';
            document.getElementById('lecturerId').value = '';
            lecturerForm.reset();
            document.getElementById('scoreRatingPreview').textContent = '--';
            lecturerModal.classList.add('active');
        });
    }

    function closeModal() {
        if (lecturerModal) lecturerModal.classList.remove('active');
    }

    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

    // Xử lý gửi form Thêm / Sửa giảng viên
    if (lecturerForm) {
        lecturerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('lecturerId').value;
            const name = document.getElementById('lecturerName').value.trim();
            const class_name = document.getElementById('lecturerClass').value.trim();
            const score = document.getElementById('lecturerScore').value.trim();
            const lecturer_code = document.getElementById('lecturerCode').value.trim() || null;
            const gender = document.getElementById('lecturerGender').value || null;
            const email = document.getElementById('lecturerEmail').value.trim() || null;
            const research_direction = document.getElementById('lecturerResearch').value.trim() || null;
            const education_level = document.getElementById('lecturerEducation').value.trim() || null;
            const account_id = document.getElementById('lecturerAccountId').value ? parseInt(document.getElementById('lecturerAccountId').value) : null;

            if (!name || !class_name || !score) {
                showToast('Vui lòng kiểm tra lại thông tin hợp lệ!', 'error');
                return;
            }

            const payload = {
                name,
                class: class_name,
                score,
                lecturer_code,
                gender,
                email,
                account_id
            };

            try {
                let res;
                if (id) {
                    // Update
                    res = await fetch(`/lecturers/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // Create
                    res = await fetch('/lecturers', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (!res.ok) throw new Error('Thao tác không thành công');

                showToast(id ? 'Đã cập nhật giảng viên thành công!' : 'Đã thêm giảng viên thành công!', 'success');
                closeModal();
                loadLecturers();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
            }
        });
    }

    // Modal xóa
    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.remove('active');
        lecturerToDeleteId = null;
    }

    const delCloseBtn = document.getElementById('deleteModalCloseBtn');
    if (delCloseBtn) delCloseBtn.addEventListener('click', closeDeleteModal);
    const delCancelBtn = document.getElementById('deleteCancelBtn');
    if (delCancelBtn) delCancelBtn.addEventListener('click', closeDeleteModal);

    const confirmDelBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDelBtn) {
        confirmDelBtn.addEventListener('click', async () => {
            if (!lecturerToDeleteId) return;
            try {
                const res = await fetch(`/lecturers/${lecturerToDeleteId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Không thể xóa giảng viên');
                showToast('Đã xóa giảng viên thành công!', 'info');
                closeDeleteModal();
                loadLecturers();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
            }
        });
    }

    // Bộ lọc sự kiện
    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.addEventListener('input', renderLecturers);
    const classF = document.getElementById('classFilter');
    if (classF) classF.addEventListener('change', renderLecturers);
    const rankF = document.getElementById('rankFilter');
    if (rankF) rankF.addEventListener('change', renderLecturers);
    const sortF = document.getElementById('sortBy');
    if (sortF) sortF.addEventListener('change', renderLecturers);

    // Khởi chạy dữ liệu
    loadLecturers();
    checkHealth();
    setInterval(checkHealth, 15000);
});

// Chỉnh sửa giảng viên
window.editLecturer = function(id) {
    const s = allLecturers.find(item => item.id === id);
    if (!s) return;

    document.getElementById('modalTitle').textContent = `Chỉnh Sửa Giảng Viên #${s.id}`;
    document.getElementById('lecturerId').value = s.id;
    document.getElementById('lecturerName').value = s.name;
    document.getElementById('lecturerClass').value = s.department_id;
    document.getElementById('lecturerScore').value = s.specialization;
    document.getElementById('lecturerCode').value = s.lecturer_code || '';
    document.getElementById('lecturerGender').value = s.gender || '';
    document.getElementById('lecturerEmail').value = s.email || '';
    document.getElementById('lecturerResearch').value = s.research_direction || '';
    document.getElementById('lecturerEducation').value = s.education_level || '';
    document.getElementById('lecturerAccountId').value = s.account_id || '';

    const rank = {label: s.education_level || "Chưa có", css: "info", icon: "fa-certificate"};
    const preview = document.getElementById('scoreRatingPreview');
    if (preview) {
        preview.textContent = `${rank.label} (${s.specialization || "Chưa cập nhật"})`;
        preview.style.color = s.specialization >= 8 ? 'var(--success)' : (s.specialization >= 6.5 ? 'var(--info)' : (s.specialization >= 5 ? 'var(--warning)' : 'var(--danger)'));
    }

    const modal = document.getElementById('lecturerModal');
    if (modal) modal.classList.add('active');
};

// Mở modal xác nhận xóa
window.openDeleteModal = function(id, name) {
    lecturerToDeleteId = id;
    const nameEl = document.getElementById('deleteLecturerName');
    if (nameEl) nameEl.textContent = name;
    const idEl = document.getElementById('deleteLecturerId');
    if (idEl) idEl.textContent = id;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.add('active');
};
