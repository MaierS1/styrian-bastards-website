(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const section = document.getElementById('public-merch');
    const content = document.getElementById('public-merch-content');
    const detailRoot = document.getElementById('public-merch-detail');
    const dynamicSection = document.getElementById('public-dynamic');
    const dynamicGrid = dynamicSection?.querySelector('.public-dynamic-grid');

    if ((!section || !content) && !detailRoot) {
        return;
    }

    const syncDynamicLayout = () => {
        if (!dynamicGrid) return;

        const panelCount = dynamicGrid.querySelectorAll('.public-dynamic-panel').length;
        dynamicGrid.classList.toggle('single-panel', panelCount === 1);
    };

    const removeSection = () => {
        if (section) section.remove();
        syncDynamicLayout();

        if (dynamicSection && !dynamicSection.querySelector('#public-events, #public-merch, #public-media')) {
            dynamicSection.remove();
        }
    };

    const showSection = () => {
        if (section) section.hidden = false;
        syncDynamicLayout();

        if (dynamicSection) {
            dynamicSection.hidden = false;
        }
    };

    const firstValue = (...values) => values.find((value) => value !== null && value !== undefined && value !== '');

    const toArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return [];

            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
                } catch {
                    return [];
                }
            }

            return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
        }

        return [];
    };

    const assetUrl = (path) => {
        if (!path) return '';

        if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) {
            return path;
        }

        return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${encodeURI(path)}`;
    };

    const imagePathValue = (image) => {
        if (!image) return '';
        if (typeof image === 'string') return image;
        return firstValue(image.path, image.image_path, image.url, image.src);
    };

    const externalUrl = (url) => {
        if (!url) return '';

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

    const normalizeVariant = (variant = {}, fallbackPriceCents = null) => {
        const displayPrice = firstValue(variant.display_price_cents, variant.price_cents, fallbackPriceCents);

        return {
            ...variant,
            id: firstValue(variant.id, variant.variant_id, variant.sku),
            merch_item_id: firstValue(variant.merch_item_id, variant.item_id),
            name: firstValue(variant.name, variant.variant_name),
            size: firstValue(variant.size, variant.groesse),
            color: firstValue(variant.color, variant.colour, variant.farbe),
            display_price_cents: displayPrice,
            stock_quantity: firstValue(variant.stock_quantity, variant.stock, variant.quantity),
            reorder_level: firstValue(variant.reorder_level, variant.minimum_stock),
            status: firstValue(variant.status, variant.availability),
            is_public: variant.is_public !== false,
            availability: firstValue(variant.availability, variant.status)
        };
    };

    const isOrderableVariant = (variant) => {
        return variant
            && variant.is_public !== false
            && variant.status === 'active'
            && Number(variant.stock_quantity ?? 0) > 0;
    };

    const normalizeMerchItem = (item = {}) => {
        const basePrice = firstValue(item.display_price_cents, item.base_price_cents, item.price_cents);
        const variants = toArray(item.variants).map((variant) => normalizeVariant(variant, basePrice));
        const imagePaths = [
            firstValue(item.image_path, item.image_url, item.main_image_path),
            ...toArray(firstValue(item.image_paths, item.images, item.gallery_images, item.public_images))
        ].map(imagePathValue).filter(Boolean);

        return {
            ...item,
            id: firstValue(item.id, item.item_id, item.slug, item.item_number),
            item_number: firstValue(item.item_number, item.article_number, item.sku),
            title: firstValue(item.title, item.public_title, item.name),
            short_description: firstValue(item.short_description, item.public_description, item.summary),
            description: firstValue(item.description, item.long_description, item.public_description),
            image_path: imagePaths[0] || '',
            image_paths: Array.from(new Set(imagePaths)),
            image_alt: firstValue(item.image_alt, item.public_image_alt, item.title, item.name, 'Fanartikel'),
            category: firstValue(item.category, item.product_category),
            display_price_cents: basePrice,
            member_price_cents: firstValue(item.member_price_cents, item.members_price_cents),
            shipping_cost_cents: firstValue(item.shipping_cost_cents, item.shipping_price_cents),
            pickup_available: item.pickup_available !== false,
            shipping_available: Boolean(item.shipping_available),
            variants
        };
    };

    const getAvailabilityState = (merchItem, variants = []) => {
        const orderableVariants = variants.filter((variant) => isOrderableVariant(variant));

        if (orderableVariants.length > 0) {
            return 'available';
        }

        if (merchItem.is_preorder) {
            return 'preorder';
        }

        return 'available';
    };

    const getAvailabilityLabel = (availability) => {
        if (availability === 'sold_out') return 'Ausverkauft';
        if (availability === 'preorder') return 'Vorbestellung möglich';
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

    const appendTextNode = (parent, tagName, className, text) => {
        if (!text) return null;

        const node = document.createElement(tagName);
        if (className) node.className = className;
        node.textContent = text;
        parent.appendChild(node);
        return node;
    };

    const renderBadges = (badges, className = 'public-merch-badges') => {
        if (!badges.length) return null;

        const wrap = document.createElement('div');
        wrap.className = className;

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

        appendTextNode(item, 'div', 'public-merch-variant-name', getVariantTitle(variant));

        const metaParts = [
            variant.size ? `Größe: ${variant.size}` : '',
            variant.color ? `Farbe: ${variant.color}` : ''
        ].filter(Boolean);

        appendTextNode(item, 'div', 'public-merch-variant-meta', metaParts.join(' - '));

        const footer = document.createElement('div');
        footer.className = 'public-merch-variant-footer';

        const price = formatAmount(variant.display_price_cents);
        appendTextNode(footer, 'span', 'public-merch-variant-price', price);

        const availabilityState = isOrderableVariant(variant) ? 'available' : 'sold_out';
        const availability = document.createElement('span');
        availability.className = `public-merch-availability ${availabilityState === 'sold_out' ? 'sold-out' : ''}`.trim();
        availability.textContent = getAvailabilityLabel(availabilityState);
        footer.appendChild(availability);

        item.appendChild(footer);
        return item;
    };

    const buildDetailUrl = (merchItem) => {
        if (!merchItem.id) return '';
        return `merch.html?id=${encodeURIComponent(merchItem.id)}`;
    };

    const renderMerchCard = (rawMerchItem) => {
        const merchItem = normalizeMerchItem(rawMerchItem);
        const card = document.createElement('article');
        card.className = 'card public-merch-card';
        card.dataset.source = 'supabase-public-merch';

        const variants = merchItem.variants;
        const availabilityState = getAvailabilityState(merchItem, variants);
        const badges = getItemBadges(merchItem, variants);
        const detailUrl = buildDetailUrl(merchItem);

        const cardLink = document.createElement(detailUrl ? 'a' : 'div');
        cardLink.className = 'public-merch-card-link';
        if (detailUrl) {
            cardLink.href = detailUrl;
            cardLink.setAttribute('aria-label', `${merchItem.title} ansehen`);
        }

        const imageSrc = assetUrl(merchItem.image_path);
        if (imageSrc) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'public-merch-image-wrap';

            const image = document.createElement('img');
            image.className = 'public-merch-image';
            image.src = imageSrc;
            image.alt = merchItem.image_alt;
            image.loading = 'lazy';
            image.decoding = 'async';
            image.onerror = () => imageWrap.remove();

            imageWrap.appendChild(image);
            cardLink.appendChild(imageWrap);
        }

        const body = document.createElement('div');
        body.className = 'public-merch-body';

        const badgeWrap = renderBadges(badges);
        if (badgeWrap) body.appendChild(badgeWrap);

        appendTextNode(body, 'div', 'public-merch-category', merchItem.category);
        appendTextNode(body, 'h3', 'public-merch-title', merchItem.title || 'Fanartikel');
        appendTextNode(body, 'p', 'public-merch-description', merchItem.short_description || merchItem.description);

        const price = formatAmount(merchItem.display_price_cents);
        const memberPrice = formatAmount(merchItem.member_price_cents);
        if (price || memberPrice) {
            const priceWrap = document.createElement('div');
            priceWrap.className = 'public-merch-price-row';
            appendTextNode(priceWrap, 'div', 'public-merch-price', price ? (variants.length ? `ab ${price}` : price) : '');
            appendTextNode(priceWrap, 'div', 'public-merch-member-price', memberPrice ? `Mitglieder: ${memberPrice}` : '');
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

        cardLink.appendChild(body);
        card.appendChild(cardLink);

        const ctaUrl = externalUrl(merchItem.public_cta_url);
        if (ctaUrl) {
            const actions = document.createElement('div');
            actions.className = 'public-merch-actions';

            const link = document.createElement('a');
            link.className = 'btn btn-primary';
            link.href = ctaUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = merchItem.public_cta_label || 'Anfragen';

            actions.appendChild(link);
            card.appendChild(actions);
        } else if (detailUrl) {
            const actions = document.createElement('div');
            actions.className = 'public-merch-actions';

            const link = document.createElement('a');
            link.className = 'btn btn-primary';
            link.href = detailUrl;
            link.textContent = 'Details ansehen';

            actions.appendChild(link);
            card.appendChild(actions);
        }

        return card;
    };

    const uniqueValues = (variants, key) => {
        return Array.from(new Set(variants.map((variant) => variant[key]).filter(Boolean)));
    };

    const renderDetailList = (parent, label, value) => {
        const row = document.createElement('div');
        row.className = 'merch-detail-fact';
        appendTextNode(row, 'span', 'merch-detail-fact-label', label);
        appendTextNode(row, 'strong', '', value || '-');
        parent.appendChild(row);
    };

    const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

    const cleanPayload = (payload) => Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    const createPublicShopOrderRpc = async (payload) => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_public_shop_order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify(cleanPayload(payload))
        });

        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`submit_failed: ${response.status} ${responseText}`);
        }

        const rows = responseText ? JSON.parse(responseText) : [];
        return Array.isArray(rows) ? rows[0] : rows;
    };

    const getOrderableVariants = (merchItem) => {
        return merchItem.variants.filter((variant) => {
            return isOrderableVariant(variant);
        });
    };

    const getSelectedOrderVariant = (form, merchItem) => {
        const variantId = form.querySelector('[name="variant"]')?.value;
        if (!variantId) return getOrderableVariants(merchItem)[0] || null;
        return merchItem.variants.find((variant) => String(variant.id) === variantId) || null;
    };

    const renderOrderRequestForm = (merchItem, availabilityState) => {
        const wrap = document.createElement('section');
        wrap.className = 'merch-order-request';

        appendTextNode(wrap, 'h2', '', 'Bestellanfrage senden');
        appendTextNode(wrap, 'p', 'merch-order-request-note', 'Die Bestellung ist erst nach Bestätigung durch den Verein verbindlich.');

        if (availabilityState === 'sold_out') {
            appendTextNode(wrap, 'p', 'merch-order-message error', 'Dieser Artikel ist derzeit ausverkauft und kann nicht angefragt werden.');
            return wrap;
        }

        const form = document.createElement('form');
        form.className = 'merch-order-form';
        form.noValidate = true;

        const orderableVariants = getOrderableVariants(merchItem);

        if (orderableVariants.length === 0) {
            appendTextNode(wrap, 'p', 'merch-order-message error', 'Dieser Artikel ist derzeit nicht bestellbar.');
            return wrap;
        }

        if (merchItem.variants.length) {
            const label = document.createElement('label');
            label.textContent = 'Variante';
            const select = document.createElement('select');
            select.name = 'variant';
            select.required = true;

            orderableVariants.forEach((variant) => {
                const option = document.createElement('option');
                option.value = variant.id;
                option.textContent = `${getVariantTitle(variant)}${formatAmount(variant.display_price_cents) ? ` - ${formatAmount(variant.display_price_cents)}` : ''}`;
                select.appendChild(option);
            });

            label.appendChild(select);
            form.appendChild(label);
        }

        [
            { label: 'Name', name: 'name', type: 'text', required: true, autocomplete: 'name' },
            { label: 'E-Mail', name: 'email', type: 'email', required: true, autocomplete: 'email' },
            { label: 'Telefon optional', name: 'phone', type: 'tel', autocomplete: 'tel' },
            { label: 'Menge', name: 'quantity', type: 'number', required: true, min: '1', value: '1' }
        ].forEach((field) => {
            const label = document.createElement('label');
            label.textContent = field.label;
            const input = document.createElement('input');
            input.name = field.name;
            input.type = field.type;
            input.required = Boolean(field.required);
            if (field.min) input.min = field.min;
            if (field.value) input.value = field.value;
            if (field.autocomplete) input.autocomplete = field.autocomplete;
            label.appendChild(input);
            form.appendChild(label);
        });

        const deliveryLabel = document.createElement('label');
        deliveryLabel.textContent = 'Abholung oder Versand';
        const deliverySelect = document.createElement('select');
        deliverySelect.name = 'delivery';
        deliverySelect.required = true;

        [
            merchItem.pickup_available ? ['pickup', 'Abholung'] : null,
            merchItem.shipping_available ? ['shipping', 'Versand'] : null
        ].filter(Boolean).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            deliverySelect.appendChild(option);
        });

        if (!deliverySelect.children.length) {
            const option = document.createElement('option');
            option.value = 'pickup';
            option.textContent = 'Abholung';
            deliverySelect.appendChild(option);
        }

        deliveryLabel.appendChild(deliverySelect);
        form.appendChild(deliveryLabel);

        const addressLabel = document.createElement('label');
        addressLabel.className = 'merch-order-address';
        addressLabel.textContent = 'Adresse bei Versand';
        const address = document.createElement('textarea');
        address.name = 'address';
        address.rows = 3;
        address.placeholder = 'Straße, PLZ, Ort';
        addressLabel.appendChild(address);
        form.appendChild(addressLabel);

        const messageLabel = document.createElement('label');
        messageLabel.textContent = 'Nachricht/Bemerkung optional';
        const message = document.createElement('textarea');
        message.name = 'message';
        message.rows = 4;
        messageLabel.appendChild(message);
        form.appendChild(messageLabel);

        const submit = document.createElement('button');
        submit.className = 'btn btn-primary merch-order-submit';
        submit.type = 'submit';
        submit.textContent = 'Bestellanfrage senden';

        const feedback = document.createElement('p');
        feedback.className = 'merch-order-message';

        form.appendChild(submit);
        form.appendChild(feedback);

        const syncAddressRequirement = () => {
            const shipping = deliverySelect.value === 'shipping';
            address.required = shipping;
            addressLabel.classList.toggle('is-required', shipping);
        };

        deliverySelect.addEventListener('change', syncAddressRequirement);
        syncAddressRequirement();

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            feedback.textContent = '';
            feedback.className = 'merch-order-message';

            const formData = new FormData(form);
            const name = String(formData.get('name') || '').trim();
            const email = String(formData.get('email') || '').trim();
            const phone = String(formData.get('phone') || '').trim();
            const quantity = Number(formData.get('quantity') || 0);
            const delivery = String(formData.get('delivery') || 'pickup');
            const addressValue = String(formData.get('address') || '').trim();
            const messageValue = String(formData.get('message') || '').trim();
            const selectedVariant = getSelectedOrderVariant(form, merchItem);

            if (!name || !email) {
                feedback.textContent = 'Bitte Name und E-Mail ausfüllen.';
                feedback.classList.add('error');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                feedback.textContent = 'Bitte eine gültige E-Mail-Adresse eingeben.';
                feedback.classList.add('error');
                return;
            }

            if (!Number.isInteger(quantity) || quantity < 1) {
                feedback.textContent = 'Die Menge muss mindestens 1 sein.';
                feedback.classList.add('error');
                return;
            }

            if (delivery === 'shipping' && !addressValue) {
                feedback.textContent = 'Bitte für den Versand eine Adresse angeben.';
                feedback.classList.add('error');
                return;
            }

            if (merchItem.variants.length && !selectedVariant) {
                feedback.textContent = 'Bitte eine verfügbare Variante auswählen.';
                feedback.classList.add('error');
                return;
            }

            submit.disabled = true;
            submit.textContent = 'Wird gesendet...';

            try {
                await createPublicShopOrderRpc({
                    p_merch_item_id: merchItem.id,
                    p_merch_variant_id: selectedVariant?.id ?? null,
                    p_customer_name: name,
                    p_customer_email: email,
                    p_customer_phone: phone || undefined,
                    p_quantity: quantity,
                    p_fulfillment_method: delivery,
                    p_shipping_address: delivery === 'shipping' ? addressValue : undefined,
                    p_customer_note: messageValue || undefined
                });

                form.reset();
                syncAddressRequirement();
                feedback.textContent = 'Danke! Deine Bestellanfrage wurde an den Verein übermittelt.';
                feedback.classList.add('success');
            } catch (error) {
                console.error('Could not submit merch order request', error);
                const errorText = String(error?.message || '');
                feedback.textContent = /item is sold out or requested quantity is not available/i.test(errorText)
                    ? 'Dieser Artikel ist derzeit nicht verfügbar oder die gewünschte Menge ist nicht lagernd.'
                    : 'Die Bestellanfrage konnte gerade nicht gesendet werden. Bitte versuche es später erneut oder kontaktiere den Verein direkt.';
                feedback.classList.add('error');
            } finally {
                submit.disabled = false;
                submit.textContent = 'Bestellanfrage senden';
            }
        });

        wrap.appendChild(form);
        return wrap;
    };

    const renderMerchDetail = (merchItems) => {
        if (!detailRoot) return;

        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get('id');
        const items = merchItems.map(normalizeMerchItem);
        const merchItem = items.find((item) => String(item.id) === requestedId || String(item.item_number) === requestedId);

        detailRoot.innerHTML = '';

        if (!requestedId || !merchItem) {
            detailRoot.innerHTML = `
                <a class="merch-detail-back" href="/index.html#public-dynamic">Zurück zum Shop</a>
                <p class="merch-detail-status">Dieser Artikel konnte nicht gefunden werden.</p>
            `;
            return;
        }

        const variants = merchItem.variants;
        const availabilityState = getAvailabilityState(merchItem, variants);
        const badges = getItemBadges(merchItem, variants);
        const imagePaths = merchItem.image_paths.length ? merchItem.image_paths : [merchItem.image_path].filter(Boolean);

        const backLink = document.createElement('a');
        backLink.className = 'merch-detail-back';
        backLink.href = '/index.html#public-dynamic';
        backLink.textContent = 'Zurück zum Shop';
        detailRoot.appendChild(backLink);

        const layout = document.createElement('article');
        layout.className = 'merch-detail-layout';

        const media = document.createElement('div');
        media.className = 'merch-detail-media';

        const mainImageSrc = assetUrl(imagePaths[0]);
        if (mainImageSrc) {
            const image = document.createElement('img');
            image.className = 'merch-detail-main-image';
            image.src = mainImageSrc;
            image.alt = merchItem.image_alt;
            image.loading = 'eager';
            media.appendChild(image);
        } else {
            appendTextNode(media, 'div', 'merch-detail-image-placeholder', 'Kein Bild vorhanden');
        }

        if (imagePaths.length > 1) {
            const gallery = document.createElement('div');
            gallery.className = 'merch-detail-gallery';
            imagePaths.slice(1).forEach((path) => {
                const image = document.createElement('img');
                image.src = assetUrl(path);
                image.alt = merchItem.image_alt;
                image.loading = 'lazy';
                gallery.appendChild(image);
            });
            media.appendChild(gallery);
        }

        const body = document.createElement('div');
        body.className = 'merch-detail-body';

        const badgeWrap = renderBadges(badges, 'merch-detail-badges');
        if (badgeWrap) body.appendChild(badgeWrap);

        appendTextNode(body, 'div', 'merch-detail-category', merchItem.category);
        appendTextNode(body, 'h1', '', merchItem.title || 'Fanartikel');
        appendTextNode(body, 'p', 'merch-detail-short', merchItem.short_description);

        const priceBox = document.createElement('div');
        priceBox.className = 'merch-detail-price-box';
        appendTextNode(priceBox, 'div', 'merch-detail-price', formatAmount(merchItem.display_price_cents));
        appendTextNode(priceBox, 'div', 'merch-detail-member-price', formatAmount(merchItem.member_price_cents) ? `Mitgliederpreis: ${formatAmount(merchItem.member_price_cents)}` : '');
        const availability = document.createElement('span');
        availability.className = `merch-detail-availability ${availabilityState === 'sold_out' ? 'sold-out' : ''}`.trim();
        availability.textContent = getAvailabilityLabel(availabilityState);
        priceBox.appendChild(availability);
        body.appendChild(priceBox);

        appendTextNode(body, 'p', 'merch-detail-order-note', 'Bestellungen sind derzeit direkt über den Verein möglich.');
        appendTextNode(body, 'p', 'merch-detail-description', merchItem.description);

        const facts = document.createElement('div');
        facts.className = 'merch-detail-facts';
        renderDetailList(facts, 'Artikelnummer', merchItem.item_number);
        renderDetailList(facts, 'Kategorie', merchItem.category);
        renderDetailList(facts, 'Größen', uniqueValues(variants, 'size').join(', '));
        renderDetailList(facts, 'Farben', uniqueValues(variants, 'color').join(', '));
        renderDetailList(facts, 'Versand möglich', merchItem.shipping_available ? 'Ja' : 'Nein');
        renderDetailList(facts, 'Abholung möglich', merchItem.pickup_available ? 'Ja' : 'Nein');
        renderDetailList(facts, 'Versandkosten', merchItem.shipping_available ? (formatAmount(merchItem.shipping_cost_cents) || 'Nach Vereinbarung') : '-');
        body.appendChild(facts);

        if (variants.length) {
            const variantsSection = document.createElement('div');
            variantsSection.className = 'merch-detail-variants';
            appendTextNode(variantsSection, 'h2', '', 'Varianten');
            variants.forEach((variant) => variantsSection.appendChild(renderVariant(variant)));
            body.appendChild(variantsSection);
        }

        body.appendChild(renderOrderRequestForm(merchItem, availabilityState));

        layout.appendChild(media);
        layout.appendChild(body);
        detailRoot.appendChild(layout);
    };

    const fetchMerchItems = async () => {
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
        return Array.isArray(merchItems) ? merchItems : [];
    };

    const loadMerch = async () => {
        try {
            const merchItems = await fetchMerchItems();

            if (detailRoot) {
                renderMerchDetail(merchItems);
            }

            if (!section || !content) {
                return;
            }

            if (!merchItems.length) {
                removeSection();
                return;
            }

            content.innerHTML = '';

            merchItems.forEach((merchItem) => {
                const normalized = normalizeMerchItem(merchItem);
                if (normalized.title) {
                    content.appendChild(renderMerchCard(normalized));
                }
            });

            if (!content.children.length) {
                removeSection();
                return;
            }

            showSection();
        } catch (error) {
            console.warn('Could not load public merch', error);

            if (detailRoot) {
                detailRoot.innerHTML = `
                    <a class="merch-detail-back" href="/index.html#public-dynamic">Zurück zum Shop</a>
                    <p class="merch-detail-status">Shop & Fanartikel konnten gerade nicht geladen werden.</p>
                `;
            }

            if (section && content) {
                removeSection();
            }
        }
    };

    loadMerch();
})();
