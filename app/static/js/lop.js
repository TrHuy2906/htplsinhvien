document.addEventListener('DOMContentLoaded', function () {
    // Check auth
    const cookies = document.cookie.split(';');
    let sessionCookie = cookies.find(c => c.trim().startsWith('session='));
    if (!sessionCookie) {
        window.location.href = '/login_page';
        return;
    }

    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', function () {
        fetch('/logout', { method: 'POST' })
            .then(() => window.location.href = '/login_page');
    });

    loadLop();
    loadOptions();
});

function loadLop(ml = '', name = '') {
    let url = '/lop';
    const params = new URLSearchParams();
    if (ml) params.append('ml', ml);
    if (name) params.append('name', name);
    if (params.toString()) url += '?' + params.toString();

    fetch(url, {
        headers: { 'Accept': 'application/json' }
    })
        .then(response => {
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/login_page';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (!data) return;
            const tbody = document.getElementById('lop-table-body');
            tbody.innerHTML = '';

            if (data.error) {
                alert(data.error);
                return;
            }

            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td>${item.class_code}</td>
                <td>${item.name}</td>
                <td>${item.major_id}</td>
                <td>${item.cohort_id}</td>
                <td class="actions-col">
                    <button class="btn-secondary" onclick="editLop(${item.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                </td>
            `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error:', error));
}

function loadOptions() {
    // Load ChuyenNganh options
    fetch('/chuyennganh', { headers: { 'Accept': 'application/json' } })
        .then(res => res.json())
        .then(data => {
            if (!data || data.error) return;
            const majorSelect = document.getElementById('major_id');
            majorSelect.innerHTML = '<option value="">-- Chọn Chuyên Ngành --</option>';
            data.forEach(cn => {
                majorSelect.innerHTML += `<option value="${cn.id}">${cn.major_code} - ${cn.name}</option>`;
            });
        })
        .catch(err => console.error(err));

    // Load NienKhoa options
    fetch('/nienkhoa', { headers: { 'Accept': 'application/json' } })
        .then(res => res.json())
        .then(data => {
            if (!data || data.error) return;
            const cohortSelect = document.getElementById('cohort_id');
            cohortSelect.innerHTML = '<option value="">-- Chọn Niên Khóa --</option>';
            data.forEach(nk => {
                cohortSelect.innerHTML += `<option value="${nk.id}">${nk.cohort_code} - ${nk.name}</option>`;
            });
        })
        .catch(err => console.error(err));
}

function searchLop() {
    const ml = document.getElementById('search-ml').value.trim();
    const name = document.getElementById('search-name').value.trim();
    loadLop(ml, name);
}

function resetSearch() {
    document.getElementById('search-ml').value = '';
    document.getElementById('search-name').value = '';
    loadLop();
}

function showAddModal() {
    document.getElementById('modal-title').textContent = 'Thêm Lớp';
    document.getElementById('lop-id').value = '';
    document.getElementById('lop-form').reset();
    document.getElementById('lop-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('lop-modal').style.display = 'none';
}

function editLop(id) {
    fetch(`/lop/${id}`, {
        headers: { 'Accept': 'application/json' }
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            document.getElementById('modal-title').textContent = 'Sửa Lớp';
            document.getElementById('lop-id').value = data.id;
            document.getElementById('class_code').value = data.class_code;
            document.getElementById('name').value = data.name;
            document.getElementById('major_id').value = data.major_id;
            document.getElementById('cohort_id').value = data.cohort_id;

            document.getElementById('lop-modal').style.display = 'block';
        })
        .catch(error => console.error('Error:', error));
}

function saveLop() {
    const id = document.getElementById('lop-id').value;

    const data = {
        class_code: document.getElementById('class_code').value.trim(),
        name: document.getElementById('name').value.trim(),
        major_id: parseInt(document.getElementById('major_id').value, 10),
        cohort_id: parseInt(document.getElementById('cohort_id').value, 10)
    };

    if (!data.class_code || !data.name || isNaN(data.major_id) || isNaN(data.cohort_id)) {
        alert('Vui lòng điền đầy đủ và đúng định dạng các trường hợp lệ.');
        return;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/lop/${id}` : '/lop';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json().then(res => ({ status: response.status, body: res })))
        .then(result => {
            if (result.status >= 400) {
                alert(result.body.error || 'Có lỗi xảy ra');
            } else {
                closeModal();
                loadLop();
                alert(id ? 'Cập nhật thành công!' : 'Thêm thành công!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi lưu dữ liệu');
        });
}
