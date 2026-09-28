// State quản lý sinh viên
let allStudents = [];
let studentToDeleteId = null;

// Tải danh sách sinh viên từ API
async function loadStudents() {
    try {
        const res = await fetch('/students');
        if (!res.ok) throw new Error('Không thể tải dữ liệu sinh viên');
        allStudents = await res.json();
        updateStats();
        populateClassFilter();
        renderStudents();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

// Cập nhật các chỉ số thống kê
function updateStats() {
    const total = allStudents.length;
    const statTotalEl = document.getElementById('statTotalStudents');
    if (statTotalEl) statTotalEl.textContent = total;

    if (total === 0) {
        const avgEl = document.getElementById('statAvgScore');
        if (avgEl) avgEl.textContent = '0.0';
        const topEl = document.getElementById('statTopStudents');
        if (topEl) topEl.textContent = '0';
        const classEl = document.getElementById('statTotalClasses');
        if (classEl) classEl.textContent = '0';
        return;
    }

    const sumScore = allStudents.reduce((acc, s) => acc + (s.score || 0), 0);
    const avg = (sumScore / total).toFixed(2);
    const avgEl = document.getElementById('statAvgScore');
    if (avgEl) avgEl.textContent = avg;

    const topCount = allStudents.filter(s => s.score >= 8.0).length;
    const topEl = document.getElementById('statTopStudents');
    if (topEl) topEl.textContent = topCount;

    const classes = new Set(allStudents.map(s => s.class || s.class_name).filter(Boolean));
    const classEl = document.getElementById('statTotalClasses');
    if (classEl) classEl.textContent = classes.size;
}

// Đổ dữ liệu vào bộ lọc Lớp học
function populateClassFilter() {
    const filter = document.getElementById('classFilter');
    if (!filter) return;
    const currentVal = filter.value;
    const classes = Array.from(new Set(allStudents.map(s => s.class || s.class_name).filter(Boolean))).sort();
    
    filter.innerHTML = '<option value="ALL">Tất cả các lớp</option>';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = `Lớp ${c}`;
        filter.appendChild(opt);
    });
    if (classes.includes(currentVal)) {
        filter.value = currentVal;
    }
}

// Lọc và hiển thị danh sách sinh viên lên bảng
function renderStudents() {
    const searchInput = document.getElementById('searchInput');
    const classFilter = document.getElementById('classFilter');
    const rankFilter = document.getElementById('rankFilter');
    const sortByEl = document.getElementById('sortBy');

    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const classVal = classFilter ? classFilter.value : 'ALL';
    const rankVal = rankFilter ? rankFilter.value : 'ALL';
    const sortBy = sortByEl ? sortByEl.value : 'ID_DESC';

    let filtered = allStudents.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(search);
        const idMatch = String(s.id).includes(search);
        const classMatch = (s.class || s.class_name || '').toLowerCase().includes(search);
        const matchesSearch = !search || nameMatch || idMatch || classMatch;

        const matchesClass = (classVal === 'ALL') || (s.class || s.class_name) === classVal;

        const rank = getAcademicRank(s.score);
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

    const tbody = document.getElementById('studentTableBody');
    const empty = document.getElementById('emptyState');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';
    tbody.innerHTML = filtered.map(s => {
        const rank = getAcademicRank(s.score);
        const initials = getInitials(s.name);
        const avatarBg = getAvatarGradient(s.name);
        const className = s.class || s.class_name || 'Chưa xếp lớp';

        return `
            <tr>
                <td>
                    <strong style="color: var(--text-dim); font-size: 13px;">#${s.id}</strong>
                </td>
                <td>
                    <div class="student-info">
                        <div class="avatar" style="background: ${avatarBg};">${initials}</div>
                        <div>
                            <div class="student-name">${s.name}</div>
                            <div class="student-id">Mã định danh: SV-${s.id.toString().padStart(4, '0')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge-class">${className}</span>
                </td>
                <td>
                    <span class="badge-score ${rank.css}">
                        <i class="fa-solid ${rank.icon}"></i> ${s.score.toFixed(1)}
                    </span>
                </td>
                <td>
                    <span style="font-weight: 600; font-size: 13px;">${rank.label}</span>
                </td>
                <td style="text-align: right;">
                    <div class="action-btns" style="justify-content: flex-end;">
                        <button class="btn-action edit" onclick="editStudent(${s.id})" title="Chỉnh sửa" aria-label="Sửa sinh viên ${s.name}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-action delete" onclick="openDeleteModal(${s.id}, '${s.name.replace(/'/g, "\\'")}')" title="Xóa" aria-label="Xóa sinh viên ${s.name}">
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
    const studentModal = document.getElementById('studentModal');
    const studentForm = document.getElementById('studentForm');
    const deleteModal = document.getElementById('deleteConfirmModal');

    // Xem trước xếp loại điểm số
    const scoreInput = document.getElementById('studentScore');
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

    // Nút mở modal thêm sinh viên
    const openAddBtn = document.getElementById('openAddModalBtn');
    if (openAddBtn) {
        openAddBtn.addEventListener('click', () => {
            document.getElementById('modalTitle').textContent = 'Thêm Sinh Viên Mới';
            document.getElementById('studentId').value = '';
            studentForm.reset();
            document.getElementById('scoreRatingPreview').textContent = '--';
            studentModal.classList.add('active');
        });
    }

    function closeModal() {
        if (studentModal) studentModal.classList.remove('active');
    }

    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

    // Xử lý gửi form Thêm / Sửa sinh viên
    if (studentForm) {
        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('studentId').value;
            const name = document.getElementById('studentName').value.trim();
            const class_name = document.getElementById('studentClass').value.trim();
            const score = parseFloat(document.getElementById('studentScore').value);

            if (!name || !class_name || isNaN(score) || score < 0 || score > 10) {
                showToast('Vui lòng kiểm tra lại thông tin hợp lệ!', 'error');
                return;
            }

            const payload = { name, class: class_name, score };

            try {
                let res;
                if (id) {
                    // Update
                    res = await fetch(`/students/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // Create
                    res = await fetch('/students', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (!res.ok) throw new Error('Thao tác không thành công');
                
                showToast(id ? 'Đã cập nhật sinh viên thành công!' : 'Đã thêm sinh viên thành công!', 'success');
                closeModal();
                loadStudents();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
            }
        });
    }

    // Modal xóa
    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.remove('active');
        studentToDeleteId = null;
    }

    const delCloseBtn = document.getElementById('deleteModalCloseBtn');
    if (delCloseBtn) delCloseBtn.addEventListener('click', closeDeleteModal);
    const delCancelBtn = document.getElementById('deleteCancelBtn');
    if (delCancelBtn) delCancelBtn.addEventListener('click', closeDeleteModal);

    const confirmDelBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDelBtn) {
        confirmDelBtn.addEventListener('click', async () => {
            if (!studentToDeleteId) return;
            try {
                const res = await fetch(`/students/${studentToDeleteId}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Không thể xóa sinh viên');
                showToast('Đã xóa sinh viên thành công!', 'info');
                closeDeleteModal();
                loadStudents();
            } catch (err) {
                console.error(err);
                showToast(err.message, 'error');
            }
        });
    }

    // Bộ lọc sự kiện
    const searchEl = document.getElementById('searchInput');
    if (searchEl) searchEl.addEventListener('input', renderStudents);
    const classF = document.getElementById('classFilter');
    if (classF) classF.addEventListener('change', renderStudents);
    const rankF = document.getElementById('rankFilter');
    if (rankF) rankF.addEventListener('change', renderStudents);
    const sortF = document.getElementById('sortBy');
    if (sortF) sortF.addEventListener('change', renderStudents);

    // Khởi chạy dữ liệu
    loadStudents();
    checkHealth();
    setInterval(checkHealth, 15000);
});

// Chỉnh sửa sinh viên
window.editStudent = function(id) {
    const s = allStudents.find(item => item.id === id);
    if (!s) return;

    document.getElementById('modalTitle').textContent = `Chỉnh Sửa Sinh Viên #${s.id}`;
    document.getElementById('studentId').value = s.id;
    document.getElementById('studentName').value = s.name;
    document.getElementById('studentClass').value = s.class || s.class_name;
    document.getElementById('studentScore').value = s.score;
    
    const rank = getAcademicRank(s.score);
    const preview = document.getElementById('scoreRatingPreview');
    if (preview) {
        preview.textContent = `${rank.label} (${s.score.toFixed(1)})`;
        preview.style.color = s.score >= 8 ? 'var(--success)' : (s.score >= 6.5 ? 'var(--info)' : (s.score >= 5 ? 'var(--warning)' : 'var(--danger)'));
    }

    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.add('active');
};

// Mở modal xác nhận xóa
window.openDeleteModal = function(id, name) {
    studentToDeleteId = id;
    const nameEl = document.getElementById('deleteStudentName');
    if (nameEl) nameEl.textContent = name;
    const idEl = document.getElementById('deleteStudentId');
    if (idEl) idEl.textContent = id;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.add('active');
};
