(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const section = document.getElementById('public-merch');
    const content = document.getElementById('public-merch-content');
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

    const formatAmount = (amountCents) => {
        const cents = Number(amountCents);

        if (!Number.isFinite(cents)) {
            return '';
        }

        return new Intl.NumberFormat('de-AT', {
            style: 'currency',
            currency: 'EUR'
        }).format(cents / 100);
    };

    const getAvailabilityLabel = (availability) => {
        if (availability === 'sold_out') {
            return 'Ausverkauft';
        }

        return 'Verfuegbar';
    };

    const getVariantTitle = (variant) => {
        return [
            variant.name,
            variant.size,
            variant.color
        ].filter(Boolean).join(' / ') || 'Variante';
    };

    const renderVariant = (variant) => {
        const item = document.createElement('div');
        item.className = 'public-merch-variant';

        const name = document.createElement('div');
        name.className = 'public-merch-variant-name';
        name.textContent = getVariantTitle(variant);
        item.appendChild(name);

        const metaParts = [
            variant.size ? `Groesse: ${variant.size}` : '',
            variant.color ? `Farbe: ${variant.color}` : ''
        ].filter(Boolean);

        if (metaParts.length) {
            const meta = document.createElement('div');
            meta.className = 'public-merch-variant-meta';
            meta.textContent = metaParts.join(' - ');
            item.appendChild(meta);
        }

        const footer = document.createElement('div');
        footer.className = 'public-merch-variant-footer';

        const price = formatAmount(variant.display_price_cents);
        if (price) {
            const priceNode = document.createElement('span');
            priceNode.className = 'public-merch-variant-price';
            priceNode.textContent = price;
            footer.appendChild(priceNode);
        }

        const availability = document.createElement('span');
        availability.className = `public-merch-availability ${variant.availability === 'sold_out' ? 'sold-out' : ''}`.trim();
        availability.textContent = getAvailabilityLabel(variant.availability);
        footer.appendChild(availability);

        item.appendChild(footer);
        return item;
    };

    const renderMerchCard = (merchItem) => {
        const card = document.createElement('article');
        card.className = 'card public-merch-card';

        const imageSrc = assetUrl(merchItem.image_path);
        if (imageSrc) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'public-merch-image-wrap';

            const image = document.createElement('img');
            image.className = 'public-merch-image';
            image.src = imageSrc;
            image.alt = merchItem.image_alt || merchItem.title || 'Fanartikel';
            image.loading = 'lazy';
            image.decoding = 'async';
            image.onerror = () => imageWrap.remove();

            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
        }

        const body = document.createElement('div');
        body.className = 'public-merch-body';

        const title = document.createElement('h3');
        title.className = 'public-merch-title';
        title.textContent = merchItem.title || 'Fanartikel';
        body.appendChild(title);

        if (merchItem.public_description) {
            const description = document.createElement('p');
            description.className = 'public-merch-description';
            description.textContent = merchItem.public_description;
            body.appendChild(description);
        }

        const price = formatAmount(merchItem.display_price_cents);
        if (price) {
            const priceNode = document.createElement('div');
            priceNode.className = 'public-merch-price';
            priceNode.textContent = `ab ${price}`;
            body.appendChild(priceNode);
        }

        const variants = Array.isArray(merchItem.variants) ? merchItem.variants : [];
        if (variants.length) {
            const variantsWrap = document.createElement('div');
            variantsWrap.className = 'public-merch-variants';

            variants.forEach((variant) => {
                variantsWrap.appendChild(renderVariant(variant));
            });

            body.appendChild(variantsWrap);
        }

        const ctaUrl = externalUrl(merchItem.public_cta_url);
        if (ctaUrl) {
            const actions = document.createElement('div');
            actions.className = 'public-merch-actions';

            const link = document.createElement('a');
            link.className = 'btn';
            link.href = ctaUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = merchItem.public_cta_label || 'Anfragen';

            actions.appendChild(link);
            body.appendChild(actions);
        }

        card.appendChild(body);
        return card;
    };

    const loadMerch = async () => {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_merch_items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: '{}'
            });

            if (!response.ok) {
                throw new Error(`Supabase RPC failed with status ${response.status}`);
            }

            const merchItems = await response.json();
            if (!Array.isArray(merchItems) || merchItems.length === 0) {
                removeSection();
                return;
            }

            content.innerHTML = '';

            merchItems.forEach((merchItem) => {
                if (merchItem.title) {
                    content.appendChild(renderMerchCard(merchItem));
                }
            });

            if (!content.children.length) {
                removeSection();
                return;
            }

            showSection();
        } catch (error) {
            console.warn('Could not load public merch', error);
            removeSection();
        }
    };

    loadMerch();
})();
