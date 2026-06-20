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

    const getRegistrationStatusLabel = (event) => {
        const status = String(event?.registration_status || '').toLowerCase();

        if (!event?.registration_enabled || status === 'disabled') {
            return 'Anmeldung deaktiviert';
        }

        if (status === 'closed') {
            return 'Anmeldung geschlossen';
        }

        if (status === 'full') {
            return 'Voll';
        }

        if (status === 'waitlist') {
            return 'Warteliste';
        }

        if (status === 'open') {
            if (event?.max_participants && typeof event?.registered_count === 'number') {
                return `${Math.max(0, event.max_participants - event.registered_count)} Teams frei`;
            }

            return 'Anmeldung offen';
        }

        return '';
    };

    const canShowRegistrationForm = (event) => {
        const status = String(event?.registration_status || '').toLowerCase();

        return Boolean(event?.registration_enabled)
            && status !== 'disabled'
            && status !== 'closed'
            && !(status === 'full' && event?.allow_waitlist !== true);
    };

    const getRegistrationUnavailableMessage = (event) => {
        const status = String(event?.registration_status || '').toLowerCase();

        if (!event?.registration_enabled || status === 'disabled') {
            return 'Die Anmeldung ist für dieses Event nicht aktiviert.';
        }

        if (status === 'closed') {
            return 'Die Anmeldung für dieses Event ist geschlossen.';
        }

        if (status === 'full' && event?.allow_waitlist !== true) {
            return 'Dieses Event ist voll.';
        }

        return '';
    };

    const getRegistrationStatusClass = (event) => {
        const status = String(event?.registration_status || '').toLowerCase();

        if (status === 'open') {
            return 'is-open';
        }

        if (status === 'waitlist') {
            return 'is-waitlist';
        }

        if (status === 'full') {
            return 'is-full';
        }

        if (status === 'closed' || status === 'disabled') {
            return 'is-closed';
        }

        return '';
    };

    const submitPublicRegistration = async (eventId, values) => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_public_event_registration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                p_event_id: eventId,
                p_full_name: values.full_name,
                p_email: values.email,
                p_phone: values.phone || null,
                p_member_status: values.member_status,
                p_participant_count: values.participant_count,
                p_team_name: values.team_name || null,
                p_note: values.note || null
            })
        });

        if (!response.ok) {
            let message = 'Die Anmeldung konnte nicht gesendet werden.';

            try {
                const error = await response.json();
                const rawMessage = String(error?.message || '').toLowerCase();

                if (rawMessage.includes('event is full')) {
                    message = 'Dieses Event ist voll.';
                } else if (rawMessage.includes('deadline') || rawMessage.includes('closed')) {
                    message = 'Die Anmeldung für dieses Event ist geschlossen.';
                } else if (rawMessage.includes('disabled')) {
                    message = 'Die Registrierung ist für dieses Event deaktiviert.';
                } else if (error?.message) {
                    message = error.message;
                }
            } catch {
                message = `Supabase-Fehler (${response.status}).`;
            }

            throw new Error(message);
        }

        const data = await response.json();
        const registration = Array.isArray(data) ? data[0] : data;
        return registration?.registration_status || '';
    };

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

    const createRegistrationPanel = (event) => {
        const panel = document.createElement('section');
        panel.className = 'event-registration-panel';
        panel.setAttribute('aria-labelledby', 'event-registration-title');

        const title = document.createElement('h2');
        title.id = 'event-registration-title';
        title.textContent = 'Anmeldung';
        panel.appendChild(title);

        const statusLabel = getRegistrationStatusLabel(event);
        if (statusLabel) {
            const status = document.createElement('p');
            status.className = `event-registration-status ${getRegistrationStatusClass(event)}`.trim();
            status.textContent = statusLabel;
            panel.appendChild(status);
        }

        const unavailableMessage = getRegistrationUnavailableMessage(event);
        if (!canShowRegistrationForm(event)) {
            if (unavailableMessage) {
                const message = document.createElement('p');
                message.className = 'event-registration-message';
                message.textContent = unavailableMessage;
                panel.appendChild(message);
            }

            return panel;
        }

        const form = document.createElement('form');
        form.className = 'event-registration-form';
        form.noValidate = true;

        const fields = document.createElement('div');
        fields.className = 'event-registration-fields';

        const createField = ({ label, name, type = 'text', required = false, min = '', rows = 0, options = null }) => {
            const wrapper = document.createElement('label');
            wrapper.className = 'event-registration-field';

            const labelText = document.createElement('span');
            labelText.textContent = label;
            wrapper.appendChild(labelText);

            let input;
            if (options) {
                input = document.createElement('select');
                options.forEach((option) => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;
                    input.appendChild(optionElement);
                });
            } else if (rows > 0) {
                input = document.createElement('textarea');
                input.rows = rows;
            } else {
                input = document.createElement('input');
                input.type = type;
            }

            input.name = name;
            input.required = required;
            if (min) {
                input.min = min;
            }

            wrapper.appendChild(input);
            return wrapper;
        };

        fields.appendChild(createField({ label: 'Teamname (optional)', name: 'team_name' }));
        fields.appendChild(createField({ label: 'Name', name: 'full_name', required: true }));
        fields.appendChild(createField({ label: 'E-Mail', name: 'email', type: 'email', required: true }));
        fields.appendChild(createField({ label: 'Telefon (optional)', name: 'phone', type: 'tel' }));
        fields.appendChild(createField({
            label: 'Mitgliedsstatus',
            name: 'member_status',
            options: [
                { value: 'unknown', label: 'Keine Angabe' },
                { value: 'member', label: 'Mitglied' },
                { value: 'guest', label: 'Gast' }
            ]
        }));
        fields.appendChild(createField({ label: 'Teamgröße', name: 'participant_count', type: 'number', required: true, min: '1' }));
        fields.appendChild(createField({ label: 'Notiz (optional)', name: 'note', rows: 4 }));

        form.appendChild(fields);

        const participantInput = form.elements.participant_count;
        participantInput.value = '1';

        const feedback = document.createElement('p');
        feedback.className = 'event-registration-feedback';
        feedback.setAttribute('aria-live', 'polite');

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'btn btn-primary event-registration-submit';
        submitButton.textContent = 'Anmeldung senden';

        form.appendChild(submitButton);
        form.appendChild(feedback);

        form.addEventListener('submit', async (submitEvent) => {
            submitEvent.preventDefault();
            feedback.textContent = '';
            feedback.className = 'event-registration-feedback';

            const fullName = String(form.elements.full_name.value || '').trim();
            const teamName = String(form.elements.team_name.value || '').trim();
            const email = String(form.elements.email.value || '').trim();
            const phone = String(form.elements.phone.value || '').trim();
            const memberStatus = String(form.elements.member_status.value || 'unknown');
            const participantCount = Number.parseInt(form.elements.participant_count.value, 10);
            const note = String(form.elements.note.value || '').trim();

            if (!fullName) {
                feedback.textContent = 'Bitte gib deinen Namen ein.';
                feedback.classList.add('is-error');
                form.elements.full_name.focus();
                return;
            }

            if (!email || !form.elements.email.checkValidity()) {
                feedback.textContent = 'Bitte gib eine gültige E-Mail-Adresse ein.';
                feedback.classList.add('is-error');
                form.elements.email.focus();
                return;
            }

            if (!Number.isInteger(participantCount) || participantCount < 1) {
                feedback.textContent = 'Bitte gib eine Teamgröße ab 1 ein.';
                feedback.classList.add('is-error');
                form.elements.participant_count.focus();
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Wird gesendet...';

            try {
                const registrationStatus = await submitPublicRegistration(event.id, {
                    full_name: fullName,
                    team_name: teamName,
                    email,
                    phone,
                    member_status: memberStatus,
                    participant_count: participantCount,
                    note
                });

                feedback.classList.add('is-success');
                feedback.textContent = registrationStatus === 'waitlist'
                    ? 'Das Event ist voll. Du wurdest auf die Warteliste gesetzt.'
                    : 'Danke, deine Anmeldung wurde eingetragen.';
                form.reset();
                participantInput.value = '1';
            } catch (error) {
                feedback.classList.add('is-error');
                feedback.textContent = error?.message || 'Netzwerk- oder Supabase-Fehler. Bitte versuche es später erneut.';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Anmeldung senden';
            }
        });

        panel.appendChild(form);
        return panel;
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

        const imageSrc = assetUrl(event.event_image_url || event.public_image_url || event.public_image_path);
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

        const registrationLabel = getRegistrationStatusLabel(event);
        if (registrationLabel && event.registration_enabled) {
            const registrationBadge = document.createElement('div');
            registrationBadge.className = `public-event-registration-status ${getRegistrationStatusClass(event)}`.trim();
            registrationBadge.textContent = registrationLabel;
            body.appendChild(registrationBadge);
        }

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

        const imageSrc = assetUrl(event.event_image_url || event.public_image_url || event.public_image_path);
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

        const registrationLabel = getRegistrationStatusLabel(event);
        if (registrationLabel && event.registration_enabled) {
            const registrationBadge = document.createElement('div');
            registrationBadge.className = `event-detail-registration-status ${getRegistrationStatusClass(event)}`.trim();
            registrationBadge.textContent = registrationLabel;
            body.appendChild(registrationBadge);
        }

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
        addFact('Kontaktperson', event.contact_name || event.contact_person);
        addFact('Kontakt E-Mail', event.contact_email);
        addFact('Kontakt Telefon', event.contact_phone);
        addFact('Anmeldeschluss', formatShortDateTime(event.registration_deadline));
        addFact('Max. Teams', event.max_participants ? String(event.max_participants) : '');
        addFact('Teams', typeof event.registered_count === 'number' ? String(event.registered_count) : '');
        addFact('Warteliste', typeof event.waitlist_count === 'number' ? String(event.waitlist_count) : '');
        addFact('Anmeldestatus', registrationLabel);

        if (facts.children.length) {
            body.appendChild(facts);
        }

        const actions = document.createElement('div');
        actions.className = 'event-detail-actions';

        const registrationUrl = externalUrl(event.public_registration_url);
        const infoUrl = externalUrl(event.public_external_url);

        if (registrationUrl) {
            const link = createLink(registrationUrl, 'Anmeldung öffnen', 'btn btn-primary event-detail-btn');
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

        if (event.registration_enabled) {
            body.appendChild(createRegistrationPanel(event));
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
