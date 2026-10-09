(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const section = document.getElementById('public-media');
    const content = document.getElementById('public-media-content');
    const dynamicSection = document.getElementById('public-dynamic');
    const dynamicGrid = dynamicSection?.querySelector('.public-dynamic-grid');

    if (!section || !content) {
        return;
    }

    const syncDynamicLayout = () => {
        if (!dynamicGrid) {
            return;
        }

        const panelCount = dynamicGrid.querySelectorAll('.public-dynamic-panel').length;
        dynamicGrid.classList.toggle('single-panel', panelCount === 1);
    };

    const removeSection = () => {
        section.remove();
        syncDynamicLayout();

        if (dynamicSection && !dynamicSection.querySelector('#public-events, #public-merch, #public-media')) {
            dynamicSection.remove();
        }
    };

    const showSection = () => {
        section.hidden = false;
        syncDynamicLayout();

        if (dynamicSection) {
            dynamicSection.hidden = false;
        }
    };

    const assetUrl = (path) => {
        if (!path) {
            return '';
        }

        if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) {
            return path;
        }

        return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${encodeURI(path)}`;
    };

    const externalUrl = (url) => {
        if (!url) {
            return '';
        }

        if (/^https?:\/\//i.test(url)) {
            return url;
        }

        return `https://${url}`;
    };

    const pressDetailHref = (item) => {
        if (item.slug) {
            return `/presse.html?slug=${encodeURIComponent(item.slug)}`;
        }

        if (item.id) {
            return `/presse.html?id=${encodeURIComponent(item.id)}`;
        }

        return '';
    };

    const encodePathSegment = (value) => {
        try {
            return encodeURIComponent(decodeURIComponent(value));
        } catch (error) {
            return encodeURIComponent(value);
        }
    };

    const pressDetailHrefFromUrl = (url) => {
        if (!url) {
            return '';
        }

        const value = String(url).trim().replace(/^https?:\/\/(?:www\.)?styrian-bastards\.at/i, '');
        const directDetail = value.match(/^\/?presse\.html(\?.*)?$/i);
        if (directDetail) {
            return `/${value.replace(/^\//, '')}`;
        }

        const queryDetail = value.match(/^\/?(?:presse|news)\/?\?(.+)$/i);
        if (queryDetail) {
            return `/presse.html?${queryDetail[1]}`;
        }

        const slugDetail = value.match(/^\/?(?:presse|news)\/([^?#/]+)/i);
        if (slugDetail) {
            return `/presse.html?slug=${encodePathSegment(slugDetail[1])}`;
        }

        return '';
    };

    const formatMediaDate = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(`${value}T00:00:00`);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('de-AT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const getCategoryLabel = (value) => {
        const labels = {
            presseartikel: 'Presseartikel',
            podcast: 'Podcast',
            radiosendung: 'Radiosendung',
            interview: 'Interview',
            eventbericht: 'Eventbericht',
            vereinsnews: 'Vereinsnews',
            'sponsor-news': 'Sponsor-News',
            sonstiges: 'Sonstiges'
        };

        return labels[String(value || 'sonstiges').toLowerCase()] || labels.sonstiges;
    };

    const getAudioLabel = (item) => {
        if (item.category === 'podcast') {
            return 'Podcast hoeren';
        }

        if (item.category === 'radiosendung') {
            return 'Sendung hoeren';
        }

        return 'Audio hoeren';
    };

    const createAction = (href, label, className) => {
        const link = document.createElement('a');
        link.className = className;
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        return link;
    };

    const renderMediaCard = (item, isFeatured = false) => {
        const card = document.createElement('article');
        card.className = `card public-media-card ${isFeatured ? 'public-media-featured' : 'compact'}`.trim();
        const cardDetailHref = pressDetailHref(item) || pressDetailHrefFromUrl(item.external_url);

        if (cardDetailHref) {
            card.tabIndex = 0;
            card.setAttribute('role', 'link');
            card.style.cursor = 'pointer';

            const openDetail = () => {
                window.location.href = cardDetailHref;
            };

            card.addEventListener('click', (event) => {
                if (event.target.closest('a')) {
                    return;
                }

                openDetail();
            });

            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDetail();
                }
            });
        }

        const imageSrc = assetUrl(item.image_path);
        if (imageSrc) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'public-media-image-wrap';

            const image = document.createElement('img');
            image.className = 'public-media-image';
            image.src = imageSrc;
            image.alt = item.image_alt || item.title || getCategoryLabel(item.category);
            image.loading = 'lazy';
            image.decoding = 'async';
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
        body.className = 'public-media-body';

        const meta = document.createElement('div');
        meta.className = 'public-media-meta';

        const category = document.createElement('span');
        category.className = 'public-media-category';
        category.textContent = getCategoryLabel(item.category);
        meta.appendChild(category);

        const dateLabel = formatMediaDate(item.publication_date);
        if (dateLabel) {
            const date = document.createElement('span');
            date.className = 'public-media-date';
            date.textContent = dateLabel;
            meta.appendChild(date);
        }

        body.appendChild(meta);

        const title = document.createElement('h3');
        title.textContent = item.title || 'Medienbeitrag';
        body.appendChild(title);

        if (item.source_name) {
            const source = document.createElement('div');
            source.className = 'public-media-source';
            source.textContent = item.source_name;
            body.appendChild(source);
        }

        if (item.summary) {
            const summary = document.createElement('p');
            summary.className = 'public-media-summary';
            summary.textContent = item.summary;
            body.appendChild(summary);
        }

        const articleUrl = cardDetailHref || externalUrl(item.external_url);
        const audioUrl = externalUrl(item.audio_url);
        if (articleUrl || audioUrl) {
            const actions = document.createElement('div');
            actions.className = 'public-media-actions';

            if (articleUrl) {
                actions.appendChild(createAction(articleUrl, 'Artikel lesen', 'btn btn-primary'));
            }

            if (audioUrl) {
                actions.appendChild(createAction(audioUrl, getAudioLabel(item), articleUrl ? 'btn btn-secondary' : 'btn btn-primary'));
            }

            body.appendChild(actions);
        }

        card.appendChild(body);
        return card;
    };

    const renderMediaItems = (items) => {
        const featured = items.find((item) => item.is_featured) || items[0];
        const moreItems = items.filter((item) => item !== featured);

        content.innerHTML = '';
        content.appendChild(renderMediaCard(featured, true));

        if (moreItems.length) {
            const moreGrid = document.createElement('div');
            moreGrid.className = 'public-media-more-grid';

            moreItems.forEach((item) => {
                moreGrid.appendChild(renderMediaCard(item, false));
            });

            content.appendChild(moreGrid);
        }
    };

    // Opt-in V2 press preview. Disabled by default until live RPC and detail-page verification.
    // V2 cards are intentionally read-only: V1 press detail links must not receive V2 IDs.
    const V2_PRESS_ENABLED = window.STB_V2_PRESS_ENABLED === true;
    const V2_URL = 'https://yktioliukcrrccrfwxad.supabase.co';

    const fetchV2Press = async () => {
        const key = window.STB_V2_SHOP_PUBLISHABLE_KEY;
        if (!V2_PRESS_ENABLED || typeof key !== 'string' || !key.trim()) {
            return [];
        }
        const response = await fetch(`${V2_URL}/rest/v1/rpc/get_public_press`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'apikey': key },
            body: JSON.stringify({ p_limit: 5, p_after: null })
        });
        if (!response.ok) {
            throw new Error(`V2 press RPC failed with status ${response.status}`);
        }
        const records = await response.json();
        if (!Array.isArray(records)) {
            throw new Error('V2 press RPC returned invalid data');
        }
        return records.filter((item) => item && item.title).map((item) => ({
            title: item.title,
            summary: item.teaser || '',
            category: item.category || 'presseartikel',
            publication_date: typeof item.published_at === 'string' ? item.published_at.slice(0, 10) : '',
            image_path: typeof item.image_path === 'string' && item.image_path
                ? (/^https:\/\//i.test(item.image_path)
                    ? item.image_path
                    : `${V2_URL}/storage/v1/object/public/public-assets/${encodeURI(item.image_path)}`)
                : '',
            // No id/slug: the existing press detail page is V1-only.
            is_featured: false
        }));
    };

    const loadMedia = async () => {
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
                    p_limit: 5,
                    p_featured_only: false
                })
            });

            if (!response.ok) {
                throw new Error(`Supabase RPC failed with status ${response.status}`);
            }

            const mediaItems = await response.json();
            if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
                removeSection();
                return;
            }

            const renderableItems = mediaItems.filter((item) => item.title);
            if (!renderableItems.length) {
                removeSection();
                return;
            }

            let visibleItems = renderableItems;
            if (V2_PRESS_ENABLED) {
                try {
                    const v2Items = await fetchV2Press();
                    const existing = new Set(v2Items.map((item) => item.title.trim().toLocaleLowerCase('de-AT')));
                    visibleItems = [...v2Items, ...renderableItems.filter((item) => !existing.has(item.title.trim().toLocaleLowerCase('de-AT')))];
                } catch (error) {
                    console.warn('V2 press preview unavailable; keeping V1 items', error);
                }
            }
            renderMediaItems(visibleItems);
            showSection();
        } catch (error) {
            console.warn('Could not load public media', error);
            removeSection();
        }
    };

    loadMedia();
})();
