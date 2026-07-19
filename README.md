# Aden Chronicles — 2D

Naršyklėje veikiantis 2D vaidmenų žaidimas, įkvėptas **Lineage 2: Chronicle 6** —
rasės, klasės, statistika (STR/DEX/CON/INT/WIT/MEN), CP/HP/MP kovos sistema,
lygių kėlimas, įgūdžiai, inventorius ir įranga, NPC parduotuvė bei kelios
tarpusavyje sujungtos zonos. Tai vieno žaidėjo prototipas, sukurtas grynu
HTML/CSS/JavaScript — be jokių priklausomybių ar build žingsnio.

## Paleidimas

Atidaryk `index.html` naršyklėje arba paleisk paprastą lokalų serverį:

```bash
python3 -m http.server 8000
```

ir naršyklėje atidaryk `http://localhost:8000/`.

## Žaidimo mechanika

- **Personažo kūrimas** — pasirenkama viena iš 5 rasių (Žmogus, Elfas, Tamsos
  elfas, Orkas, Dvarfas) ir kelias (Kovotojas arba Mistikas; dvarfai turi tik
  kovotojo kelią).
- **Judėjimas** — spustelėk žemėje, kad personažas ten nueitų; spustelėk
  monstrą ar NPC, kad juos pasirinktum arba su jais sąveikautum.
- **Kova** — automatinė ataka pasirinkus taikinį per ataką siekiantį atstumą,
  papildomi įgūdžiai klaviatūros klavišais `1`–`4`. CP (Combat Points)
  sugeria žalą pirmiau nei HP, kaip ir Lineage 2.
- **Lygiai ir XP** — nugalėję priešus gaunate patirties taškų ir auksą;
  pasiekus reikiamą ribą personažas pakyla lygiu ir sustiprėja.
- **Inventorius / įranga** — klavišas `I` atidaro inventorių, kur galima
  užsidėti ginklą/šarvus ar išgerti eliksyrą; klavišas `C` rodo personažo lapą.
- **Parduotuvė** — kalbėkis su NPC prekybininku kaimo aikštėje, kad pirktum
  geresnę įrangą ir eliksyrus.
- **Zonos** — Talkynės kaimas → Elmorės laukai → Pamirštas urvas, sujungtos
  portalais.
- **Išsaugojimas** — žaidimas automatiškai išsaugomas naršyklės
  `localStorage`, galima tęsti nuo pradinio ekrano.

## Failų struktūra

```
index.html          Pagrindinis puslapis / visų langų išdėstymas
css/style.css        Tamsi fantasy stiliaus vartotojo sąsaja
js/data.js           Rasės, klasės, įgūdžiai, daiktai, monstrai, zonų žemėlapiai
js/state.js          Žaidimo būsena, personažo kūrimas, statistikos skaičiavimas, save/load
js/world.js          Žemėlapio generavimas, kamera, canvas piešimas, minimap
js/entities.js       Monstrų DI, XP/lygių sistema, inventoriaus pagalbinės funkcijos
js/combat.js         Žalos skaičiavimas, įgūdžių naudojimas, mirtis/atgimimas
js/ui.js             Personažo kūrimo ekranas, HUD, inventorius, parduotuvė
js/input.js          Pelės ir klaviatūros valdymas
js/main.js           Pagrindinis žaidimo ciklas
```
