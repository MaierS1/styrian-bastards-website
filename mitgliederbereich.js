(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';

    const state = {
        client: null,
        session: null,
        loading: false,
        memberAreaLoading: false,
        loadedUserId: null,
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

    function appendListItem(listElement, text) {
        if (!listElement) return;
        const item = document.createElement('li');
        item.textContent = text;
        listElement.appendChild(item);
    }

    function normalizeArray(value) {
        return Array.isArray(value) ? value : [];
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

    function renderLoggedOut() {
        elements['member-status'].textContent = 'Nicht eingeloggt';
        elements['member-login-form'].hidden = false;
        elements['member-logout-button'].hidden = true;
        elements['member-private-area'].hidden = true;
        elements['member-auth-panel'].classList.remove('is-authenticated');
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
            if (!state.session) state.loadedUserId = null;
            render();
        } catch (error) {
            state.session = null;
            state.loadedUserId = null;
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
            render();
        } catch (error) {
            state.session = null;
            state.loadedUserId = null;
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
            if (!session) state.loadedUserId = null;
            render();
        });

        loadSession();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
