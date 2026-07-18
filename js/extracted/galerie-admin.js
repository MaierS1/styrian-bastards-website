// Extracted from galerie-admin.html inline script 1
const CLOUD_NAME = "dmixb4gsg";
const UPLOAD_PRESET = "STB Galerie";
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

const form = document.getElementById('uploadForm');
const statusBox = document.getElementById('status');
const previewGrid = document.getElementById('previewGrid');
const uploadButton = document.getElementById('uploadButton');

function showStatus(message) {
    statusBox.style.display = 'block';
    statusBox.innerHTML = message;
}

form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const files = document.getElementById('files').files;
    const title = document.getElementById('title').value.trim() || 'Styrian Bastards';
    const subtitle = document.getElementById('subtitle').value.trim() || 'Galerie';

    if(!files.length) {
        showStatus('Bitte zuerst mindestens ein Bild auswählen.');
        return;
    }

    uploadButton.disabled = true;
    previewGrid.innerHTML = '';
    showStatus(`Upload gestartet: ${files.length} Bild(er) …`);

    let success = 0;
    let failed = 0;

    for(const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('tags', GALLERY_TAG);
        formData.append('folder', 'styrian-bastards/galerie');
        formData.append('context', `caption=${title}|alt=${subtitle}`);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if(!response.ok) {
                console.error(data);
                failed++;
                continue;
            }

            success++;

            const img = document.createElement('img');
            img.src = data.secure_url;
            img.alt = title;
            previewGrid.appendChild(img);

            showStatus(`Upload läuft … erfolgreich: ${success}, fehlgeschlagen: ${failed}`);

        } catch(error) {
            console.error(error);
            failed++;
            showStatus(`Upload läuft … erfolgreich: ${success}, fehlgeschlagen: ${failed}`);
        }
    }

    uploadButton.disabled = false;
    showStatus(`
        Upload abgeschlossen.<br>
        Erfolgreich: <strong>${success}</strong><br>
        Fehlgeschlagen: <strong>${failed}</strong><br><br>
        Hinweis: Die Galerie-Liste bei Cloudinary kann bis zu ca. 60 Sekunden brauchen,
        bis neue Bilder sichtbar sind.
    `);

    form.reset();
});
