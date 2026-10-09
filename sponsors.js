(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';
    const V2_URL = 'https://yktioliukcrrccrfwxad.supabase.co';
    const V2_SPONSORS_ENABLED = window.STB_V2_SPONSORS_ENABLED === true;
    const SPONSOR_LEVELS = ['main', 'premium', 'partner', 'supporter'];
    const SPONSOR_LEVEL_LABELS = {
        main: 'Hauptsponsor',
        premium: 'Sponsor',
        partner: 'Partner',
        supporter: 'Unterst\u00fctzer'
    };
    const EMPTY_MESSAGE = 'Derzeit sind keine Sponsoren ver\u00f6ffentlicht.';

    const section = document.getElementById('sponsors');
    const content = document.getElementById('sponsors-content');

    if (!section || !content) {
        return;
    }

    const logoUrl = (logoPath, source = 'v1') => {
        if (!logoPath) {
            return '';
        }

        if (/^https?:\/\//i.test(logoPath) || /^data:/i.test(logoPath)) {
            return logoPath;
        }

        return `${source === 'v2' ? V2_URL : SUPABASE_URL}/storage/v1/object/public/public-assets/${encodeURI(logoPath)}`;
    };

    const websiteUrl = (website) => {
        if (!website) {
            return '';
        }

        if (/^https?:\/\//i.test(website)) {
            return website;
        }

        return `https://${website}`;
    };

    const sortSponsors = (items) => items.slice().sort((left, right) => {
        const leftOrder = Number.isFinite(left.public_sort_order) ? left.public_sort_order : Number(left.public_sort_order || 0);
        const rightOrder = Number.isFinite(right.public_sort_order) ? right.public_sort_order : Number(right.public_sort_order || 0);

        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }

        return String(left.name || '').localeCompare(String(right.name || ''), 'de');
    });

    const renderEmptyState = () => {
        content.innerHTML = '';
        const emptyState = document.createElement('p');
        emptyState.className = 'sponsor-empty-state';
        emptyState.textContent = EMPTY_MESSAGE;
        content.appendChild(emptyState);
        section.hidden = false;
    };

    const renderSponsorCard = (sponsor) => {
        const card = document.createElement('article');
        card.className = 'card sponsor-card';

        const sponsorLink = websiteUrl(sponsor.website);
        const wrapper = sponsorLink ? document.createElement('a') : document.createElement('div');
        if (sponsorLink) {
            wrapper.href = sponsorLink;
            wrapper.target = '_blank';
            wrapper.rel = 'noopener noreferrer';
        }
        wrapper.className = sponsorLink ? '' : 'sponsor-link';

        const logoWrap = document.createElement('div');
        logoWrap.className = 'sponsor-logo-wrap';

        const logoSrc = logoUrl(sponsor.logo_path, sponsor._source);
        if (logoSrc) {
            const img = document.createElement('img');
            img.className = 'sponsor-logo';
            img.src = logoSrc;
            img.alt = sponsor.logo_alt || sponsor.name || 'Sponsor';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onerror = () => {
                img.remove();
                const fallback = document.createElement('div');
                fallback.className = 'sponsor-name';
                fallback.textContent = sponsor.name || 'Sponsor';
                logoWrap.appendChild(fallback);
            };
            logoWrap.appendChild(img);
        } else {
            const fallback = document.createElement('div');
            fallback.className = 'sponsor-name';
            fallback.textContent = sponsor.name || 'Sponsor';
            logoWrap.appendChild(fallback);
        }

        const levelBadge = document.createElement('div');
        levelBadge.className = 'sponsor-level-badge';
        levelBadge.textContent = SPONSOR_LEVEL_LABELS[sponsor.sponsor_level] || 'Sponsor';

        const name = document.createElement('div');
        name.className = 'sponsor-name';
        name.textContent = sponsor.name || 'Sponsor';

        wrapper.appendChild(logoWrap);
        wrapper.appendChild(levelBadge);
        wrapper.appendChild(name);

        if (sponsor.public_description) {
            const description = document.createElement('div');
            description.className = 'sponsor-description';
            description.textContent = sponsor.public_description;
            wrapper.appendChild(description);
        }

        if (sponsorLink) {
            const websiteLabel = document.createElement('div');
            websiteLabel.className = 'sponsor-website-label';
            websiteLabel.textContent = 'Website \u00f6ffnen';
            wrapper.appendChild(websiteLabel);
        }

        card.appendChild(wrapper);
        return card;
    };

    const renderLevel = (level, sponsors) => {
        if (!sponsors.length) {
            return null;
        }

        const levelSection = document.createElement('div');
        levelSection.className = 'sponsor-level';

        const heading = document.createElement('h3');
        heading.textContent = SPONSOR_LEVEL_LABELS[level] || level;
        levelSection.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'sponsors-grid';

        sortSponsors(sponsors).forEach((sponsor) => {
            grid.appendChild(renderSponsorCard(sponsor));
        });

        levelSection.appendChild(grid);
        return levelSection;
    };

    const fetchV1Sponsors = async () => {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_public_sponsors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: '{}'
        });
        if (!response.ok) throw new Error(`V1 sponsors HTTP ${response.status}`);
        const items = await response.json();
        if (!Array.isArray(items)) throw new Error('V1 sponsors response is not an array');
        return items.map((item) => ({ ...item, _source: 'v1' }));
    };

    const fetchV2Sponsors = async () => {
        const key = window.STB_V2_SHOP_PUBLISHABLE_KEY;
        if (!V2_SPONSORS_ENABLED || typeof key !== 'string' || !key.trim()) return [];
        const response = await fetch(`${V2_URL}/rest/v1/rpc/get_public_sponsors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'apikey': key },
            body: '{}'
        });
        if (!response.ok) throw new Error(`V2 sponsors HTTP ${response.status}`);
        const items = await response.json();
        if (!Array.isArray(items)) throw new Error('V2 sponsors response is not an array');
        return items.map((item) => ({
            id: item.id,
            name: item.public_name,
            public_description: item.public_description,
            website: item.public_website,
            logo_path: item.public_logo_path,
            public_sort_order: item.public_sort_order,
            sponsor_level: item.public_sponsorship_level,
            _source: 'v2'
        }));
    };

    const loadSponsors = async () => {
        const results = await Promise.allSettled([
            fetchV1Sponsors(),
            ...(V2_SPONSORS_ENABLED ? [fetchV2Sponsors()] : [])
        ]);
        results.forEach((result, index) => {
            if (result.status === 'rejected') console.error(`Could not load public sponsors from V${index + 1}`, result.reason);
        });
        const v1Items = results[0].status === 'fulfilled' ? results[0].value : [];
        const v2Items = V2_SPONSORS_ENABLED && results[1]?.status === 'fulfilled' ? results[1].value : [];
        // V2 takes precedence for matching public names, without exposing internal sponsor data.
        const unique = new Map();
        for (const item of [...v1Items, ...v2Items]) {
            const name = String(item.name || '').trim().toLocaleLowerCase('de');
            const website = String(item.website || '').trim().toLocaleLowerCase('de').replace(/^https?:\/\//, '').replace(/\/$/, '');
            const key = website ? `website:${website}` : name ? `name:${name}` : `${item._source}:${item.id}`;
            unique.set(key, item);
        }
        const sponsors = [...unique.values()];
        if (!sponsors.length) {
            renderEmptyState();
            return;
        }
        const groupedSponsors = new Map(SPONSOR_LEVELS.map((level) => [level, []]));
        sponsors.forEach((sponsor) => {
            const level = SPONSOR_LEVELS.includes(sponsor.sponsor_level) ? sponsor.sponsor_level : 'supporter';
            groupedSponsors.get(level).push({ ...sponsor, sponsor_level: level });
        });
        content.innerHTML = '';
        let renderedCount = 0;
        SPONSOR_LEVELS.forEach((level) => {
            const levelSponsors = groupedSponsors.get(level) || [];
            const renderedLevel = renderLevel(level, levelSponsors);
            if (renderedLevel) {
                content.appendChild(renderedLevel);
                renderedCount += levelSponsors.length;
            }
        });
        if (!renderedCount) renderEmptyState();
        else section.hidden = false;
    };

    loadSponsors();
})();
