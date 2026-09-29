document.addEventListener('DOMContentLoaded', () => {
    const cnTableBody = document.getElementById('cnTableBody');
    const cnSearchInput = document.getElementById('cnSearchInput');
    const cnModal = document.getElementById('cnModal');
    const cnForm = document.getElementById('cnForm');
    let cnList = [];
    let khoasList = [];

    async function fetchKhoas() {
        try {
            const res = await fetch('/khoa');
            if (res.status === 401) { window.location.href = '/login'; return; }
            khoasList = await res.json();
            populateKhoaDropdown();
        } catch (e) {
            console.error("Error fetching khoa", e);
        }
    }

    function populateKhoaDropdown() {
        const select = document.getElementById('cnFacultyId');
        select.innerHTML = '<option value="">-- Chọn Khoa --</option>';
        khoasList.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k.id;
            opt.textContent = `${k.khoa_code} - ${k.name}`;
            select.appendChild(opt);
        });
    }

    async function fetchChuyenNganh() {
        try {
            const res = await fetch('/chuyennganh');
            if (res.status === 401) { window.location.href = '/login'; return; }
            cnList = await res.json();
            renderTable(cnList);
        } catch (e) {
            console.error("Error fetching chuyennganh", e);
        }
    }

    function renderTable(data) {
        cnTableBody.innerHTML = '';
        data.forEach(cn => {
            const khoa = khoasList.find(k => k.id === cn.faculty_id);
            const khoaName = khoa ? khoa.name : 'Unknown';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${cn.major_code}</strong></td>
                <td>${cn.name}</td>
                <td><span class="badge badge-info">${khoaName}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editCN(${cn.id})" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    </div>
                </td>
            `;
            cnTableBody.appendChild(tr);
        });
    }

    cnSearchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = cnList.filter(cn => cn.name.toLowerCase().includes(val) || cn.major_code.toLowerCase().includes(val));
        renderTable(filtered);
    });

    document.getElementById('openCNModalBtn').addEventListener('click', () => {
        document.getElementById('cnModalTitle').textContent = 'Thêm Chuyên Ngành Mới';
        cnForm.reset();
        document.getElementById('cnId').value = '';
        cnModal.classList.add('active');
    });

    const closeModal = () => cnModal.classList.remove('active');
    document.getElementById('cnModalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('cnModalCancelBtn').addEventListener('click', closeModal);

    window.editCN = (id) => {
        const cn = cnList.find(x => x.id === id);
        if (cn) {
            document.getElementById('cnModalTitle').textContent = 'Cập Nhật Chuyên Ngành';
            document.getElementById('cnId').value = cn.id;
            document.getElementById('cnCode').value = cn.major_code;
            document.getElementById('cnName').value = cn.name;
            document.getElementById('cnFacultyId').value = cn.faculty_id;
            cnModal.classList.add('active');
        }
    };

    cnForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('cnId').value;
        const payload = {
            major_code: document.getElementById('cnCode').value.trim(),
            name: document.getElementById('cnName').value.trim(),
            faculty_id: parseInt(document.getElementById('cnFacultyId').value)
        };
        try {
            const res = await fetch(id ? `/chuyennganh/${id}` : '/chuyennganh', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                Swal.fire({icon: 'success', title: 'Thành công', text: data.message});
                closeModal();
                fetchChuyenNganh();
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

    async function init() {
        await fetchKhoas();
        await fetchChuyenNganh();
    }
    init();
});
