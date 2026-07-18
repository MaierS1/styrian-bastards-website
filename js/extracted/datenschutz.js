// Load shared navigation and footer.
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

// This page has legacy CSS with competing !important hero rules.
// Apply the final hero background directly to the element so it cannot be overridden.
const hero = document.querySelector('body > section.hero');
if (hero) {
    hero.style.setProperty(
        'background',
        'linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.78)), url("/hero.jpg?v=20260718-10") center center / cover no-repeat',
        'important'
    );
    hero.style.setProperty('background-color', 'transparent', 'important');
    hero.style.setProperty('min-height', 'clamp(300px, 34vw, 460px)', 'important');
}
