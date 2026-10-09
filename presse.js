(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const V2_PRESS_ENABLED = window.STB_V2_PRESS_ENABLED === true;
    const V2_URL = 'https://yktioliukcrrccrfwxad.supabase.co';
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

    const detailParams = () => {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug');
        const id = params.get('id');
        const pathSlug = window.location.pathname.match(/^\/(?:presse|news)\/([^/?#]+)/i)?.[1] || '';
        let decodedPathSlug = pathSlug;

        try {
            decodedPathSlug = decodeURIComponent(pathSlug);
        } catch (error) {
            decodedPathSlug = pathSlug;
        }

        return {
            slug: slug ? slug.toLowerCase() : decodedPathSlug.toLowerCase(),
            id: id ? id.toLowerCase() : ''
        };
    };

    const detailHref = (item) => {
        if (item._source === 'v2' && item.slug) {
            return `/presse.html?source=v2&slug=${encodeURIComponent(item.slug)}`;
        }
        if (item.slug) {
            return `/presse.html?slug=${encodeURIComponent(item.slug)}`;
        }

        return `/presse.html?id=${encodeURIComponent(item.id)}`;
    };

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
        more.className = 'btn btn-primary press-read-more';
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
        back.className = 'btn btn-primary press-back';
        back.href = '/presse.html';
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
        back.className = 'btn btn-primary';
        back.href = '/presse.html';
        back.textContent = 'Zurück zu Presse';
        root.appendChild(back);
    };

    // V2 content is fetched only from a public published-only RPC.
    // Content HTML is displayed as text paragraphs, never inserted as raw HTML.
    const fetchV2Press = async (slug = '') => {
        const key = window.STB_V2_SHOP_PUBLISHABLE_KEY;
        if (!V2_PRESS_ENABLED || typeof key !== 'string' || !key.trim()) return [];
        const endpoint = slug ? 'get_public_press_item' : 'get_public_press';
        const body = slug ? { p_slug: slug } : { p_limit: 50, p_after: null };
        const response = await fetch(`${V2_URL}/rest/v1/rpc/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'apikey': key },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`V2 press RPC failed: ${response.status}`);
        const records = await response.json();
        if (!Array.isArray(records)) throw new Error('Invalid V2 press response');
        return records.filter((item) => item && item.title && item.slug).map((item) => ({
            id: item.id,
            slug: item.slug,
            title: item.title,
            summary: item.teaser || '',
            publication_date: typeof item.published_at === 'string' ? item.published_at.slice(0, 10) : '',
            image_path: item.image_path
                ? (/^https:\/\//i.test(item.image_path) ? item.image_path
                    : `${V2_URL}/storage/v1/object/public/public-assets/${encodeURI(item.image_path)}`)
                : '',
            content: item.content_html || '',
            _source: 'v2'
        }));
    };

    const loadPress = async () => {
        try {
            const params = detailParams();
            const v2Detail = new URLSearchParams(window.location.search).get('source') === 'v2';
            if (v2Detail) {
                if (!params.slug || !V2_PRESS_ENABLED) { renderNotFound(); return; }
                const records = await fetchV2Press(params.slug);
                const selected = records.find((item) => item.slug.toLowerCase() === params.slug);
                if (selected) renderDetail(selected);
                else renderNotFound();
                return;
            }
            const fetchV1 = async () => {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_media_items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    },
                    body: JSON.stringify({ p_category: null, p_limit: 50, p_featured_only: false })
                });
                if (!response.ok) throw new Error(`V1 press RPC failed: ${response.status}`);
                const records = await response.json();
                if (!Array.isArray(records)) throw new Error('Invalid V1 press response');
                return records.filter((item) => item && item.title);
            };

            if (!params.slug && !params.id) {
                const results = await Promise.allSettled(V2_PRESS_ENABLED
                    ? [fetchV1(), fetchV2Press()]
                    : [fetchV1()]);
                const v1Items = results[0].status === 'fulfilled' ? results[0].value : [];
                const v2Items = V2_PRESS_ENABLED && results[1].status === 'fulfilled' ? results[1].value : [];
                for (const result of results) {
                    if (result.status === 'rejected') console.warn('Press source unavailable', result.reason);
                }
                const titles = new Set(v2Items.map((item) => item.title.trim().toLocaleLowerCase('de-AT')));
                renderOverview([...v2Items, ...v1Items.filter((item) =>
                    !titles.has(item.title.trim().toLocaleLowerCase('de-AT'))
                )]);
                return;
            }

            const items = await fetchV1();

            const selected = items.find((item) => {
                const slug = item.slug ? String(item.slug).toLowerCase() : '';
                const id = item.id ? String(item.id).toLowerCase() : '';
                return (params.slug && slug === params.slug) || (params.id && id === params.id);
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
