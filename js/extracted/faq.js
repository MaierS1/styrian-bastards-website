// Extracted from faq.html inline script 1
fetch('/navbar.html').then((response) => response.text()).then((html) => {
    document.getElementById('navbar').innerHTML = html;
});
fetch('/footer.html').then((response) => response.text()).then((html) => {
    document.getElementById('footer').innerHTML = html;
});
