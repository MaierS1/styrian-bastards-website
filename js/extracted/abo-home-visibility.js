(() => {
    const section = document.getElementById('saisonabo');
    if (!section) return;

    const V2_URL = 'https://yktioliukcrrccrfwxad.supabase.co';
    const V2_KEY = window.STB_V2_SHOP_PUBLISHABLE_KEY || '';

    // Fail closed: the homepage teaser stays hidden unless V2 explicitly
    // returns a public campaign that is marked homepage_visible.
    if (!V2_KEY) return;

    fetch(`${V2_URL}/rest/v1/rpc/get_public_abo_campaign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': V2_KEY,
            'Authorization': `Bearer ${V2_KEY}`
        },
        body: '{}'
    })
        .then((response) => {
            if (!response.ok) throw new Error('Abo visibility request failed');
            return response.json();
        })
        .then((rows) => {
            const campaign = Array.isArray(rows) ? rows[0] : null;
            if (campaign?.homepage_visible === true) {
                section.hidden = false;
            }
        })
        .catch(() => {
            section.hidden = true;
        });
})();