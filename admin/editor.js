// Clean editor.js - single copy with sort-by-date

let performances = [];
let imageOptions = [];
let currentSelectIndex = null;

let gallery = {
  photos: [],
  videos: []
};


async function checkSession() {
    const res = await fetch('check_session.php', { credentials: 'same-origin' });
    const data = await res.json();
    if (!data.logged_in) window.location.href = '.';
}

async function loadImages() {
    try { const res = await fetch('list_images.php', { credentials: 'same-origin' }); if (!res.ok) throw new Error('Failed to load image list'); const data = await res.json(); imageOptions = data.images || []; } catch (err) { console.error('Failed to load images:', err); }
}

async function loadPerformances() {
    try { const res = await fetch('get_performances.php', { credentials: 'same-origin' }); if (!res.ok) throw new Error('Failed to load performances'); const data = await res.json(); performances = data.performances; renderPerformances(); } catch (err) { console.error(err); alert('Failed to load performances'); }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.performance:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function renderPerformances() {
    const container = document.getElementById('performances-container');
    if (!container) return;
    if (!container.dataset.dragHandlers) {
        container.addEventListener('dragover', e => { e.preventDefault(); const dragging = document.querySelector('.dragging'); const afterElement = getDragAfterElement(container, e.clientY); if (!dragging) return; if (afterElement == null) container.appendChild(dragging); else container.insertBefore(dragging, afterElement); });
        container.addEventListener('drop', () => { const newOrder = Array.from(container.children).map(el => { const inputs = el.querySelectorAll('input'); const imageBtn = el.querySelector('.select-image-btn'); let filename = ''; if (imageBtn) { const img = imageBtn.querySelector('img'); if (img && img.src) filename = img.src.split('/').pop(); else filename = imageBtn.textContent.trim(); } return { title: inputs[0]?.value || '', description: inputs[1]?.value || '', date: inputs[2]?.value || '', link: inputs[3]?.value || '', image: filename && filename !== 'None' ? `/admin/img/${filename}` : '' }; }); performances = newOrder; renderPerformances(); });
        container.dataset.dragHandlers = '1';
    }

    container.innerHTML = '';
    performances.forEach((p, index) => {
        const div = document.createElement('div');
        div.className = 'performance';
        div.innerHTML = `
        <span class="drag-handle" title="Drag to reorder">↕</span>
        <input type="text" value="${p.title}" placeholder="Title">
        <input type="text" value="${p.description}" placeholder="Description">
        <input type="text" value="${p.date}" placeholder="Mon 12 October 2025">
        <input type="text" value="${p.link}" placeholder="Link">
        <button class="select-image-btn" title="${p.image ? p.image.split('/').pop() : 'None'}">
            ${p.image ? `<img class="select-image-preview" src="${p.image}" alt="preview">` : 'None'}
        </button>
        <button class="delete-btn">✖</button>
        `;

        const handle = div.querySelector('.drag-handle');
        if (handle) {
            handle.draggable = true;
            handle.addEventListener('dragstart', e => { div.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index); });
            handle.addEventListener('dragend', () => div.classList.remove('dragging'));
        }

        const inputs = div.querySelectorAll('input');
        inputs[0].addEventListener('input', e => performances[index].title = e.target.value);
        inputs[1].addEventListener('input', e => performances[index].description = e.target.value);
        inputs[2].addEventListener('input', e => performances[index].date = e.target.value);
        inputs[3].addEventListener('input', e => performances[index].link = e.target.value);

        div.querySelector('.delete-btn').addEventListener('click', () => { performances.splice(index, 1); renderPerformances(); });
        div.querySelector('.select-image-btn').addEventListener('click', () => openImageModal(index));
        container.appendChild(div);
    });
}

function openImageModal(index) {
    currentSelectIndex = index;
    const modal = document.getElementById('image-modal');
    const grid = document.getElementById('image-grid');
    grid.innerHTML = '';
    const noneBtn = document.createElement('button'); noneBtn.textContent = 'None'; noneBtn.style.marginBottom = '1rem'; noneBtn.addEventListener('click', () => { performances[currentSelectIndex].image = ''; closeImageModal(); renderPerformances(); }); grid.appendChild(noneBtn);
    imageOptions.forEach(img => {
        const wrapper = document.createElement('div'); wrapper.style.display = 'inline-block'; wrapper.style.position = 'relative';
        const thumb = document.createElement('img'); thumb.src = `/admin/img/${img}`; thumb.alt = img; thumb.style.display = 'block'; if (performances[index].image === `/admin/img/${img}`) thumb.classList.add('selected'); thumb.addEventListener('click', () => { performances[currentSelectIndex].image = `/admin/img/${img}`; closeImageModal(); renderPerformances(); });
        const delBtn = document.createElement('button'); delBtn.textContent = '🗑'; delBtn.title = 'Delete image'; delBtn.style.position = 'absolute'; delBtn.style.top = '4px'; delBtn.style.right = '4px'; delBtn.style.background = 'rgba(0,0,0,0.6)'; delBtn.style.color = '#fff'; delBtn.style.border = 'none'; delBtn.style.borderRadius = '4px'; delBtn.style.padding = '2px 6px'; delBtn.style.cursor = 'pointer';
        delBtn.addEventListener('click', async (e) => { e.stopPropagation(); if (!confirm(`Delete image "${img}"? This cannot be undone.`)) return; try { const res = await fetch('delete_image.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ filename: img }) }); const data = await res.json(); if (res.ok && data.ok) { alert('Image deleted'); await loadImages(); openImageModal(currentSelectIndex); } else { console.error(data); alert('Failed to delete image'); } } catch (err) { console.error(err); alert('Failed to delete image'); } });
        wrapper.appendChild(thumb); wrapper.appendChild(delBtn); grid.appendChild(wrapper);
    });
    modal.style.display = 'flex';
}

function closeImageModal() { document.getElementById('image-modal').style.display = 'none'; currentSelectIndex = null; }
document.getElementById('close-modal').addEventListener('click', closeImageModal);
window.addEventListener('click', e => { if (e.target.id === 'image-modal') closeImageModal(); });

document.getElementById('add-btn').addEventListener('click', () => { performances.push({ title: "", description: "", date: "", link: "", image: "" }); renderPerformances(); });

async function savePerformances() {
    try {
        const res = await fetch('save_performances.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ performances }) });
        const data = await res.json();
        if (res.ok && data.ok) {
            alert('Performances saved successfully!');
            return true;
        } else {
            console.error(data);
            alert('Failed to save performances. Check console.');
            return false;
        }
    } catch (err) {
        console.error(err);
        alert('Failed to save performances');
        return false;
    }
}

// Wrap save call with confirmation and UI locking
document.getElementById('update-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (!confirm('Are you sure you want to save changes?')) return;
    try {
        btn.disabled = true;
        btn.textContent = 'Saving...';
        await savePerformances();
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
});

function parseDateString(dateStr) {
    if (!dateStr) return null;
    const weekdayMatch = dateStr.match(/^[A-Za-z]{3,}\s+/);
    let candidate = dateStr;
    if (weekdayMatch) candidate = dateStr.replace(/^[A-Za-z]{3,}\s+/, '');
    let d = new Date(candidate);
    if (!isNaN(d.getTime())) return d;
    const parts = candidate.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (parts) { d = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`); if (!isNaN(d.getTime())) return d; }
    return null;
}

function sortPerformancesByDate() { performances.sort((a, b) => { const da = parseDateString(a.date); const db = parseDateString(b.date); if (da && db) return da - db; if (da && !db) return -1; if (!da && db) return 1; return 0; }); renderPerformances(); }
document.getElementById('sort-btn').addEventListener('click', sortPerformancesByDate);

function setupUploadArea() { const dropZone = document.getElementById('drop-zone'); const fileInput = document.getElementById('image-upload'); const addBtn = document.getElementById('add-image-btn'); if (!dropZone || !fileInput || !addBtn) return; addBtn.addEventListener('click', () => fileInput.click()); fileInput.addEventListener('change', e => { if (e.target.files.length > 0) uploadImage(e.target.files[0]); }); dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); }); dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover')); dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) uploadImage(e.dataTransfer.files[0]); }); }

async function uploadImage(file) { if (!file || !file.type.startsWith('image/')) { alert('Please upload a valid image file.'); return; } const formData = new FormData(); formData.append('image', file); try { const res = await fetch('upload_image.php', { method: 'POST', body: formData, credentials: 'same-origin' }); const data = await res.json(); if (res.ok && data.ok) { alert('Image uploaded successfully!'); await loadImages(); openImageModal(currentSelectIndex); } else { console.error(data); alert('Failed to upload image.'); } } catch (err) { console.error(err); alert('Upload failed.'); } }

// ================== GALLERY IMAGE UPLOAD ==================

const galleryDropZone = document.getElementById('gallery-drop-zone');
const galleryFileInput = document.getElementById('gallery-image-upload');

// Click to open file picker
galleryDropZone.addEventListener('click', () => {
  galleryFileInput.click();
});

// File input change
galleryFileInput.addEventListener('change', () => {
  if (galleryFileInput.files.length > 0) {
    uploadGalleryImage(galleryFileInput.files[0]);
  }
  galleryFileInput.value = '';
});

// Drag over
galleryDropZone.addEventListener('dragover', e => {
  e.preventDefault();
  galleryDropZone.classList.add('dragover');
});

// Drag leave
galleryDropZone.addEventListener('dragleave', () => {
  galleryDropZone.classList.remove('dragover');
});

// Drop
galleryDropZone.addEventListener('drop', e => {
  e.preventDefault();
  galleryDropZone.classList.remove('dragover');

  if (e.dataTransfer.files.length > 0) {
    uploadGalleryImage(e.dataTransfer.files[0]);
  }
});

// Upload logic
async function uploadGalleryImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Please upload a valid image file.');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    galleryDropZone.textContent = 'Uploading...';

    const res = await fetch('gallery_upload_image.php', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });

    const data = await res.json();

    if (res.ok && data.ok && data.path) {
      // TEMP: just append image visually for now
      appendGalleryThumbnail(data.path);
    } else {
      console.error(data);
      alert('Failed to upload image.');
    }
  } catch (err) {
    console.error(err);
    alert('Image upload failed.');
  } finally {
    galleryDropZone.textContent = 'Drop photos here or click to upload';
  }
}

// Temporary visual feedback only (no JSON storage yet)
function appendGalleryThumbnail(src) {
  const container = document.getElementById('gallery-photos');

  const div = document.createElement('div');
  div.className = 'gallery-photo';

  div.innerHTML = `
    <img src="${src}" alt="">
    <button title="Remove image">✖</button>
  `;

  // Remove from UI (and from future save)
  div.querySelector('button').addEventListener('click', () => {
    if (!confirm('Remove this image from the gallery?')) return;
    div.remove();
  });

  container.appendChild(div);
}


function appendGalleryVideoTile(url = '') {
  const container = document.getElementById('gallery-videos');

  const tile = document.createElement('div');
  tile.className = 'gallery-video';

  tile.innerHTML = `
    <img style="display:none">
    <input type="text" placeholder="YouTube link" value="${url}">
    <button title="Delete video">✖</button>
  `;

  const img = tile.querySelector('img');
  const input = tile.querySelector('input');
  const delBtn = tile.querySelector('button');

  function updateThumb() {
    const id = extractYouTubeId(input.value);
    if (id) {
      img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }
  }

  input.addEventListener('input', updateThumb);

  // Populate thumbnail immediately for loaded videos
  if (url) updateThumb();

  delBtn.addEventListener('click', () => {
    if (!confirm('Remove this video from the gallery?')) return;
    tile.remove();
  });

  container.appendChild(tile);
}

// ================== SAVE GALLERY ==================

document
  .getElementById('save-gallery-btn')
  .addEventListener('click', saveGallery);

async function saveGallery() {
  try {
    const btn = document.getElementById('save-gallery-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    // Collect current photo paths from DOM
    const photos = Array.from(
      document.querySelectorAll('#gallery-photos img')
    ).map(img => img.getAttribute('src'));

    // Collect video URLs from inputs
    const videos = Array.from(
      document.querySelectorAll('#gallery-videos input')
    ).map(input => input.value.trim())
     .filter(v => v !== '');

    const res = await fetch('save_gallery.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ photos, videos })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error('Save failed');
    }

    alert('Gallery saved successfully!');
  } catch (err) {
    console.error(err);
    alert('Failed to save gallery.');
  } finally {
    const btn = document.getElementById('save-gallery-btn');
    btn.disabled = false;
    btn.textContent = 'Save Gallery';
  }
}

// ================== LOAD GALLERY FROM JSON ==================

async function loadGallery() {
  try {
    const res = await fetch('get_gallery.php', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Failed to load gallery');

    const data = await res.json();

    gallery.photos = Array.isArray(data.photos) ? data.photos : [];
    gallery.videos = Array.isArray(data.videos) ? data.videos : [];

    renderGalleryFromData();
  } catch (err) {
    console.error('Failed to load gallery:', err);
  }
}

function renderGalleryFromData() {
  // Clear containers
  document.getElementById('gallery-photos').innerHTML = '';
  document.getElementById('gallery-videos').innerHTML = '';

  // Render photos
  gallery.photos.forEach(src => {
    appendGalleryThumbnail(src);
  });

  // Render videos
  gallery.videos.forEach(url => {
    appendGalleryVideoTile(url);
  });
}

// ================== YOUTUBE VIDEOS ==================

function extractYouTubeId(url) {
  if (!url) return null;

  const match = url.match(
    /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );

  return match ? match[1] : null;
}


document
  .getElementById('add-gallery-video-btn')
  .addEventListener('click', () => {
    appendGalleryVideoTile('');
  });

function appendGalleryVideoRow(url = '') {
  const container = document.getElementById('gallery-videos');

  const row = document.createElement('div');
  row.className = 'gallery-video-row';

  row.innerHTML = `
    <input type="text" placeholder="YouTube link" value="${url}">
    <img class="yt-thumb" style="display:none">
    <button class="delete-video-btn" title="Delete video">✖</button>
  `;

  const input = row.querySelector('input');
  const thumb = row.querySelector('.yt-thumb');
  const delBtn = row.querySelector('.delete-video-btn');

  // Update thumbnail preview
  function updatePreview() {
    const id = extractYouTubeId(input.value);
    if (id) {
      thumb.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      thumb.style.display = 'block';
    } else {
      thumb.style.display = 'none';
    }
  }

  input.addEventListener('input', updatePreview);

  // Initial preview (for loaded data)
  if (url) updatePreview();

  // ✅ Delete button
  delBtn.addEventListener('click', () => {
    if (!confirm('Remove this video from the gallery?')) return;
    row.remove();
  });

  container.appendChild(row);
}

 (async function init() { await checkSession(); await loadImages(); setupUploadArea(); await loadPerformances(); await loadGallery(); })();