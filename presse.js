(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const root = document.getElementById('press-root');
    if (!root) return;

    const assetUrl = (path) => {
        if (!path) return '';
        if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
        return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${encodeURI(path)}`;
    };

    const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) return value;
        return new Intl.DateTimeFormat('de-AT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const detailIdentifier = () => {
        const match = window.location.pathname.replace(/\/+$/, '').match(/^\/presse\/([^/]+)$/);
        return match ? decodeURIComponent(match[1]).toLowerCase() : '';
    };

    const detailHref = (item) => `/presse/${encodeURIComponent(item.slug || item.id)}`;

    const createHero = (title, intro) => {
        const hero = document.createElement('div');
        hero.className = 'press-hero';

        const kicker = document.createElement('span');
        kicker.className = 'press-kicker';
        kicker.textContent = 'Presse';
        hero.appendChild(kicker);

        const heading = document.createElement('h1');
        heading.textContent = title;
        hero.appendChild(heading);

        if (intro) {
            const paragraph = document.createElement('p');
            paragraph.textContent = intro;
            hero.appendChild(paragraph);
        }

        return hero;
    };

    const createImage = (item, className) => {
        const imageSrc = assetUrl(item.image_path);
        if (!imageSrc) return null;

        const image = document.createElement('img');
        image.className = className;
        image.src = imageSrc;
        image.alt = item.image_alt || item.title || 'Presseartikel';
        image.loading = 'lazy';
        image.decoding = 'async';
        return image;
    };

    const createCard = (item) => {
        const card = document.createElement('a');
        card.className = 'card press-card';
        card.href = detailHref(item);

        const image = createImage(item, 'press-image');
        if (image) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'press-image-wrap';
            image.onerror = () => {
                imageWrap.remove();
                card.classList.add('no-image');
            };
            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
        } else {
            card.classList.add('no-image');
        }

        const body = document.createElement('div');
        body.className = 'press-body';

        const dateLabel = formatDate(item.publication_date);
        if (dateLabel) {
            const date = document.createElement('span');
            date.className = 'press-date';
            date.textContent = dateLabel;
            body.appendChild(date);
        }

        const title = document.createElement('h2');
        title.textContent = item.title || 'Presseartikel';
        body.appendChild(title);

        if (item.summary) {
            const summary = document.createElement('p');
            summary.className = 'press-summary';
            summary.textContent = item.summary;
            body.appendChild(summary);
        }

        const more = document.createElement('span');
        more.className = 'btn press-read-more';
        more.textContent = 'Weiterlesen';
        body.appendChild(more);

        card.appendChild(body);
        return card;
    };

    const renderContent = (content, container) => {
        String(content || '')
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .forEach((paragraph) => {
                const element = document.createElement('p');
                paragraph.split('\n').forEach((line, index, lines) => {
                    element.appendChild(document.createTextNode(line));
                    if (index < lines.length - 1) element.appendChild(document.createElement('br'));
                });
                container.appendChild(element);
            });
    };

    const renderOverview = (items) => {
        root.innerHTML = '';
        root.appendChild(createHero('Presse', 'Aktuelle Presseartikel, Medienberichte und Vereinsnews der Styrian Bastards.'));

        if (!items.length) {
            const status = document.createElement('p');
            status.className = 'press-status';
            status.textContent = 'Noch keine Presseartikel veröffentlicht.';
            root.appendChild(status);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'press-grid';
        items.forEach((item) => grid.appendChild(createCard(item)));
        root.appendChild(grid);
    };

    const renderDetail = (item) => {
        root.innerHTML = '';

        const detail = document.createElement('article');
        detail.className = 'press-detail';

        const back = document.createElement('a');
        back.className = 'btn press-back';
        back.href = '/presse';
        back.textContent = 'Zurück zu Presse';
        detail.appendChild(back);

        const image = createImage(item, 'press-detail-image');
        if (image) detail.appendChild(image);

        const dateLabel = formatDate(item.publication_date);
        if (dateLabel) {
            const date = document.createElement('span');
            date.className = 'press-date';
            date.textContent = dateLabel;
            detail.appendChild(date);
        }

        const title = document.createElement('h1');
        title.textContent = item.title || 'Presseartikel';
        detail.appendChild(title);

        if (item.summary) {
            const lead = document.createElement('p');
            lead.className = 'press-lead';
            lead.textContent = item.summary;
            detail.appendChild(lead);
        }

        const content = document.createElement('div');
        content.className = 'press-content';
        const fullContent = item.content || item.inhalt || '';
        if (fullContent) {
            renderContent(fullContent, content);
        } else {
            const empty = document.createElement('p');
            empty.textContent = 'Kein Inhalt hinterlegt.';
            content.appendChild(empty);
        }
        detail.appendChild(content);

        root.appendChild(detail);
    };

    const renderNotFound = () => {
        root.innerHTML = '';
        root.appendChild(createHero('Nicht gefunden', 'Der angefragte Presseartikel ist nicht verfügbar.'));
        const back = document.createElement('a');
        back.className = 'btn';
        back.href = '/presse';
        back.textContent = 'Zurück zu Presse';
        root.appendChild(back);
    };

    const loadPress = async () => {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_media_items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    p_category: null,
                    p_limit: 50,
                    p_featured_only: false
                })
            });

            if (!response.ok) throw new Error(`Supabase RPC failed with status ${response.status}`);

            const items = (await response.json()).filter((item) => item && item.title);
            const identifier = detailIdentifier();

            if (!identifier) {
                renderOverview(items);
                return;
            }

            const selected = items.find((item) => {
                const slug = item.slug ? String(item.slug).toLowerCase() : '';
                const id = item.id ? String(item.id).toLowerCase() : '';
                return slug === identifier || id === identifier;
            });

            if (selected) renderDetail(selected);
            else renderNotFound();
        } catch (error) {
            console.warn('Could not load press articles', error);
            root.innerHTML = '';
            root.appendChild(createHero('Presse', 'Presseartikel konnten nicht geladen werden.'));
        }
    };

    loadPress();
})();
