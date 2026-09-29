document.addEventListener('DOMContentLoaded', () => {
    const lopTableBody = document.getElementById('lopTableBody');
    const lopSearchInput = document.getElementById('lopSearchInput');
    const lopModal = document.getElementById('lopModal');
    const lopForm = document.getElementById('lopForm');
    let lopList = [];
    let cnList = [];
    let nkList = [];

    async function fetchChuyenNganh() {
        try {
            const res = await fetch('/chuyennganh', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.ok) {
                cnList = await res.json();
                populateChuyenNganhDropdown();
            }
        } catch (e) {
            console.error("Error fetching chuyennganh", e);
        }
    }

    async function fetchNienKhoa() {
        try {
            const res = await fetch('/nienkhoa', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.ok) {
                nkList = await res.json();
                populateNienKhoaDropdown();
            }
        } catch (e) {
            console.error("Error fetching nienkhoa", e);
        }
    }

    function populateChuyenNganhDropdown() {
        const select = document.getElementById('lopMajorId');
        select.innerHTML = '<option value="">-- Chọn Chuyên Ngành --</option>';
        cnList.forEach(cn => {
            const opt = document.createElement('option');
            opt.value = cn.id;
            opt.textContent = `${cn.major_code} - ${cn.name}`;
            select.appendChild(opt);
        });
    }

    function populateNienKhoaDropdown() {
        const select = document.getElementById('lopCohortId');
        select.innerHTML = '<option value="">-- Chọn Niên Khóa --</option>';
        nkList.forEach(nk => {
            const opt = document.createElement('option');
            opt.value = nk.id;
            opt.textContent = `${nk.cohort_code} - ${nk.name}`;
            select.appendChild(opt);
        });
    }

    async function fetchLop() {
        try {
            const res = await fetch('/lop', {
                headers: { 'Accept': 'application/json' }
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (res.ok) {
                lopList = await res.json();
                renderTable(lopList);
            }
        } catch (e) {
            console.error("Error fetching lop", e);
        }
    }

    function renderTable(data) {
        lopTableBody.innerHTML = '';
        data.forEach(lop => {
            const cn = cnList.find(x => x.id === lop.major_id);
            const cnName = cn ? cn.name : 'Unknown';
            const nk = nkList.find(x => x.id === lop.cohort_id);
            const nkName = nk ? nk.name : 'Unknown';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${lop.class_code}</strong></td>
                <td>${lop.name}</td>
                <td><span class="badge badge-info">${cnName}</span></td>
                <td><span class="badge badge-warning">${nkName}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editLop(${lop.id})" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </td>
            `;
            lopTableBody.appendChild(tr);
        });
    }

    lopSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = lopList.filter(lop => lop.name.toLowerCase().includes(val) || lop.class_code.toLowerCase().includes(val));
        renderTable(filtered);
    });

    document.getElementById('openLopModalBtn').addEventListener('click', () => {
        document.getElementById('lopModalTitle').textContent = 'Thêm Lớp Mới';
        lopForm.reset();
        document.getElementById('lopId').value = '';
        lopModal.classList.add('active');
    });

    const closeModal = () => lopModal.classList.remove('active');
    document.getElementById('lopModalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('lopModalCancelBtn').addEventListener('click', closeModal);

    window.editLop = (id) => {
        const lop = lopList.find(x => x.id === id);
        if (lop) {
            document.getElementById('lopModalTitle').textContent = 'Cập Nhật Lớp';
            document.getElementById('lopId').value = lop.id;
            document.getElementById('lopCode').value = lop.class_code;
            document.getElementById('lopName').value = lop.name;
            document.getElementById('lopMajorId').value = lop.major_id;
            document.getElementById('lopCohortId').value = lop.cohort_id;
            lopModal.classList.add('active');
        }
    };

    lopForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('lopId').value;
        const payload = {
            class_code: document.getElementById('lopCode').value.trim(),
            name: document.getElementById('lopName').value.trim(),
            major_id: parseInt(document.getElementById('lopMajorId').value),
            cohort_id: parseInt(document.getElementById('lopCohortId').value)
        };
        try {
            const res = await fetch(id ? `/lop/${id}` : '/lop', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({icon: 'success', title: 'Thành công', text: data.message});
                closeModal();
                fetchLop();
            } else {
                Swal.fire({icon: 'error', title: 'Lỗi', text: data.error});
            }
        } catch (e) {
            Swal.fire({icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra'});
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await fetch('/logout', { method: 'POST' });
        window.location.href = '/login';
    });

    async function init() {
        await Promise.all([fetchChuyenNganh(), fetchNienKhoa()]);
        await fetchLop();
    }
    init();
});
