document.addEventListener('DOMContentLoaded', () => {
    // Khoa Logic
    const khoaTableBody = document.getElementById('khoaTableBody');
    const khoaSearchInput = document.getElementById('khoaSearchInput');
    const khoaModal = document.getElementById('khoaModal');
    const khoaForm = document.getElementById('khoaForm');
    let khoasList = [];

    async function fetchKhoas() {
        try {
            const res = await fetch('/khoa');
            if (res.status === 401) { window.location.href = '/login'; return; }
            khoasList = await res.json();
            renderKhoas(khoasList);
            populateKhoaDropdown();
        } catch (e) {
            console.error("Error fetching khoa", e);
        }
    }

    function renderKhoas(data) {
        khoaTableBody.innerHTML = '';
        data.forEach(k => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${k.khoa_code}</strong></td>
                <td>${k.name}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editKhoa(${k.id})" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </td>
            `;
            khoaTableBody.appendChild(tr);
        });
    }

    khoaSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = khoasList.filter(k => k.name.toLowerCase().includes(val) || k.khoa_code.toLowerCase().includes(val));
        renderKhoas(filtered);
    });

    document.getElementById('openKhoaModalBtn').addEventListener('click', () => {
        document.getElementById('khoaModalTitle').textContent = 'Thêm Khoa Mới';
        khoaForm.reset();
        document.getElementById('khoaId').value = '';
        khoaModal.classList.add('active');
    });

    const closeKhoaModal = () => khoaModal.classList.remove('active');
    document.getElementById('khoaModalCloseBtn').addEventListener('click', closeKhoaModal);
    document.getElementById('khoaModalCancelBtn').addEventListener('click', closeKhoaModal);

    window.editKhoa = (id) => {
        const k = khoasList.find(x => x.id === id);
        if (k) {
            document.getElementById('khoaModalTitle').textContent = 'Cập Nhật Khoa';
            document.getElementById('khoaId').value = k.id;
            document.getElementById('khoaCode').value = k.khoa_code;
            document.getElementById('khoaName').value = k.name;
            khoaModal.classList.add('active');
        }
    };

    khoaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('khoaId').value;
        const payload = {
            khoa_code: document.getElementById('khoaCode').value.trim(),
            name: document.getElementById('khoaName').value.trim()
        };
        try {
            const res = await fetch(id ? `/khoa/${id}` : '/khoa', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({icon: 'success', title: 'Thành công', text: data.message});
                closeKhoaModal();
                fetchKhoas();
            } else {
                Swal.fire({icon: 'error', title: 'Lỗi', text: data.error});
            }
        } catch (e) {
            Swal.fire({icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra'});
        }
    });

    // BoMon Logic
    const bomonTableBody = document.getElementById('bomonTableBody');
    const bomonSearchInput = document.getElementById('bomonSearchInput');
    const bomonModal = document.getElementById('bomonModal');
    const bomonForm = document.getElementById('bomonForm');
    const bomonKhoaId = document.getElementById('bomonKhoaId');
    let bomonList = [];

    function populateKhoaDropdown() {
        bomonKhoaId.innerHTML = '<option value="">-- Chọn Khoa --</option>';
        khoasList.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.id;
            opt.textContent = `${k.khoa_code} - ${k.name}`;
            bomonKhoaId.appendChild(opt);
        });
    }

    async function fetchBoMons() {
        try {
            const res = await fetch('/bomon');
            if (res.status === 401) { window.location.href = '/login'; return; }
            bomonList = await res.json();
            renderBoMons(bomonList);
        } catch (e) {
            console.error("Error fetching bomon", e);
        }
    }

    function renderBoMons(data) {
        bomonTableBody.innerHTML = '';
        data.forEach(b => {
            const khoa = khoasList.find(k => k.id === b.khoa_id);
            const khoaName = khoa ? khoa.name : 'Unknown';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${b.bomon_code}</strong></td>
                <td>${b.name}</td>
                <td><span class="badge badge-info">${khoaName}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editBoMon(${b.id})" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </td>
            `;
            bomonTableBody.appendChild(tr);
        });
    }

    bomonSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = bomonList.filter(b => b.name.toLowerCase().includes(val) || b.bomon_code.toLowerCase().includes(val));
        renderBoMons(filtered);
    });

    document.getElementById('openBoMonModalBtn').addEventListener('click', () => {
        document.getElementById('bomonModalTitle').textContent = 'Thêm Bộ Môn Mới';
        bomonForm.reset();
        document.getElementById('bomonId').value = '';
        bomonModal.classList.add('active');
    });

    const closeBoMonModal = () => bomonModal.classList.remove('active');
    document.getElementById('bomonModalCloseBtn').addEventListener('click', closeBoMonModal);
    document.getElementById('bomonModalCancelBtn').addEventListener('click', closeBoMonModal);

    window.editBoMon = (id) => {
        const b = bomonList.find(x => x.id === id);
        if (b) {
            document.getElementById('bomonModalTitle').textContent = 'Cập Nhật Bộ Môn';
            document.getElementById('bomonId').value = b.id;
            document.getElementById('bomonCode').value = b.bomon_code;
            document.getElementById('bomonName').value = b.name;
            document.getElementById('bomonKhoaId').value = b.khoa_id;
            bomonModal.classList.add('active');
        }
    };

    bomonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('bomonId').value;
        const payload = {
            bomon_code: document.getElementById('bomonCode').value.trim(),
            name: document.getElementById('bomonName').value.trim(),
            khoa_id: parseInt(document.getElementById('bomonKhoaId').value)
        };
        try {
            const res = await fetch(id ? `/bomon/${id}` : '/bomon', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({icon: 'success', title: 'Thành công', text: data.message});
                closeBoMonModal();
                fetchBoMons();
            } else {
                Swal.fire({icon: 'error', title: 'Lỗi', text: data.error});
            }
        } catch (e) {
            Swal.fire({icon: 'error', title: 'Lỗi', text: 'Có lỗi xảy ra'});
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/logout', { method: 'POST' });
        window.location.href = '/login';
    });

    // Initialize
    async function init() {
        await fetchKhoas();
        await fetchBoMons();
    }
    init();
});
