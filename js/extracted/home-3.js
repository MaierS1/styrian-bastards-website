// Extracted from index.html inline script 3
(function () {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';
    const statNodes = document.querySelectorAll('[data-home-stat]');

    if (!statNodes.length) {
        return;
    }

    const formatCount = (value) => {
        const count = Number(value);
        return Number.isFinite(count) && count >= 0 ? new Intl.NumberFormat('de-AT').format(count) : null;
    };

    const updateStat = (key, value) => {
        const formatted = formatCount(value);

        if (formatted === null) {
            return;
        }

        statNodes.forEach((node) => {
            if (node.dataset.homeStat === key) {
                node.textContent = formatted;
            }
        });
    };

    const loadHomeStats = async () => {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_home_stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`Supabase RPC failed with status ${response.status}`);
            }

            const result = await response.json();
            const stats = Array.isArray(result) ? result[0] : result;

            if (!stats || typeof stats !== 'object') {
                return;
            }

            updateStat('active_members', stats.active_members);
            updateStat('upcoming_events', stats.upcoming_events);
            updateStat('public_sponsors', stats.public_sponsors);
            updateStat('public_shop_items', stats.public_shop_items);
        } catch (error) {
            console.warn('Could not load public home stats', error);
        }
    };

    loadHomeStats();
})();
