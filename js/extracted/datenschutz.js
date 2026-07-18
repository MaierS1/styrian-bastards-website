// Extracted from datenschutz.html inline script 1
(function ensureSharedSubpageHeroStyles() {
    const href = '/css/subpage-hero.css?v=20260718-10';
    if (!document.querySelector('link[data-subpage-hero]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.subpageHero = 'true';
        document.head.appendChild(link);
    }
})();

fetch('/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
    });

fetch('/footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer').innerHTML = data;
    });
