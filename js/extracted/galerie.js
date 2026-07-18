// Extracted from galerie.html inline script 1
const CLOUD_NAME = "dmixb4gsg";
const GALLERY_TAG = "stb-galerie";

fetch('navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
    });

fetch('footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer').innerHTML = data;
    });

function buildImageUrl(publicId, width = 900) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width},c_fill/${publicId}`;
}

function buildFullImageUrl(publicId) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`;
}

async function loadGallery() {
    const status = document.getElementById('galleryStatus');
    const grid = document.getElementById('galleryGrid');

    try {
        const listUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${GALLERY_TAG}.json?v=${Date.now()}`;
        const response = await fetch(listUrl);

        if(!response.ok) {
            throw new Error('Cloudinary-Liste konnte nicht geladen werden.');
        }

        const data = await response.json();
        const resources = data.resources || [];

        if(resources.length === 0) {
            status.innerHTML = 'Noch keine Bilder in der Galerie vorhanden.';
            return;
        }

        status.style.display = 'none';

        resources
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
            .forEach((item, index) => {
                const publicId = item.public_id;
                const title = item.context?.custom?.caption || item.context?.caption || 'Styrian Bastards';
                const subtitle = item.context?.custom?.alt || 'Galerie';

                const card = document.createElement('div');
                card.className = 'gallery-item';
                card.dataset.full = buildFullImageUrl(publicId);

                card.innerHTML = `
                    <img src="${buildImageUrl(publicId)}" alt="${title}">
                    <div class="gallery-overlay">
                        <h3>${title}</h3>
                        <span>${subtitle}</span>
                    </div>
                `;

                grid.appendChild(card);
            });

        activateLightbox();

    } catch(error) {
        status.innerHTML = `
            Die Galerie konnte noch nicht geladen werden.<br>
            Prüfe bitte in Cloudinary, ob <strong>Resource List</strong> erlaubt ist
            und ob die Bilder den Tag <strong>${GALLERY_TAG}</strong> haben.
        `;
        console.error(error);
    }
}

function activateLightbox() {
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('lightboxImage').src = item.dataset.full;
            document.getElementById('lightbox').classList.add('active');
        });
    });
}

document.getElementById('lightboxClose').addEventListener('click', () => {
    document.getElementById('lightbox').classList.remove('active');
    document.getElementById('lightboxImage').src = '';
});

document.getElementById('lightbox').addEventListener('click', event => {
    if(event.target.id === 'lightbox') {
        document.getElementById('lightbox').classList.remove('active');
        document.getElementById('lightboxImage').src = '';
    }
});

document.addEventListener('keydown', event => {
    if(event.key === 'Escape') {
        document.getElementById('lightbox').classList.remove('active');
        document.getElementById('lightboxImage').src = '';
    }
});

loadGallery();
