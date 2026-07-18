// Extracted from mitglied-werden.html inline script 1
(function(){
    const form = document.getElementById('membershipForm');
    const fileInput = document.getElementById('antrag');
    const message = document.getElementById('fileValidationMessage');
    const submitButton = document.getElementById('submitButton');
    const uploadLinkInput = document.getElementById('mitgliedsantragLink');

    if (!form || !fileInput || !message || !submitButton || !uploadLinkInput) return;

    // Cloudinary-Daten
    const CLOUDINARY_CLOUD_NAME = 'dmixb4gsg';
    const CLOUDINARY_UPLOAD_PRESET = 'STB Galerie';
    const CLOUDINARY_FOLDER = 'mitgliedsantraege';

    // Datei-Regeln
    const maxSize = 10 * 1024 * 1024; // 10 MB
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

    function setMessage(text, type){
        message.textContent = text;
        message.classList.remove('error', 'ok');
        if (type) message.classList.add(type);
    }

    function getExtension(filename){
        return (filename.split('.').pop() || '').toLowerCase();
    }

    async function readHeader(file, length){
        const buffer = await file.slice(0, length).arrayBuffer();
        return new Uint8Array(buffer);
    }

    function bytesToText(bytes){
        return Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
    }

    function isRealPdf(header){
        return bytesToText(header.slice(0, 5)) === '%PDF-';
    }

    function isRealJpeg(header){
        return header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
    }

    function isRealPng(header){
        return header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47 &&
               header[4] === 0x0D && header[5] === 0x0A && header[6] === 0x1A && header[7] === 0x0A;
    }

    function isRealWebp(header){
        return bytesToText(header.slice(0, 4)) === 'RIFF' && bytesToText(header.slice(8, 12)) === 'WEBP';
    }

    async function validateUploadFile(file){
        if (!file) {
            return { valid:false, message:'Bitte lade deinen Mitgliedsantrag als PDF, JPG, PNG oder WebP hoch.' };
        }

        const extension = getExtension(file.name);

        if (!allowedExtensions.includes(extension)) {
            return { valid:false, message:'Dieser Dateityp ist nicht erlaubt. Bitte PDF, JPG, PNG oder WebP verwenden.' };
        }

        if (file.size > maxSize) {
            return { valid:false, message:'Die Datei ist zu groß. Maximal erlaubt sind 10 MB.' };
        }

        if (file.type && !allowedMimeTypes.includes(file.type)) {
            return { valid:false, message:'Der erkannte Dateityp passt nicht. Bitte eine echte PDF- oder Bilddatei hochladen.' };
        }

        const header = await readHeader(file, 12);
        let realTypeOk = false;

        if (extension === 'pdf') realTypeOk = isRealPdf(header);
        if (extension === 'jpg' || extension === 'jpeg') realTypeOk = isRealJpeg(header);
        if (extension === 'png') realTypeOk = isRealPng(header);
        if (extension === 'webp') realTypeOk = isRealWebp(header);

        if (!realTypeOk) {
            return { valid:false, message:'Die Datei wurde blockiert: Inhalt und Dateiendung passen nicht zusammen.' };
        }

        return { valid:true, message:'Datei geprüft: ' + file.name };
    }

    async function uploadToCloudinary(file){
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        uploadData.append('folder', CLOUDINARY_FOLDER);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
            method: 'POST',
            body: uploadData
        });

        const result = await response.json();

        if (!response.ok || !result.secure_url) {
            console.error('Cloudinary Fehler:', result);
            throw new Error(result.error?.message || 'Cloudinary-Upload fehlgeschlagen.');
        }

        return result.secure_url;
    }

    async function sendToWeb3Forms(){
        const formData = new FormData(form);

        // Wichtig: Datei selbst niemals an Web3Forms senden.
        formData.delete('Mitgliedsantrag');

        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Web3Forms Fehler:', result);
            throw new Error(result.message || 'Web3Forms-Versand fehlgeschlagen.');
        }

        return result;
    }

    fileInput.addEventListener('change', async function(){
        uploadLinkInput.value = '';
        const result = await validateUploadFile(fileInput.files[0]);
        setMessage(result.message, result.valid ? 'ok' : 'error');
        if (!result.valid) fileInput.value = '';
    });

    form.addEventListener('submit', async function(event){
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const file = fileInput.files[0];
        const validation = await validateUploadFile(file);

        if (!validation.valid) {
            setMessage(validation.message, 'error');
            fileInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Wird hochgeladen …';
        setMessage('Datei wird geprüft und zu Cloudinary hochgeladen …', '');

        try {
            const fileUrl = await uploadToCloudinary(file);
            uploadLinkInput.value = fileUrl;

            submitButton.textContent = 'Wird gesendet …';
            setMessage('Datei wurde hochgeladen. Formular wird gesendet …', 'ok');

            await sendToWeb3Forms();

            setMessage('Erfolgreich gesendet. Danke für deinen Mitgliedsantrag!', 'ok');
            form.reset();
            uploadLinkInput.value = '';

            if (window.location.hash !== '#erfolgreich') {
                window.location.hash = 'erfolgreich';
            }
        } catch (error) {
            setMessage('Fehler: ' + error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Mitgliedsantrag senden';
        }
    });
})();
