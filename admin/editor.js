let performances = [];
let imageOptions = [];
let currentSelectIndex = null;

// ----- SECURITY: redirect if not logged in -----
async function checkSession() {
    const res = await fetch('check_session.php', { credentials: 'same-origin' });
    const data = await res.json();
    if (!data.logged_in) {
        window.location.href = '.';
    }
}

// ----- LOAD IMAGE OPTIONS -----
async function loadImages() {
    try {
        const res = await fetch('list_images.php', { credentials: 'same-origin' });
        if (!res.ok) throw new Error('Failed to load image list');
        const data = await res.json();
        imageOptions = data.images || [];
    } catch (err) {
        console.error('Failed to load images:', err);
    }
}

// ----- LOAD PERFORMANCES -----
async function loadPerformances() {
    try {
        const res = await fetch('get_performances.php', { credentials: 'same-origin' });
        if (!res.ok) throw new Error('Failed to load performances');
        const data = await res.json();
        performances = data.performances;
        renderPerformances();
    } catch (err) {
        console.error(err);
        alert('Failed to load performances');
    }
}

// ----- RENDER PERFORMANCES -----
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.performance:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
        } else {
        return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function renderPerformances() {
    const container = document.getElementById('performances-container');
    // Attach drag handlers once on the container. We re-render after drop so handlers/index bindings stay correct.
    if (!container.dataset.dragHandlers) {
        container.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(container, e.clientY);
        if (!dragging) return;
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
        });

        container.addEventListener('drop', () => {
        const newOrder = Array.from(container.children).map(el => {
            const inputs = el.querySelectorAll('input');
            const imageBtn = el.querySelector('.select-image-btn');
            return {
            title: inputs[0]?.value || '',
            description: inputs[1]?.value || '',
            date: inputs[2]?.value || '',
            link: inputs[3]?.value || '',
            image: imageBtn?.textContent !== 'None'
                ? `/admin/img/${imageBtn.textContent}`
                : ''
            };
        });
        performances = newOrder;
        // re-render to rebind handlers and update indices
        renderPerformances();
        });

        container.dataset.dragHandlers = '1';
    }

    container.innerHTML = '';
    performances.forEach((p, index) => {
        const div = document.createElement('div');
            // the row itself is not draggable; only the handle should start a drag
            div.className = 'performance';
        div.innerHTML = `
        <span class="drag-handle" title="Drag to reorder">↕</span>
        <input type="text" value="${p.title}" placeholder="Title">
        <input type="text" value="${p.description}" placeholder="Description">
        <input type="text" value="${p.date}" placeholder="Date">
        <input type="text" value="${p.link}" placeholder="Link">
        <button class="select-image-btn">
            ${p.image ? p.image.split('/').pop() : 'None'}
        </button>
        <button class="delete-btn">✖</button>
        `;

        // make the handle draggable and wire drag events to it so dragging only works from the handle
        const handle = div.querySelector('.drag-handle');
        if (handle) {
        handle.draggable = true;
        handle.addEventListener('dragstart', e => {
            // add dragging class on the row (parent) so the container logic can move it
            div.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
        });

        handle.addEventListener('dragend', () => {
            div.classList.remove('dragging');
        });
        }

        const inputs = div.querySelectorAll('input');
        inputs[0].addEventListener('input', e => performances[index].title = e.target.value);
        inputs[1].addEventListener('input', e => performances[index].description = e.target.value);
        inputs[2].addEventListener('input', e => performances[index].date = e.target.value);
        inputs[3].addEventListener('input', e => performances[index].link = e.target.value);

        div.querySelector('.delete-btn').addEventListener('click', () => {
        performances.splice(index, 1);
        renderPerformances();
        });

        div.querySelector('.select-image-btn').addEventListener('click', () => openImageModal(index));

        container.appendChild(div);
    });
}

// ----- IMAGE MODAL -----
function openImageModal(index) {
    currentSelectIndex = index;
    const modal = document.getElementById('image-modal');
    const grid = document.getElementById('image-grid');
    grid.innerHTML = '';

    // Add "None" option
    const noneBtn = document.createElement('button');
    noneBtn.textContent = 'None';
    noneBtn.style.marginBottom = '1rem';
    noneBtn.addEventListener('click', () => {
        performances[currentSelectIndex].image = '';
        closeImageModal();
        renderPerformances();
    });
    grid.appendChild(noneBtn);

    // Populate thumbnails
    imageOptions.forEach(img => {
        // wrapper to hold thumbnail and delete control
        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-block';
        wrapper.style.position = 'relative';

        const thumb = document.createElement('img');
        thumb.src = `/admin/img/${img}`;
        thumb.alt = img;
        thumb.style.display = 'block';
        if (performances[index].image === `/admin/img/${img}`) thumb.classList.add('selected');
        thumb.addEventListener('click', () => {
        performances[currentSelectIndex].image = `/admin/img/${img}`;
        closeImageModal();
        renderPerformances();
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑';
        delBtn.title = 'Delete image';
        // style small overlay
        delBtn.style.position = 'absolute';
        delBtn.style.top = '4px';
        delBtn.style.right = '4px';
        delBtn.style.background = 'rgba(0,0,0,0.6)';
        delBtn.style.color = '#fff';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '4px';
        delBtn.style.padding = '2px 6px';
        delBtn.style.cursor = 'pointer';

        delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm(`Delete image "${img}"? This cannot be undone.`)) return;
        try {
            const res = await fetch('delete_image.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ filename: img })
            });
            const data = await res.json();
            if (res.ok && data.ok) {
            alert('Image deleted');
            await loadImages();
            // rebuild modal contents
            openImageModal(currentSelectIndex);
            } else {
            console.error(data);
            alert('Failed to delete image');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete image');
        }
        });

        wrapper.appendChild(thumb);
        wrapper.appendChild(delBtn);
        grid.appendChild(wrapper);
    });

    modal.style.display = 'flex';
}

function closeImageModal() {
    document.getElementById('image-modal').style.display = 'none';
    currentSelectIndex = null;
}

document.getElementById('close-modal').addEventListener('click', closeImageModal);
    window.addEventListener('click', e => {
    if (e.target.id === 'image-modal') closeImageModal();
});

// ----- ADD NEW -----
document.getElementById('add-btn').addEventListener('click', () => {
    performances.push({ title: "", description: "", date: "", link: "", image: "" });
    renderPerformances();
});

// ----- SAVE -----
async function savePerformances() {
    try {
        const res = await fetch('save_performances.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ performances })
        });
        const data = await res.json();
        if (res.ok && data.ok) {
        alert('Performances saved successfully!');
        } else {
        console.error(data);
        alert('Failed to save performances. Check console.');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to save performances');
    }
}

document.getElementById('update-btn').addEventListener('click', savePerformances);

// ----- IMAGE UPLOAD -----
function setupUploadArea() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('image-upload');
    const addBtn = document.getElementById('add-image-btn');

    addBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', e => {
        if (e.target.files.length > 0) uploadImage(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) uploadImage(e.dataTransfer.files[0]);
    });
}

async function uploadImage(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image file.');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await fetch('upload_image.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
        });
        const data = await res.json();

        if (res.ok && data.ok) {
        alert('Image uploaded successfully!');
        await loadImages();
        openImageModal(currentSelectIndex);
        } else {
        console.error(data);
        alert('Failed to upload image.');
        }
    } catch (err) {
        console.error(err);
        alert('Upload failed.');
    }
}

// ----- INIT -----
(async function init() {
    await checkSession();
    await loadImages();
    setupUploadArea();
    await loadPerformances();
})();