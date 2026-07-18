# Geschütztes Hero-System

## Zweck

Alle öffentlichen Unterseiten verwenden dasselbe Hintergrundbild `/hero.jpg` und dieselbe zentrale Gestaltung aus `/css/subpage-hero.css`.

## Verbindliche Regeln

1. Neue öffentliche Unterseiten verwenden für ihren Hero die Klasse `sb-page-hero`.
2. Das Hero-Hintergrundbild wird ausschließlich in `/css/subpage-hero.css` definiert.
3. Seitenspezifische CSS-Dateien dürfen für Hero-Bereiche keine eigenen `background`, `background-image`, `::before`- oder `::after`-Regeln anlegen.
4. Seitenspezifische CSS-Dateien dürfen die zentralen Hero-Layer nicht mit `display: none`, `content: none` oder `background: none` deaktivieren.
5. Änderungen an `/hero.jpg` oder am Hero-Layout erfolgen nur zentral.
6. Die Startseite ist von diesem Unterseiten-System ausgenommen und darf ihr eigenes Hero-Layout behalten.
7. Die Content-Security-Policy muss lokale Stylesheets zulassen. `style-src-attr 'unsafe-inline'` bleibt derzeit als Kompatibilitätsregel für bestehende Seiten erhalten.

## Standard-Markup

```html
<section class="sb-page-hero">
    <div class="hero-content">
        <div class="textbox">
            <div class="subtitle">Styrian Bastards</div>
            <h1>Seitentitel</h1>
        </div>
    </div>
</section>
```

## Rückwärtskompatibilität

Bis alle bestehenden Seiten vollständig auf `sb-page-hero` umgestellt sind, unterstützt die zentrale Datei zusätzlich:

- direkte `body > section.hero`-Elemente,
- bestehende `main`-Hero-Klassen mit `-hero` im Klassennamen.

Dadurch bleibt das Hintergrundbild auch bei älteren Unterseiten erhalten.

## Prüfschritt vor jedem Deployment

- Unterseite öffnen.
- Hero-Element in den Entwicklertools markieren.
- `background-image` muss auf `/hero.jpg` zeigen.
- Keine seitenspezifische Regel darf die zentrale Regel überschreiben.
