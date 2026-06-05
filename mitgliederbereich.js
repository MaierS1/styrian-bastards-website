(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const state = {
        client: null,
        session: null,
        loading: false,
        memberAreaLoading: false,
        loadedUserId: null,
        memberContentLoading: false,
        loadedContentUserId: null,
    };

    const elements = {};

    function bindElements() {
        [
            'member-status',
            'member-auth-panel',
            'member-login-form',
            'member-logout-button',
            'member-email',
            'member-password',
            'member-message',
            'member-private-area',
            'member-display-email',
            'member-display-user-id',
            'member-profile-name',
            'member-profile-type',
            'member-profile-status',
            'member-profile-joined',
            'member-fee-status',
            'member-fee-list',
            'member-events-status',
            'member-events-list',
            'member-documents-status',
            'member-documents-list',
            'member-news-status',
            'member-news-list',
            'member-internal-events-status',
            'member-internal-events-list',
        ].forEach((id) => {
            elements[id] = document.getElementById(id);
        });
    }

    function setMessage(message, type = 'info') {
        if (!elements['member-message']) return;
        elements['member-message'].textContent = message || '';
        elements['member-message'].dataset.type = type;
        elements['member-message'].hidden = !message;
    }

    function setLoading(isLoading) {
        state.loading = isLoading;
        const submitButton = elements['member-login-form']?.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = isLoading;
            submitButton.textContent = isLoading ? 'Login laeuft...' : 'Einloggen';
        }
        if (elements['member-logout-button']) {
            elements['member-logout-button'].disabled = isLoading;
        }
    }

    function formatDate(value) {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('de-AT');
    }

    function formatMoney(value) {
        return `${Number(value || 0).toFixed(2)} EUR`;
    }

    function getStatusLabel(status) {
        const labels = {
            open: 'offen',
            reminded: 'erinnert',
            paid: 'bezahlt',
            waived: 'erlassen',
            cancelled: 'storniert',
        };
        return labels[status] || status || '-';
    }

    function getMemberTypeLabel(memberType) {
        const labels = {
            vollmitglied: 'Vollmitglied',
            foerdermitglied: 'Foerdermitglied',
            probejahr: 'Probejahr',
            ehrenmitglied: 'Ehrenmitglied',
        };
        return labels[memberType] || memberType || '-';
    }

    function clearList(listElement) {
        if (!listElement) return;
        while (listElement.firstChild) {
            listElement.removeChild(listElement.firstChild);
        }
    }

    function clearContentGrid(gridElement) {
        if (!gridElement) return;
        while (gridElement.firstChild) {
            gridElement.removeChild(gridElement.firstChild);
        }
    }

    function appendListItem(listElement, text) {
        if (!listElement) return;
        const item = document.createElement('li');
        item.textContent = text;
        listElement.appendChild(item);
    }

    function normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getText(value, fallback = '-') {
        const text = String(value || '').trim();
        return text || fallback;
    }

    function createCard(title, meta, text) {
        const card = document.createElement('article');
        card.className = 'member-content-card';

        const heading = document.createElement('h4');
        heading.textContent = getText(title, 'Eintrag');
        card.appendChild(heading);

        if (meta) {
            const metaElement = document.createElement('p');
            metaElement.className = 'member-content-meta';
            metaElement.textContent = meta;
            card.appendChild(metaElement);
        }

        if (text) {
            const textElement = document.createElement('p');
            textElement.className = 'member-content-text';
            textElement.textContent = text;
            card.appendChild(textElement);
        }

        return card;
    }

    function createContentLink(href, label) {
        const link = document.createElement('a');
        link.className = 'member-content-link';
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = label;
        return link;
    }

    function renderMemberAreaLoading() {
        elements['member-profile-name'].textContent = 'Mitgliedsdaten werden geladen...';
        elements['member-profile-type'].textContent = 'Mitgliedsdaten werden geladen...';
        elements['member-profile-status'].textContent = 'Mitgliedsdaten werden geladen...';
        elements['member-profile-joined'].textContent = 'Mitgliedsdaten werden geladen...';
        elements['member-fee-status'].textContent = 'Beitragsstatus wird geladen...';
        elements['member-events-status'].textContent = 'Interne Hinweise werden geladen...';
        clearList(elements['member-fee-list']);
        clearList(elements['member-events-list']);
        elements['member-fee-list'].hidden = true;
        elements['member-events-list'].hidden = true;
    }

    function renderMemberContentLoading() {
        elements['member-documents-status'].textContent = 'Dokumente werden geladen...';
        elements['member-news-status'].textContent = 'Interne News werden geladen...';
        elements['member-internal-events-status'].textContent = 'Interne Events werden geladen...';
        clearContentGrid(elements['member-documents-list']);
        clearContentGrid(elements['member-news-list']);
        clearContentGrid(elements['member-internal-events-list']);
        elements['member-documents-list'].hidden = true;
        elements['member-news-list'].hidden = true;
        elements['member-internal-events-list'].hidden = true;
    }

    function renderMemberContentError(error) {
        const message = error?.message || 'Mitgliederbereich-Inhalte konnten nicht geladen werden.';
        elements['member-documents-status'].textContent = message;
        elements['member-news-status'].textContent = message;
        elements['member-internal-events-status'].textContent = message;
        clearContentGrid(elements['member-documents-list']);
        clearContentGrid(elements['member-news-list']);
        clearContentGrid(elements['member-internal-events-list']);
        elements['member-documents-list'].hidden = true;
        elements['member-news-list'].hidden = true;
        elements['member-internal-events-list'].hidden = true;
        setMessage(message, 'error');
    }

    function renderMemberDocuments(documents) {
        const list = elements['member-documents-list'];
        clearContentGrid(list);

        if (documents.length === 0) {
            elements['member-documents-status'].textContent = 'Derzeit sind keine Dokumente fuer Mitglieder hinterlegt.';
            list.hidden = true;
            return;
        }

        elements['member-documents-status'].textContent = `${documents.length} Dokument${documents.length === 1 ? '' : 'e'} verfuegbar.`;
        documents.forEach((documentItem) => {
            const meta = [documentItem.category, documentItem.sort_order !== undefined ? `Sortierung ${documentItem.sort_order}` : '']
                .filter(Boolean)
                .join(' - ');
            const card = createCard(documentItem.title, meta, documentItem.description);
            if (documentItem.file_url) {
                card.appendChild(createContentLink(documentItem.file_url, 'Dokument oeffnen'));
            }
            list.appendChild(card);
        });
        list.hidden = false;
    }

    function renderMemberNews(newsItems) {
        const list = elements['member-news-list'];
        clearContentGrid(list);

        if (newsItems.length === 0) {
            elements['member-news-status'].textContent = 'Derzeit sind keine internen News hinterlegt.';
            list.hidden = true;
            return;
        }

        elements['member-news-status'].textContent = `${newsItems.length} interne News verfuegbar.`;
        newsItems.forEach((newsItem) => {
            const meta = [formatDate(newsItem.publication_date || newsItem.published_at), newsItem.category]
                .filter((item) => item && item !== '-')
                .join(' - ');
            const card = createCard(newsItem.title, meta, newsItem.summary || newsItem.content);
            if (newsItem.external_url) {
                card.appendChild(createContentLink(newsItem.external_url, 'Mehr lesen'));
            }
            list.appendChild(card);
        });
        list.hidden = false;
    }

    function renderMemberEvents(events) {
        const list = elements['member-internal-events-list'];
        clearContentGrid(list);

        if (events.length === 0) {
            elements['member-internal-events-status'].textContent = 'Derzeit sind keine internen Events hinterlegt.';
            list.hidden = true;
            return;
        }

        elements['member-internal-events-status'].textContent = `${events.length} interne Event${events.length === 1 ? '' : 's'} verfuegbar.`;
        events.forEach((eventItem) => {
            const meta = [formatDate(eventItem.starts_at || eventItem.event_date), eventItem.location, eventItem.event_category]
                .filter((item) => item && item !== '-')
                .join(' - ');
            const card = createCard(eventItem.title, meta, eventItem.short_description || eventItem.description);
            list.appendChild(card);
        });
        list.hidden = false;
    }

    function renderMemberAreaSummary(summary) {
        const profile = summary?.profile || {};
        const openFees = normalizeArray(summary?.open_fees);
        const paidFees = normalizeArray(summary?.paid_fees);
        const nextEvents = normalizeArray(summary?.next_events);
        const fullName = profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ');

        elements['member-profile-name'].textContent = fullName || profile.email || 'Kein Profil gefunden.';
        elements['member-profile-type'].textContent = getMemberTypeLabel(profile.member_type);
        elements['member-profile-status'].textContent = profile.status || '-';
        elements['member-profile-joined'].textContent = formatDate(profile.joined_at);

        clearList(elements['member-fee-list']);
        if (openFees.length === 0 && paidFees.length === 0) {
            elements['member-fee-status'].textContent = 'Aktuell sind keine Beitragsdaten fuer dein Profil vorhanden.';
            elements['member-fee-list'].hidden = true;
        } else {
            elements['member-fee-status'].textContent = `${openFees.length} offene und ${paidFees.length} bezahlte Beitraege.`;
            [...openFees, ...paidFees].forEach((fee) => {
                const title = fee.period_title ? ` - ${fee.period_title}` : '';
                appendListItem(
                    elements['member-fee-list'],
                    `${fee.year || '-'}${title}: ${formatMoney(fee.amount)} - ${getStatusLabel(fee.status)} - faellig: ${formatDate(fee.due_date)} - bezahlt: ${formatDate(fee.paid_at)}`
                );
            });
            elements['member-fee-list'].hidden = false;
        }

        clearList(elements['member-events-list']);
        if (nextEvents.length === 0) {
            elements['member-events-status'].textContent = 'Derzeit sind keine kommenden oeffentlichen Termine hinterlegt.';
            elements['member-events-list'].hidden = true;
        } else {
            elements['member-events-status'].textContent = 'Naechste Termine:';
            nextEvents.forEach((event) => {
                appendListItem(
                    elements['member-events-list'],
                    `${formatDate(event.event_date || event.starts_at)} - ${event.title || 'Termin'}${event.location ? ` - ${event.location}` : ''}`
                );
            });
            elements['member-events-list'].hidden = false;
        }
    }

    async function loadMemberAreaSummary(userId) {
        if (!state.client || state.memberAreaLoading) return;

        state.memberAreaLoading = true;
        renderMemberAreaLoading();

        try {
            const { data, error } = await state.client.rpc('get_my_member_area_summary');
            if (error) throw error;
            const summary = Array.isArray(data) ? data[0] : data;
            renderMemberAreaSummary(summary || {});
            state.loadedUserId = userId;
        } catch (error) {
            state.loadedUserId = null;
            elements['member-profile-name'].textContent = 'Mitgliedsdaten konnten nicht geladen werden.';
            elements['member-profile-type'].textContent = '-';
            elements['member-profile-status'].textContent = '-';
            elements['member-profile-joined'].textContent = '-';
            elements['member-fee-status'].textContent = 'Beitragsstatus konnte nicht geladen werden.';
            elements['member-events-status'].textContent = 'Interne Hinweise konnten nicht geladen werden.';
            clearList(elements['member-fee-list']);
            clearList(elements['member-events-list']);
            elements['member-fee-list'].hidden = true;
            elements['member-events-list'].hidden = true;
            setMessage(error.message || 'Mitgliedsdaten konnten nicht geladen werden.', 'error');
        } finally {
            state.memberAreaLoading = false;
        }
    }

    async function loadMemberContent(userId) {
        if (!state.client || state.memberContentLoading) return;

        state.memberContentLoading = true;
        renderMemberContentLoading();

        try {
            const [documentsResult, newsResult, eventsResult] = await Promise.all([
                state.client.rpc('get_member_documents'),
                state.client.rpc('get_member_news'),
                state.client.rpc('get_member_events'),
            ]);

            const errors = [documentsResult.error, newsResult.error, eventsResult.error].filter(Boolean);
            if (errors.length > 0) throw errors[0];

            renderMemberDocuments(normalizeArray(documentsResult.data));
            renderMemberNews(normalizeArray(newsResult.data));
            renderMemberEvents(normalizeArray(eventsResult.data));
            state.loadedContentUserId = userId;
        } catch (error) {
            state.loadedContentUserId = null;
            renderMemberContentError(error);
        } finally {
            state.memberContentLoading = false;
        }
    }

    function renderLoggedOut() {
        elements['member-status'].textContent = 'Nicht eingeloggt';
        elements['member-login-form'].hidden = false;
        elements['member-logout-button'].hidden = true;
        elements['member-private-area'].hidden = true;
        elements['member-auth-panel'].classList.remove('is-authenticated');
        state.loadedContentUserId = null;
        renderMemberContentLoading();
        setMessage('Bitte mit deiner Vereins-E-Mail und deinem Passwort einloggen.', 'info');
    }

    function renderLoggedIn(session) {
        const user = session?.user;
        const email = user?.email || 'Keine E-Mail vorhanden';
        const userId = user?.id || '-';

        elements['member-status'].textContent = 'Eingeloggt';
        elements['member-login-form'].hidden = true;
        elements['member-logout-button'].hidden = false;
        elements['member-private-area'].hidden = false;
        elements['member-auth-panel'].classList.add('is-authenticated');

        elements['member-display-email'].textContent = email;
        elements['member-display-user-id'].textContent = userId;

        if (state.loadedUserId !== userId && !state.memberAreaLoading) {
            loadMemberAreaSummary(userId);
        }

        if (state.loadedContentUserId !== userId && !state.memberContentLoading) {
            loadMemberContent(userId);
        }

        setMessage('Login erfolgreich. Mitgliedsdaten werden sicher geladen.', 'success');
    }

    function render() {
        if (state.session) {
            renderLoggedIn(state.session);
            return;
        }
        renderLoggedOut();
    }

    async function loadSession() {
        if (!state.client) return;
        setLoading(true);
        try {
            const { data, error } = await state.client.auth.getSession();
            if (error) throw error;
            state.session = data?.session || null;
            if (!state.session) {
                state.loadedUserId = null;
                state.loadedContentUserId = null;
            }
            render();
        } catch (error) {
            state.session = null;
            state.loadedUserId = null;
            state.loadedContentUserId = null;
            renderLoggedOut();
            setMessage(error.message || 'Session konnte nicht geladen werden.', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        if (!state.client || state.loading) return;

        const email = elements['member-email'].value.trim();
        const password = elements['member-password'].value;

        if (!email || !password) {
            setMessage('Bitte E-Mail und Passwort eingeben.', 'error');
            return;
        }

        setLoading(true);
        setMessage('', 'info');

        try {
            const { data, error } = await state.client.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            state.session = data?.session || null;
            state.loadedUserId = null;
            state.loadedContentUserId = null;
            render();
        } catch (error) {
            state.session = null;
            state.loadedUserId = null;
            state.loadedContentUserId = null;
            renderLoggedOut();
            setMessage(error.message || 'Login fehlgeschlagen.', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        if (!state.client || state.loading) return;
        setLoading(true);
        try {
            const { error } = await state.client.auth.signOut();
            if (error) throw error;
            state.session = null;
            state.loadedUserId = null;
            state.loadedContentUserId = null;
            renderLoggedOut();
            setMessage('Logout erfolgreich.', 'success');
        } catch (error) {
            setMessage(error.message || 'Logout fehlgeschlagen.', 'error');
        } finally {
            setLoading(false);
        }
    }

    function init() {
        bindElements();

        if (!window.supabase?.createClient) {
            renderLoggedOut();
            setMessage('Supabase Auth konnte nicht geladen werden.', 'error');
            return;
        }

        state.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        elements['member-login-form'].addEventListener('submit', handleLogin);
        elements['member-logout-button'].addEventListener('click', handleLogout);

        state.client.auth.onAuthStateChange((_event, session) => {
            state.session = session;
            if (!session) {
                state.loadedUserId = null;
                state.loadedContentUserId = null;
            }
            render();
        });

        loadSession();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
