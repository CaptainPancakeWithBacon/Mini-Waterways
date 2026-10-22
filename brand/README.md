# Waterways: merk

Het merk is een set contourringen met afwisselend een opening links en rechts: een kanaal dat via sluizen naar het midden kronkelt, waar de stip de boot is. De ring verwijst ook naar de aftelklok van een quay.

## Kleuren

| Naam | Hex | RGB | Gebruik |
|---|---|---|---|
| Inkt | `#243b4a` | 36 59 74 | ringen, tekst, donkere vlakken |
| Water | `#4f95bd` | 79 149 189 | de stip op licht, het kanaal in het spel |
| Papier | `#f4efe3` | 244 239 227 | achtergrond, ringen op donker |
| Water licht | `#a8d0e6` | 168 208 230 | de stip op donker |

Contrast: inkt op papier 10,2:1, water licht op inkt 7,1:1. Water op papier haalt maar 2,9:1, dus de stip is een accent en nooit drager van informatie of tekst. In één kleur (zwart, wit of inkt) werkt het merk ook, want de stip staat los van de ringen. CMYK en Pantone zijn niet bepaald: het merk is voor schermen gemaakt.

## Bestanden

| Bestand | Waarvoor |
|---|---|
| `mark.svg` | hoofdmerk op licht |
| `mark-reversed.svg` | hoofdmerk op donker (dunner getekend, want wit oogt zwaarder) |
| `mark-small.svg`, `mark-small-reversed.svg` | kleine maat, 16 tot 32 px: twee dikkere ringen |
| `one-colour/` | zwart, wit en inkt in één kleur |
| `logo-horizontal.svg`, `logo-horizontal-reversed.svg` | merk met woordmerk |
| `readme-header.svg`, `readme-header-dark.svg` | kop voor de README |
| `icons/` | bronnen van favicon en app-icoon; de PNG's en `favicon.ico` staan in `public/` |

`icons/favicon-16.svg` is een extra eenvoudige tekening (één ring en een stip) die alleen voor de 16 px-ingang van `favicon.ico` dient; bij 16 px lopen drie ringen dicht.

## Gebruik

- Ruimte rondom: minstens een kwart van de breedte van het merk.
- Minimale maat: hoofdmerk 32 px breed, kleine maat 16 px, merk met woordmerk 24 px hoog.
- Niet doen: de ringen opnieuw kleuren, de openingen laten uitlijnen, een gradient of schaduw toevoegen, het merk draaien of uitrekken, de stip weglaten op groot formaat.

## Lettertype en juridisch

Het woordmerk is Inter SemiBold, omgezet naar paden (Inter staat onder de SIL Open Font Licence). Het is dus geen eigen lettertekening. De bestanden bevatten geen live tekst.

Dit is geen merkonderzoek: de naam "Waterways" en het merk zijn niet gecontroleerd op bestaande merken. Doe dat voor een publieke release, en gebruik geen "Mini" in een publieke titel.
