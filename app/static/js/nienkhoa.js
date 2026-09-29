document.addEventListener('DOMContentLoaded', function() {
    // Check auth
    const cookies = document.cookie.split(';');
    let sessionCookie = cookies.find(c => c.trim().startsWith('session='));
    if (!sessionCookie) {
        window.location.href = '/login_page';
        return;
    }

    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        fetch('/logout', { method: 'POST' })
            .then(() => window.location.href = '/login_page');
    });

    loadNienKhoa();
});

function loadNienKhoa(mnk = '', name = '') {
    let url = '/nienkhoa';
    const params = new URLSearchParams();
    if (mnk) params.append('mnk', mnk);
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
        const tbody = document.getElementById('nienkhoa-table-body');
        tbody.innerHTML = '';
        
        if (data.error) {
            alert(data.error);
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.cohort_code}</td>
                <td>${item.name}</td>
                <td>${item.start_year}</td>
                <td>${item.end_year}</td>
                <td class="actions-col">
                    <button class="btn-secondary" onclick="editNienKhoa(${item.id})">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    })
    .catch(error => console.error('Error:', error));
}

function searchNienKhoa() {
    const mnk = document.getElementById('search-mnk').value.trim();
    const name = document.getElementById('search-name').value.trim();
    loadNienKhoa(mnk, name);
}

function resetSearch() {
    document.getElementById('search-mnk').value = '';
    document.getElementById('search-name').value = '';
    loadNienKhoa();
}

function showAddModal() {
    document.getElementById('modal-title').textContent = 'Thêm Niên Khóa';
    document.getElementById('nienkhoa-id').value = '';
    document.getElementById('nienkhoa-form').reset();
    document.getElementById('nienkhoa-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('nienkhoa-modal').style.display = 'none';
}

function editNienKhoa(id) {
    fetch(`/nienkhoa/${id}`, {
        headers: { 'Accept': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        document.getElementById('modal-title').textContent = 'Sửa Niên Khóa';
        document.getElementById('nienkhoa-id').value = data.id;
        document.getElementById('cohort_code').value = data.cohort_code;
        document.getElementById('name').value = data.name;
        document.getElementById('start_year').value = data.start_year;
        document.getElementById('end_year').value = data.end_year;
        
        document.getElementById('nienkhoa-modal').style.display = 'block';
    })
    .catch(error => console.error('Error:', error));
}

function saveNienKhoa() {
    const id = document.getElementById('nienkhoa-id').value;
    
    // Explicitly parse years as integers so JSON validation passes
    const data = {
        cohort_code: document.getElementById('cohort_code').value.trim(),
        name: document.getElementById('name').value.trim(),
        start_year: parseInt(document.getElementById('start_year').value, 10),
        end_year: parseInt(document.getElementById('end_year').value, 10)
    };

    if (!data.cohort_code || !data.name || isNaN(data.start_year) || isNaN(data.end_year)) {
        alert('Vui lòng điền đầy đủ và đúng định dạng các trường hợp lệ.');
        return;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/nienkhoa/${id}` : '/nienkhoa';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json().then(res => ({status: response.status, body: res})))
    .then(result => {
        if (result.status >= 400) {
            alert(result.body.error || 'Có lỗi xảy ra');
        } else {
            closeModal();
            loadNienKhoa();
            alert(id ? 'Cập nhật thành công!' : 'Thêm thành công!');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi lưu dữ liệu');
    });
}
