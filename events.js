(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const publicEventsSection = document.getElementById('public-events');
    const publicEventsContent = document.getElementById('public-events-content');
    const eventDetailRoot = document.getElementById('event-detail');
    const eventDetailContent = document.getElementById('event-detail-content');
    const dynamicSection = document.getElementById('public-dynamic');
    const dynamicGrid = dynamicSection?.querySelector('.public-dynamic-grid');

    if (!publicEventsSection && !eventDetailRoot) {
        return;
    }

    const categoryLabels = {
        treffen: 'Treffen',
        fanfahrt: 'Fanfahrten',
        cornhole: 'Cornhole',
        vereinsveranstaltung: 'Vereinsveranstaltung',
        sonstiges: 'Sonstiges'
    };

    const syncDynamicLayout = () => {
        if (!dynamicGrid) {
            return;
        }

        const panelCount = dynamicGrid.querySelectorAll('.public-dynamic-panel').length;
        dynamicGrid.classList.toggle('single-panel', panelCount === 1);
    };

    const assetUrl = (value) => {
        if (!value) {
            return '';
        }

        if (/^https?:\/\//i.test(value) || /^data:/i.test(value)) {
            return value;
        }

        return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${encodeURI(value)}`;
    };

    const externalUrl = (value) => {
        if (!value) {
            return '';
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        return `https://${value}`;
    };

    const formatDate = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('de-AT', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    const formatTime = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return `${new Intl.DateTimeFormat('de-AT', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)} Uhr`;
    };

    const formatDateTime = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat('de-AT', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatShortDateTime = (value) => {
        if (!value) {
            return '-';
        }

        const formatted = formatDateTime(value);
        return formatted || value;
    };

    const getEventTitle = (event) => event.title || event.public_title || event.name || 'Event';

    const getEventCategoryLabel = (value) => categoryLabels[String(value || 'sonstiges').toLowerCase()] || categoryLabels.sonstiges;

    const sortEvents = (items) => items.slice().sort((left, right) => {
        const leftSource = left.starts_at || (left.event_date ? `${left.event_date}T00:00:00` : '');
        const rightSource = right.starts_at || (right.event_date ? `${right.event_date}T00:00:00` : '');
        const leftDate = new Date(leftSource).getTime() || Number.POSITIVE_INFINITY;
        const rightDate = new Date(rightSource).getTime() || Number.POSITIVE_INFINITY;

        if (leftDate !== rightDate) {
            return leftDate - rightDate;
        }

        return String(getEventTitle(left)).localeCompare(String(getEventTitle(right)), 'de');
    });

    const createLink = (href, label, className) => {
        const link = document.createElement('a');
        link.href = href;
        link.className = className;
        link.textContent = label;
        return link;
    };

    const createMetaItem = (label, value) => {
        const item = document.createElement('span');
        item.textContent = `${label}: ${value}`;
        return item;
    };

    const createEmptyState = (message) => {
        const paragraph = document.createElement('p');
        paragraph.className = 'public-events-empty event-detail-empty';
        paragraph.textContent = message;
        return paragraph;
    };

    const renderEventCard = (event) => {
        const link = document.createElement('a');
        link.className = 'public-event-link';
        link.href = `event.html?id=${encodeURIComponent(event.id)}`;

        const card = document.createElement('article');
        card.className = 'card public-event-card';

        const imageSrc = assetUrl(event.public_image_url || event.public_image_path);
        if (imageSrc) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'public-event-image-wrap';

            const image = document.createElement('img');
            image.className = 'public-event-image';
            image.src = imageSrc;
            image.alt = getEventTitle(event);
            image.loading = 'lazy';
            image.decoding = 'async';
            image.onerror = () => imageWrap.remove();

            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
        }

        const body = document.createElement('div');
        body.className = 'public-event-body';

        const category = document.createElement('div');
        category.className = 'public-event-category';
        category.textContent = getEventCategoryLabel(event.event_category);
        body.appendChild(category);

        const title = document.createElement('h3');
        title.textContent = getEventTitle(event);
        body.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'public-event-meta';

        const dateValue = formatDate(event.starts_at || event.event_date);
        if (dateValue) {
            meta.appendChild(createMetaItem('Datum', dateValue));
        }

        const timeValue = formatTime(event.starts_at);
        if (timeValue) {
            meta.appendChild(createMetaItem('Uhrzeit', timeValue));
        }

        if (event.location) {
            meta.appendChild(createMetaItem('Ort', event.location));
        }

        if (event.contact_person) {
            meta.appendChild(createMetaItem('Kontakt', event.contact_person));
        }

        if (meta.children.length) {
            body.appendChild(meta);
        }

        const descriptionText = event.short_description || event.public_description || event.description;
        if (descriptionText) {
            const description = document.createElement('p');
            description.className = 'public-event-description';
            description.textContent = descriptionText;
            body.appendChild(description);
        }

        card.appendChild(body);
        link.appendChild(card);
        return link;
    };

    const renderEventDetail = (event) => {
        document.title = `${getEventTitle(event)} | Styrian Bastards`;

        const wrapper = document.createElement('article');
        wrapper.className = 'event-detail-card';

        const imageSrc = assetUrl(event.public_image_url || event.public_image_path);
        if (imageSrc) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'event-detail-image-wrap';

            const image = document.createElement('img');
            image.className = 'event-detail-image';
            image.src = imageSrc;
            image.alt = getEventTitle(event);
            image.loading = 'eager';
            image.decoding = 'async';
            image.onerror = () => imageWrap.remove();

            imageWrap.appendChild(image);
            wrapper.appendChild(imageWrap);
        }

        const body = document.createElement('div');
        body.className = 'event-detail-body';

        const breadcrumb = document.createElement('a');
        breadcrumb.className = 'event-detail-backlink';
        breadcrumb.href = 'index.html#events';
        breadcrumb.textContent = 'Zurück zu den Events';
        body.appendChild(breadcrumb);

        const category = document.createElement('div');
        category.className = 'event-detail-category';
        category.textContent = getEventCategoryLabel(event.event_category);
        body.appendChild(category);

        const title = document.createElement('h1');
        title.textContent = getEventTitle(event);
        body.appendChild(title);

        const descriptionText = event.description || event.public_description || event.short_description;
        if (descriptionText) {
            const description = document.createElement('p');
            description.className = 'event-detail-description';
            description.textContent = descriptionText;
            body.appendChild(description);
        }

        const facts = document.createElement('dl');
        facts.className = 'event-detail-facts';

        const addFact = (label, value) => {
            if (!value) {
                return;
            }

            const dt = document.createElement('dt');
            dt.textContent = label;
            const dd = document.createElement('dd');
            dd.textContent = value;
            facts.appendChild(dt);
            facts.appendChild(dd);
        };

        addFact('Datum', formatDate(event.starts_at || event.event_date));
        addFact('Uhrzeit', formatTime(event.starts_at));
        addFact('Ort', event.location);
        addFact('Treffpunkt', event.meeting_point);
        addFact('Kontaktperson', event.contact_person);
        addFact('Anmeldeschluss', formatShortDateTime(event.registration_deadline));
        addFact('Max. Teilnehmer', event.max_participants ? String(event.max_participants) : '');

        if (facts.children.length) {
            body.appendChild(facts);
        }

        const actions = document.createElement('div');
        actions.className = 'event-detail-actions';

        const registrationUrl = externalUrl(event.public_registration_url);
        const infoUrl = externalUrl(event.public_external_url);

        if (registrationUrl) {
            const link = createLink(registrationUrl, 'Anmeldung öffnen', 'btn event-detail-btn');
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            actions.appendChild(link);
        }

        if (infoUrl) {
            const link = createLink(infoUrl, 'Weitere Infos', 'btn btn-secondary event-detail-btn');
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            actions.appendChild(link);
        }

        if (actions.children.length) {
            body.appendChild(actions);
        }

        wrapper.appendChild(body);
        return wrapper;
    };

    const renderEventsSection = (events) => {
        if (!publicEventsSection || !publicEventsContent) {
            return;
        }

        publicEventsContent.innerHTML = '';

        const filtered = sortEvents(events).filter((event) => event && getEventTitle(event));
        if (!filtered.length) {
            publicEventsContent.appendChild(createEmptyState('Derzeit sind keine öffentlichen Veranstaltungen verfügbar.'));
        } else {
            filtered.forEach((event) => {
                publicEventsContent.appendChild(renderEventCard(event));
            });
        }

        publicEventsSection.hidden = false;

        if (dynamicSection) {
            dynamicSection.hidden = false;
            syncDynamicLayout();
        }
    };

    const renderDetailPage = (events) => {
        if (!eventDetailRoot || !eventDetailContent) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        eventDetailContent.innerHTML = '';

        if (!id) {
            eventDetailContent.appendChild(createEmptyState('Derzeit sind keine öffentlichen Veranstaltungen verfügbar.'));
            return;
        }

        const event = events.find((item) => String(item.id) === String(id));
        if (!event) {
            eventDetailContent.appendChild(createEmptyState('Derzeit sind keine öffentlichen Veranstaltungen verfügbar.'));
            return;
        }

        eventDetailContent.appendChild(renderEventDetail(event));
    };

    const loadEvents = async () => {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_events`, {
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

            const events = await response.json();
            if (!Array.isArray(events)) {
                throw new Error('Supabase RPC returned invalid data');
            }

            renderEventsSection(events);
            renderDetailPage(events);
        } catch (error) {
            console.warn('Could not load public events', error);

            renderEventsSection([]);
            renderDetailPage([]);
        }
    };

    loadEvents();
})();
