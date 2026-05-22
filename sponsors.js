(() => {
    const SUPABASE_URL = 'https://ekaxdyysefmypkainhij.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYXhkeXlzZWZteXBrYWluaGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjUyNzEsImV4cCI6MjA5Mjk0MTI3MX0.7o4jUIW5gsxvFWiqFHHjoHg87GVm4H_1UW9ftll6VmU';
    const SPONSOR_LEVELS = ['main', 'premium', 'partner', 'supporter'];
    const SPONSOR_LEVEL_LABELS = {
        main: 'Hauptsponsoren',
        premium: 'Premium',
        partner: 'Partner',
        supporter: 'Unterstützer'
    };

    const section = document.getElementById('sponsors');
    const content = document.getElementById('sponsors-content');

    if (!section || !content) {
        return;
    }

    const logoUrl = (logoPath) => {
        if (!logoPath) {
            return '';
        }

        if (/^https?:\/\//i.test(logoPath) || /^data:/i.test(logoPath)) {
            return logoPath;
        }

        return `${SUPABASE_URL}/storage/v1/object/public/public-assets/${encodeURI(logoPath)}`;
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

    const sponsorLevelRank = (level) => {
        const index = SPONSOR_LEVELS.indexOf(level);
        return index === -1 ? SPONSOR_LEVELS.length : index;
    };

    const sortSponsors = (items) => items.slice().sort((left, right) => {
        const leftOrder = Number.isFinite(left.public_sort_order) ? left.public_sort_order : Number(left.public_sort_order || 0);
        const rightOrder = Number.isFinite(right.public_sort_order) ? right.public_sort_order : Number(right.public_sort_order || 0);

        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }

        return String(left.name || '').localeCompare(String(right.name || ''), 'de');
    });

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

        const logoSrc = logoUrl(sponsor.logo_path);
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

        const name = document.createElement('div');
        name.className = 'sponsor-name';
        name.textContent = sponsor.name || 'Sponsor';

        wrapper.appendChild(logoWrap);
        wrapper.appendChild(name);

        if (sponsor.public_description) {
            const description = document.createElement('div');
            description.className = 'sponsor-description';
            description.textContent = sponsor.public_description;
            wrapper.appendChild(description);
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

    const loadSponsors = async () => {
        try {
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

            if (!response.ok) {
                throw new Error(`Supabase RPC failed with status ${response.status}`);
            }

            const sponsors = await response.json();
            if (!Array.isArray(sponsors) || sponsors.length === 0) {
                section.remove();
                return;
            }

            const groupedSponsors = new Map(SPONSOR_LEVELS.map((level) => [level, []]));
            sponsors.forEach((sponsor) => {
                const level = SPONSOR_LEVELS.includes(sponsor.sponsor_level) ? sponsor.sponsor_level : 'supporter';
                groupedSponsors.get(level).push(sponsor);
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

            if (renderedCount === 0) {
                section.remove();
                return;
            }

            section.hidden = false;
        } catch (error) {
            console.error('Could not load public sponsors', error);
            section.remove();
        }
    };

    loadSponsors();
})();
