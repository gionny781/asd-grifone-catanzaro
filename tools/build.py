#!/usr/bin/env python3
"""Genera le pagine HTML del sito con header e footer comuni.
Uso: python3 tools/build.py  (dalla cartella del repository)
I contenuti (news, foto, squadra...) NON sono qui: stanno in data/*.json e si gestiscono da Pages CMS."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TT = "fb7bef38-b96a-496d-a2a6-3963b61bf1c1"  # ID widget Tuttocampo

SOCIAL = [
    ("Facebook", "https://www.facebook.com/profile.php?id=100087152842746"),
    ("Instagram", "https://instagram.com/asdgrifonecz"),
    ("TikTok", "https://www.tiktok.com/@a.s.d.grifone.cat"),
    ("Telegram", "https://t.me/asdgrifonecatanzaro"),
]
MENU = [
    ("index.html", "Home"),
    ("news.html", "News"),
    ("classifica.html", "Classifica"),
    ("squadra.html", "Squadra"),
    ("societa.html", "Società"),
    ("galleria.html", "Foto e video"),
    ("partner.html", "Partner"),
]


def widget(kind, title, h, pad=False):
    return (f'<div class="widget{" pad" if pad else ""}"><iframe title="{title}" '
            f'src="https://www.tuttocampo.it/WidgetV2/{kind}/{TT}" height="{h}" scrolling="no" loading="lazy"></iframe></div>')


def page_head(title, intro):
    return f'''<section class="phero"><div class="wrap">
  <h1 class="reveal">{title}</h1>
  <p class="reveal">{intro}</p>
</div></section>'''


def layout(file, title, desc, body):
    social = "\n    ".join(f'<a href="{u}" target="_blank" rel="noopener">{n}</a>' for n, u in SOCIAL)
    menu = "\n    ".join(
        f'<a href="{f}"{" class=\"on\" aria-current=\"page\"" if f == file else ""}>{n}</a>' for f, n in MENU)
    fmenu = "\n      ".join(f'<a href="{f}">{n}</a>' for f, n in MENU[1:])
    full_title = "A.S.D. Grifone Catanzaro – Sito ufficiale" if file == "index.html" else f"{title} – A.S.D. Grifone Catanzaro"
    return f'''<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full_title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{full_title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="images/logo.png">
<meta name="theme-color" content="#0B5A2C">
<link rel="icon" href="images/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body data-page="{file.replace(".html", "")}">

<div class="topbar"><div class="wrap">
  <span>Via Magna Grecia, 51/B – Catanzaro</span>
  <nav class="social" aria-label="Social">
    {social}
  </nav>
</div></div>

<header id="top"><div class="wrap">
  <a class="brand" href="index.html">
    <img src="images/logo.png" alt="Stemma A.S.D. Grifone Catanzaro">
    <span><b>Grifone</b><small>A.S.D. Catanzaro</small></span>
  </a>
  <button class="burger" aria-label="Apri il menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
  <nav class="menu" id="menu" aria-label="Menu principale">
    {menu}
  </nav>
</div></header>

<main>
{body}
</main>

<footer>
  <div class="wrap top">
    <div class="fbrand">
      <img src="images/logo.png" alt="Stemma A.S.D. Grifone Catanzaro">
      <div><div class="ftitle">A.S.D. Grifone Catanzaro</div><div class="fsub">Omnia pro tibi, nihil sine te</div></div>
    </div>
    <div class="fcol"><span class="h">Dove siamo</span><span>Via Magna Grecia, 51/B</span><span>Catanzaro</span><span class="f-email"></span></div>
    <div class="fcol"><span class="h">Il sito</span>
      {fmenu}
    </div>
    <div class="fcol"><span class="h">Seguici</span>
      {social.replace(chr(10) + "    ", chr(10) + "      ")}
    </div>
  </div>
  <div class="wrap copy">© <span id="anno">2026</span> A.S.D. Grifone Catanzaro · Dati partite: Tuttocampo.it</div>
</footer>

<a class="totop" href="#top" aria-label="Torna su"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>

<div class="modal" id="modal" hidden>
  <div class="modal-bg" data-close></div>
  <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <button class="modal-x" data-close aria-label="Chiudi">×</button>
    <div id="modal-body"></div>
  </div>
</div>

<script src="js/main.js"></script>
</body>
</html>
'''


PAGES = {}

PAGES["index.html"] = ("Home", "Sito ufficiale dell'A.S.D. Grifone Catanzaro: prossima partita, risultati, classifica, news e foto della squadra giallo-verde.", f'''<section class="hero">
  <div class="wrap">
    <div class="hero-txt">
      <span class="tag reveal">Calcio dilettantistico · Catanzaro</span>
      <h1 class="reveal">Omnia pro tibi,<br><span>nihil sine te</span></h1>
      <p class="reveal">Tutto per te, niente senza di te. Il sito ufficiale del Grifone: partite, classifica, news e la vita della società in giallo e verde.</p>
      <div class="btns reveal">
        <a class="btn g" href="classifica.html">Classifica</a>
        <a class="btn o" href="squadra.html">La squadra</a>
      </div>
    </div>
    <div class="hero-logo"><img src="images/logo.png" alt="" aria-hidden="true"></div>
  </div>
</section>

<div class="wrap match" id="partite">
  <div class="grid2">
    <div class="card gy reveal">
      <div class="card-h"><h2>Prossima partita</h2></div>
      {widget("ProssimaPartita", "Prossima partita del Grifone", 350)}
    </div>
    <div class="card gr reveal">
      <div class="card-h"><h2>Ultimo risultato</h2></div>
      {widget("Partita", "Ultimo risultato del Grifone", 350)}
    </div>
  </div>
</div>

<section class="blk" id="team-block" hidden><div class="wrap">
  <figure class="teamphoto reveal">
    <img id="team-img" src="" alt="Foto di squadra dell'A.S.D. Grifone Catanzaro">
    <figcaption><span class="oswald" id="team-cap">La nostra squadra</span><a class="btn g" href="squadra.html">Scopri la rosa</a></figcaption>
  </figure>
</div></section>

<section class="blk"><div class="wrap">
  <div class="sec-h reveal"><h2>Ultime news</h2><a href="news.html">Tutte le news →</a></div>
  <div class="news" id="news-list" data-limit="3"></div>
</div></section>

<section class="blk" id="about-block" hidden><div class="wrap">
  <div class="about reveal">
    <img src="images/logo.png" alt="" aria-hidden="true">
    <div>
      <h2>Chi siamo</h2>
      <p id="about-teaser"></p>
      <a class="btn g" href="societa.html">La società</a>
    </div>
  </div>
</div></section>

<section class="dark-sec" id="home-gallery" hidden><div class="wrap">
  <div class="sec-h reveal"><h2>Ultime <span>foto</span></h2><a href="galleria.html">Tutta la gallery →</a></div>
  <div class="photos" id="photo-list" data-limit="4"></div>
</div></section>

<section class="partners"><div class="wrap">
  <h2 class="reveal">I nostri partner</h2>
  <div class="plogos" id="sponsor-list"></div>
</div></section>''')

PAGES["news.html"] = ("News", "Tutte le news dell'A.S.D. Grifone Catanzaro.", page_head("News", "Notizie, comunicati e aggiornamenti dal mondo Grifone.") + '''
<section class="blk"><div class="wrap">
  <div class="filters" id="news-filters"></div>
  <div class="news" id="news-list" data-limit="9"></div>
  <button class="more" id="news-more" hidden>Mostra altre news</button>
</div></section>''')

PAGES["classifica.html"] = ("Classifica", "Classifica, risultati e marcatori del campionato dell'A.S.D. Grifone Catanzaro.", page_head("Classifica e risultati", "Dati aggiornati automaticamente da Tuttocampo.") + f'''
<section class="blk"><div class="wrap">
  <div class="grid2">
    <div class="card gy reveal">
      <div class="card-h"><h2>Prossima partita</h2></div>
      {widget("ProssimaPartita", "Prossima partita del Grifone", 350)}
    </div>
    <div class="card gr reveal">
      <div class="card-h"><h2>Ultimo risultato</h2></div>
      {widget("Partita", "Ultimo risultato del Grifone", 350)}
    </div>
  </div>
</div></section>
<section class="blk"><div class="wrap">
  <div class="grid2">
    <div class="card reveal">
      <div class="card-h dark"><h2>Classifica</h2></div>
      {widget("Classifica", "Classifica del campionato", 800, True)}
    </div>
    <div class="stack2">
      <div class="card gr reveal">
        <div class="card-h"><h2>Risultati</h2></div>
        {widget("Risultati", "Risultati del campionato", 600)}
      </div>
    </div>
  </div>
</div></section>
<section class="blk pb"><div class="wrap">
  <div class="card gy reveal narrow">
    <div class="card-h"><h2>Classifica marcatori</h2></div>
    {widget("Marcatori", "Classifica marcatori", 700)}
  </div>
</div></section>''')

PAGES["squadra.html"] = ("Squadra", "La rosa e lo staff tecnico dell'A.S.D. Grifone Catanzaro.", page_head("La squadra", "I calciatori e lo staff tecnico del Grifone.") + '''
<section class="blk" id="team-block" hidden><div class="wrap">
  <figure class="teamphoto reveal"><img id="team-img" src="" alt="Foto di squadra dell'A.S.D. Grifone Catanzaro"><figcaption><span class="oswald" id="team-cap">La nostra squadra</span></figcaption></figure>
</div></section>
<section class="blk"><div class="wrap" id="rosa"></div></section>
<section class="blk pb"><div class="wrap">
  <div class="sec-h reveal"><h2>Staff tecnico</h2></div>
  <div class="people" id="staff-tecnico"></div>
</div></section>''')

PAGES["societa.html"] = ("Società", "Chi siamo: storia, dirigenza e contatti dell'A.S.D. Grifone Catanzaro.", page_head("La società", "Chi siamo, chi guida il Grifone e dove trovarci.") + '''
<section class="blk"><div class="wrap cols">
  <div class="main">
    <div class="sec-h reveal"><h2>Chi siamo</h2></div>
    <div class="prose reveal" id="chi-siamo"></div>
  </div>
  <aside class="side">
    <div class="card gy reveal">
      <div class="card-h"><h2>Scheda</h2></div>
      <dl class="facts" id="facts"></dl>
    </div>
  </aside>
</div></section>
<section class="blk pb"><div class="wrap">
  <div class="sec-h reveal"><h2>Dirigenza</h2></div>
  <div class="people" id="staff-dirigenza"></div>
</div></section>''')

PAGES["galleria.html"] = ("Foto e video", "Foto e video delle partite dell'A.S.D. Grifone Catanzaro.", page_head("Foto e video", "Le immagini e i video delle nostre partite.") + '''
<section class="dark-sec flat"><div class="wrap">
  <div class="sec-h reveal"><h2>Video</h2></div>
  <div class="videos" id="video-list"></div>
  <div class="sec-h reveal" style="margin-top:40px"><h2>Fotogallery</h2></div>
  <div class="photos" id="photo-list" data-limit="12"></div>
  <button class="more light" id="photo-more" hidden>Mostra altre foto</button>
</div></section>''')

PAGES["partner.html"] = ("Partner", "I partner e gli sponsor che sostengono l'A.S.D. Grifone Catanzaro.", page_head("I nostri partner", "Le aziende che sostengono il Grifone, dentro e fuori dal campo.") + '''
<section class="partners"><div class="wrap">
  <div class="plogos big" id="sponsor-list"></div>
  <div class="cta reveal">
    <h2>Diventa partner del Grifone</h2>
    <p>Vuoi legare il nome della tua attività alla squadra? Scrivici sui nostri canali social.</p>
    <a class="btn g" href="https://www.facebook.com/profile.php?id=100087152842746" target="_blank" rel="noopener">Contattaci su Facebook</a>
  </div>
</div></section>''')

for f, (title, desc, body) in PAGES.items():
    (ROOT / f).write_text(layout(f, title, desc, body), encoding="utf-8")
    print("scritto", f)
