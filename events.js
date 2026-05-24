(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const section = document.getElementById('public-events');
    const content = document.getElementById('public-events-content');

    if (!section || !content) {
        return;
    }

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

    const formatEventDate = (value) => {
        if (!value) {
            return '';
        }

        const date = new Date(`${value}T00:00:00`);
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

    const sortEvents = (items) => items.slice().sort((left, right) => {
        const leftDate = String(left.event_date || '');
        const rightDate = String(right.event_date || '');

        if (leftDate !== rightDate) {
            return leftDate.localeCompare(rightDate);
        }

        return String(left.title || '').localeCompare(String(right.title || ''), 'de');
    });

    const createAction = (href, label, className) => {
        const link = document.createElement('a');
        link.className = className;
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        return link;
    };

    const renderEventCard = (event) => {
        const card = document.createElement('article');
        card.className = 'card public-event-card';

        const imageSrc = assetUrl(event.public_image_path);
        if (imageSrc) {
            const imageWrap = document.createElement('div');
            imageWrap.className = 'public-event-image-wrap';

            const image = document.createElement('img');
            image.className = 'public-event-image';
            image.src = imageSrc;
            image.alt = event.title || 'Event';
            image.loading = 'lazy';
            image.decoding = 'async';
            image.onerror = () => imageWrap.remove();

            imageWrap.appendChild(image);
            card.appendChild(imageWrap);
        }

        const body = document.createElement('div');
        body.className = 'public-event-body';

        const date = document.createElement('div');
        date.className = 'public-event-date';
        date.textContent = formatEventDate(event.event_date);
        body.appendChild(date);

        const title = document.createElement('h3');
        title.textContent = event.title;
        body.appendChild(title);

        if (event.location) {
            const location = document.createElement('div');
            location.className = 'public-event-location';
            location.textContent = event.location;
            body.appendChild(location);
        }

        if (event.public_description) {
            const description = document.createElement('p');
            description.className = 'public-event-description';
            description.textContent = event.public_description;
            body.appendChild(description);
        }

        const registrationUrl = externalUrl(event.public_registration_url);
        const infoUrl = externalUrl(event.public_external_url);

        if (registrationUrl || infoUrl) {
            const actions = document.createElement('div');
            actions.className = 'public-event-actions';

            if (registrationUrl) {
                actions.appendChild(createAction(registrationUrl, 'Anmeldung', 'btn'));
            }

            if (infoUrl) {
                actions.appendChild(createAction(infoUrl, 'Mehr Infos', 'btn btn-secondary'));
            }

            body.appendChild(actions);
        }

        card.appendChild(body);
        return card;
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
            if (!Array.isArray(events) || events.length === 0) {
                section.remove();
                return;
            }

            content.innerHTML = '';

            sortEvents(events).forEach((event) => {
                if (event.title) {
                    content.appendChild(renderEventCard(event));
                }
            });

            if (!content.children.length) {
                section.remove();
                return;
            }

            section.hidden = false;
        } catch (error) {
            console.warn('Could not load public events', error);
            section.remove();
        }
    };

    loadEvents();
})();
