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

    const getAvailabilityState = (merchItem, variants = []) => {
        if (merchItem.availability === 'sold_out' || merchItem.status === 'sold_out') {
            return 'sold_out';
        }

        if (variants.length && variants.every((variant) => variant.availability === 'sold_out' || variant.status === 'sold_out' || Number(variant.stock_quantity || 0) <= 0)) {
            return 'sold_out';
        }

        if (Number(merchItem.stock_quantity || 0) <= 0 && !variants.length && merchItem.stock_quantity !== undefined) {
            return 'sold_out';
        }

        if (merchItem.is_preorder) {
            return 'preorder';
        }

        return 'available';
    };

    const getAvailabilityLabel = (availability) => {
        if (availability === 'sold_out') {
            return 'Ausverkauft';
        }

        if (availability === 'preorder') {
            return 'Vorbestellung möglich';
        }

        return 'Verfügbar';
    };

    const getItemBadges = (merchItem, variants = []) => {
        const badges = [];
        const availability = getAvailabilityState(merchItem, variants);

        if (merchItem.is_new) badges.push('Neu');
        if (merchItem.is_bestseller) badges.push('Bestseller');
        if (merchItem.is_preorder) badges.push('Vorbestellung');
        if (merchItem.is_limited) badges.push('Limitiert');
        if (merchItem.is_clearance) badges.push('Restposten');
        if (availability === 'sold_out') badges.push('Ausverkauft');

        return badges;
    };

    const renderBadges = (badges) => {
        if (!badges.length) {
            return null;
        }

        const wrap = document.createElement('div');
        wrap.className = 'public-merch-badges';

        badges.forEach((badge) => {
            const badgeNode = document.createElement('span');
            badgeNode.className = `public-merch-badge ${badge === 'Ausverkauft' ? 'is-muted' : ''}`.trim();
            badgeNode.textContent = badge;
            wrap.appendChild(badgeNode);
        });

        return wrap;
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
            variant.size ? `Größe: ${variant.size}` : '',
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

        const availabilityState = variant.availability || (variant.status === 'sold_out' ? 'sold_out' : 'available');
        const availability = document.createElement('span');
        availability.className = `public-merch-availability ${availabilityState === 'sold_out' ? 'sold-out' : ''}`.trim();
        availability.textContent = getAvailabilityLabel(availabilityState);
        footer.appendChild(availability);

        item.appendChild(footer);
        return item;
    };

    const renderMerchCard = (merchItem) => {
        const card = document.createElement('article');
        card.className = 'card public-merch-card';
        card.dataset.source = 'supabase-public-merch';

        const variants = Array.isArray(merchItem.variants) ? merchItem.variants : [];
        const availabilityState = getAvailabilityState(merchItem, variants);
        const badges = getItemBadges(merchItem, variants);

        const imageSrc = assetUrl(merchItem.image_path);
        if (imageSrc) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'public-merch-image-wrap';

            const image = document.createElement('img');
            image.className = 'public-merch-image';
            image.src = imageSrc;
            image.alt = merchItem.image_alt || merchItem.public_image_alt || merchItem.title || merchItem.name || 'Fanartikel';
            image.loading = 'lazy';
            image.decoding = 'async';
            image.onerror = () => imageWrap.remove();

            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
        }

        const body = document.createElement('div');
        body.className = 'public-merch-body';

        const badgeWrap = renderBadges(badges);
        if (badgeWrap) {
            body.appendChild(badgeWrap);
        }

        if (merchItem.category) {
            const category = document.createElement('div');
            category.className = 'public-merch-category';
            category.textContent = merchItem.category;
            body.appendChild(category);
        }

        const title = document.createElement('h3');
        title.className = 'public-merch-title';
        title.textContent = merchItem.title || merchItem.name || 'Fanartikel';
        body.appendChild(title);

        const shortDescription = merchItem.short_description || merchItem.public_description || merchItem.description;
        if (shortDescription) {
            const description = document.createElement('p');
            description.className = 'public-merch-description';
            description.textContent = shortDescription;
            body.appendChild(description);
        }

        const price = formatAmount(merchItem.display_price_cents);
        const memberPrice = formatAmount(merchItem.member_price_cents);
        if (price || memberPrice) {
            const priceWrap = document.createElement('div');
            priceWrap.className = 'public-merch-price-row';

            if (price) {
                const priceNode = document.createElement('div');
                priceNode.className = 'public-merch-price';
                priceNode.textContent = variants.length ? `ab ${price}` : price;
                priceWrap.appendChild(priceNode);
            }

            if (memberPrice) {
                const memberPriceNode = document.createElement('div');
                memberPriceNode.className = 'public-merch-member-price';
                memberPriceNode.textContent = `Mitglieder: ${memberPrice}`;
                priceWrap.appendChild(memberPriceNode);
            }

            body.appendChild(priceWrap);
        }

        const stock = document.createElement('div');
        stock.className = `public-merch-stock ${availabilityState === 'sold_out' ? 'sold-out' : ''}`.trim();
        stock.textContent = getAvailabilityLabel(availabilityState);
        body.appendChild(stock);

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
