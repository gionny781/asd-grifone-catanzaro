{
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Pages CMS salva i percorsi immagine: li rendiamo relativi così funzionano anche sotto /asd-grifone-catanzaro/
  const img = (p) => (p ? String(p).replace(/^\/+/, '') : '');
  const paras = (t) => String(t || '').trim().split(/\n\s*\n/).filter(Boolean).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const fmtData = (d) => {
    if (!d) return '';
    const x = new Date(d);
    return isNaN(x) ? esc(d) : x.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const byDate = (a, b) => String(b.data || '').localeCompare(String(a.data || ''));
  const arr = (x) => (Array.isArray(x) ? x : []);
  // Ordina per il campo "Posizione" del pannello (10, 20, 15…); chi non ce l'ha resta in fondo, nell'ordine del pannello
  const byOrdine = (list) => list
    .map((x, i) => ({ x, i, o: parseFloat(String(x.ordine ?? '').replace(',', '.')) }))
    .sort((a, b) => (isNaN(a.o) ? Infinity : a.o) - (isNaN(b.o) ? Infinity : b.o) || a.i - b.i)
    .map((e) => e.x);
  const cache = {};
  const load = (f) => (cache[f] ||= fetch(`data/${f}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  const show = (id, yes) => { const el = $(id); if (el) el.hidden = !yes; };

  $('#anno').textContent = new Date().getFullYear();

  /* ---------- MODALITÀ MANUTENZIONE ----------
     Si attiva dal pannello (voce "Modalità manutenzione").
     Per vedere comunque il sito mentre è in pausa: aggiungi ?anteprima all'indirizzo (es. www.asdgrifonecz.it/?anteprima).
     Per uscire dall'anteprima: ?anteprima=no */
  const unlock = () => document.documentElement.classList.remove('chk');
  {
    const q = new URLSearchParams(location.search);
    try {
      if (q.has('anteprima')) {
        if (q.get('anteprima') === 'no') localStorage.removeItem('grifone-anteprima');
        else localStorage.setItem('grifone-anteprima', '1');
      }
    } catch (e) { /* storage non disponibile */ }
    let anteprima = false;
    try { anteprima = localStorage.getItem('grifone-anteprima') === '1'; } catch (e) { anteprima = q.has('anteprima') && q.get('anteprima') !== 'no'; }
    load('manutenzione').then((m) => {
      if (m && m.attiva === true) {
        if (anteprima) {
          document.body.insertAdjacentHTML('beforeend', '<div class="mnt-prev">Sito in pausa: lo vedi solo tu in anteprima · <a href="?anteprima=no">esci</a></div>');
        } else {
          const social = [...document.querySelectorAll('.topbar .social a')].map((a) => a.outerHTML).join('');
          document.body.insertAdjacentHTML('beforeend', `<div class="mnt" role="main">
            <div class="mnt-box">
              <div class="mnt-tape" aria-hidden="true"></div>
              ${m.immagine ? `<img class="mnt-img" src="${esc(img(m.immagine))}" alt="">` : '<img class="mnt-logo" src="images/logo.png" alt="Stemma A.S.D. Grifone Catanzaro">'}
              <h1>${esc(m.titolo || 'Sito in aggiornamento').replace(/^(\S+)/, '<span>$1</span>')}</h1>
              ${paras(m.messaggio)}
              ${m.fino_al ? `<span class="quando">Torniamo online: ${esc(m.fino_al)}</span>` : ''}
              <nav class="social" aria-label="Social">${social}</nav>
              <div class="mnt-tape" aria-hidden="true"></div>
            </div></div>`);
          document.title = `${m.titolo || 'Sito in aggiornamento'} – A.S.D. Grifone Catanzaro`;
          document.body.style.overflow = 'hidden';
        }
      }
      unlock();
    });
  }

  /* ---------- header, menu, torna su ---------- */
  const header = $('header');
  const totop = $('.totop');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    totop.classList.toggle('show', y > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('.burger');
  const menu = $('#menu');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    menu.classList.toggle('open', open);
  });

  /* ---------- comparsa allo scroll ---------- */
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); reveal.unobserve(en.target); } });
  }, { threshold: 0.12 });
  const watch = (root = document) => root.querySelectorAll('.reveal:not(.in), .sec-h').forEach((el, i) => {
    if (el.classList.contains('stagger')) el.style.transitionDelay = `${(i % 6) * 70}ms`;
    reveal.observe(el);
  });
  watch();

  /* ---------- logo che segue il mouse (home) ---------- */
  const heroLogo = $('.hero-logo img');
  const hero = $('.hero');
  if (heroLogo && matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      heroLogo.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`;
    });
    hero.addEventListener('mouseleave', () => { heroLogo.style.transform = ''; });
  }

  /* ---------- finestra (news e foto) ---------- */
  const modal = $('#modal');
  const box = $('.modal-box');
  const body = $('#modal-body');
  let lastFocus = null;
  const open = (html, photo = false) => {
    lastFocus = document.activeElement;
    body.innerHTML = html;
    box.classList.toggle('photo', photo);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal-x').focus();
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    body.innerHTML = '';
    if (lastFocus) lastFocus.focus();
  };
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  /* ---------- SOCIETÀ (foto squadra, chi siamo, email) ---------- */
  load('societa').then((s) => {
    s = s && typeof s === 'object' && !Array.isArray(s) ? s : {};
    if (s.email) {
      document.querySelectorAll('.f-email').forEach((el) => { el.innerHTML = `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`; });
    }
    if ($('#about-teaser') && s.chi_siamo) {
      const t = String(s.chi_siamo).trim().split(/\n\s*\n/)[0];
      $('#about-teaser').textContent = t.length > 320 ? t.slice(0, 317).replace(/\s+\S*$/, '') + '…' : t;
      show('#about-block', true);
    }
    if ($('#chi-siamo')) {
      $('#chi-siamo').innerHTML = paras(s.chi_siamo) || '<div class="empty">La storia del Grifone sarà pubblicata a breve.</div>';
      const facts = [
        ['Fondazione', s.fondazione],
        ['Campo di gioco', s.campo],
        ['Sede', 'Via Magna Grecia, 51/B – Catanzaro'],
        ['Colori sociali', s.colori || 'Giallo e verde'],
        ['Email', s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''],
      ].filter(([, v]) => v);
      $('#facts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${k === 'Email' ? v : esc(v)}</dd></div>`).join('');
    }
  });

  /* ---------- FOTO DELLA SQUADRA ATTUALE ---------- */
  if ($('#team-img')) {
    Promise.all([load('fotosquadra'), load('societa')]).then(([f, soc]) => {
      f = f && typeof f === 'object' && !Array.isArray(f) ? f : {};
      soc = soc && typeof soc === 'object' ? soc : {};
      const foto = f.foto || soc.foto_squadra; // compatibilità col vecchio campo
      const qui = document.body.dataset.page === 'index' ? f.home !== false : f.pagina_squadra !== false;
      if (!foto || !qui) return;
      $('#team-img').src = img(foto);
      if ($('#team-bg')) $('#team-bg').src = img(foto);
      const cap = f.didascalia || soc.didascalia_foto;
      if (cap) $('#team-cap').textContent = cap;
      show('#team-block', true);
    });
  }

  /* ---------- NEWS ---------- */
  const newsList = $('#news-list');
  if (newsList) {
    const more = $('#news-more');
    const filters = $('#news-filters');
    const step = +newsList.dataset.limit || 3;
    let all = [];
    let cat = '';
    let shown = step;
    const list = () => (cat ? all.filter((n) => n.categoria === cat) : all);
    const render = () => {
      const l = list();
      if (!l.length) {
        newsList.innerHTML = '<div class="empty" style="grid-column:1/-1">Le news arriveranno presto. Seguici sui social per gli aggiornamenti.</div>';
        if (more) more.hidden = true;
        return;
      }
      newsList.innerHTML = l.slice(0, shown).map((n) => `
        <button class="nc reveal stagger" data-i="${all.indexOf(n)}">
          <div class="img${n.foto ? ' fit' : ' noimg'}${n.categoria === 'Prossima partita' ? ' poster' : ''}">${n.foto ? `<img class="blurbg" src="${esc(img(n.foto))}" alt="" aria-hidden="true" loading="lazy">` : ''}<img class="main" src="${n.foto ? esc(img(n.foto)) : 'images/logo.png'}" alt="" loading="lazy"></div>
          <div class="t">
            <span class="cat">${esc(n.categoria || 'News')}${n.data ? ' · ' + fmtData(n.data) : ''}</span>
            <span class="tit">${esc(n.titolo)}</span>
            ${n.sommario ? `<span class="sum">${esc(n.sommario)}</span>` : ''}
            <span class="go">Leggi →</span>
          </div>
        </button>`).join('');
      if (more) more.hidden = shown >= l.length;
      watch(newsList);
    };
    const openNews = (n) => open(`<article class="art">
        ${n.foto ? `<div class="imgwrap"><img src="${esc(img(n.foto))}" alt=""></div>` : ''}
        <div class="in"><span class="cat" style="color:var(--verde);font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase">${esc(n.categoria || 'News')}${n.data ? ' · ' + fmtData(n.data) : ''}</span>
        <h3 id="modal-title">${esc(n.titolo)}</h3>${paras(n.testo || n.sommario)}</div></article>`);
    newsList.addEventListener('click', (e) => {
      const c = e.target.closest('.nc');
      if (c) openNews(all[+c.dataset.i]);
    });
    if (more) more.addEventListener('click', () => { shown += step; render(); });
    load('news').then((n) => {
      // News temporanee: spariscono da sole (scade_il, oppure 7 giorni dopo la data se "temporanea")
      const oggi = new Date();
      const scaduta = (x) => {
        let fine = null;
        if (x.scade_il) fine = new Date(`${x.scade_il}T23:59:59`);
        else if (x.temporanea === true && x.data) { fine = new Date(`${x.data}T23:59:59`); fine.setDate(fine.getDate() + 7); }
        return fine && !isNaN(fine) && oggi > fine;
      };
      all = arr(n).filter((x) => x && x.titolo && !scaduta(x)).sort(byDate);
      if (filters) {
        const cats = [...new Set(all.map((x) => x.categoria).filter(Boolean))];
        if (cats.length > 1) {
          filters.innerHTML = ['', ...cats].map((c) => `<button data-c="${esc(c)}" class="${c === '' ? 'on' : ''}">${c ? esc(c) : 'Tutte'}</button>`).join('');
          filters.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b) return;
            cat = b.dataset.c;
            shown = step;
            filters.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
            render();
          });
        }
      }
      render();
    });
  }

  /* ---------- GALLERIE (un carosello per partita) ---------- */
  // Ogni elemento della Fotogallery: { titolo, album, data, foto: [percorsi], home }
  // Compatibile anche col vecchio formato a foto singola.
  const normGal = (g) => arr(g).filter(Boolean).map((x) => ({
    titolo: x.titolo || x.didascalia || '',
    album: String(x.album || '').trim(),
    data: x.data || '',
    foto: [
      ...arr(x.foto_didascalia).filter((o) => o && o.immagine).map((o) => ({ src: o.immagine, cap: o.didascalia || '' })),
      ...(Array.isArray(x.foto) ? x.foto : [x.foto]).filter(Boolean).map((f) => (typeof f === 'object' ? { src: f.immagine || f.src, cap: f.didascalia || '' } : { src: f, cap: '' })),
    ].filter((o) => o.src),
    home: x.home === true || x.carosello === true,
  })).filter((x) => x.foto.length).sort(byDate);

  const ICON_L = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_R = '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // Finestra a schermo intero con frecce, per sfogliare tutte le foto di un carosello
  const lightbox = (fotos, start, titolo) => {
    let i = start;
    const draw = () => {
      const f = fotos[i];
      body.innerHTML = `<img src="${esc(img(f.src))}" alt="${esc(f.cap || titolo)}">
        <p id="modal-title">${f.cap ? `<b>${esc(f.cap)}</b><br>` : ''}${esc(titolo)}${fotos.length > 1 ? ` · ${i + 1} / ${fotos.length}` : ''}</p>
        ${fotos.length > 1 ? `<button class="lb-btn prev" aria-label="Foto precedente">${ICON_L}</button><button class="lb-btn next" aria-label="Foto successiva">${ICON_R}</button>` : ''}`;
    };
    open('', true);
    draw();
    const nav = (d) => { i = (i + d + fotos.length) % fotos.length; draw(); };
    const onClick = (e) => { if (e.target.closest('.lb-btn.prev')) nav(-1); else if (e.target.closest('.lb-btn.next')) nav(1); };
    const onKey = (e) => { if (e.key === 'ArrowLeft') nav(-1); if (e.key === 'ArrowRight') nav(1); };
    body.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    new MutationObserver((m, obs) => {
      if (modal.hidden) { body.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); obs.disconnect(); }
    }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  };

  // Crea un carosello dentro "slot". sec = secondi di scorrimento automatico (0 = manuale)
  const makeCarousel = (slot, fotos, titolo, sec = 0) => {
    const many = fotos.length > 1;
    const dotsHtml = fotos.length <= 12
      ? fotos.map((_, i) => `<button role="tab" aria-label="Foto ${i + 1}" aria-selected="${i === 0}"></button>`).join('')
      : '';
    slot.innerHTML = `<div class="car" role="region" aria-roledescription="carosello" aria-label="${esc(titolo)}">
        <div class="car-bar" aria-hidden="true"></div>
        <div class="car-track" tabindex="0">${fotos.map((f, i) => `
          <button class="slide${i ? '' : ' on'}" data-i="${i}" aria-label="Foto ${i + 1} di ${fotos.length}${f.cap ? ': ' + esc(f.cap) : ''}. Apri a schermo intero">
            <img class="blurbg" src="${esc(img(f.src))}" alt="" aria-hidden="true" ${i ? 'loading="lazy"' : ''}>
            <img class="main" src="${esc(img(f.src))}" alt="${esc(f.cap || titolo + ' – foto ' + (i + 1))}" ${i ? 'loading="lazy"' : ''}>
            ${f.cap ? `<span class="cap">${esc(f.cap)}</span>` : ''}
          </button>`).join('')}</div>
        ${many ? `<button class="car-btn prev" aria-label="Foto precedente">${ICON_L}</button><button class="car-btn next" aria-label="Foto successiva">${ICON_R}</button>` : ''}
        ${many ? (dotsHtml ? `<div class="car-dots" role="tablist" aria-label="Scegli la foto">${dotsHtml}</div>` : `<div class="car-count" aria-live="polite">1 / ${fotos.length}</div>`) : ''}
      </div>`;
    const car = $('.car', slot);
    const track = $('.car-track', car);
    const dots = $('.car-dots', car);
    const count = $('.car-count', car);
    const slides = [...track.children];
    let cur = 0;
    const go = (i) => { cur = (i + slides.length) % slides.length; track.scrollTo({ left: slides[cur].offsetLeft, behavior: 'smooth' }); };
    let timer = 0;
    let paused = false;
    const auto = many && sec > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    car.style.setProperty('--dur', `${sec}s`);
    const bar = $('.car-bar', car);
    const restart = () => {
      clearTimeout(timer);
      car.classList.remove('playing');
      if (!auto || paused || !modal.hidden || document.hidden) return;
      void bar.offsetWidth;
      car.classList.add('playing');
      timer = setTimeout(() => go(cur + 1), sec * 1000);
    };
    const mark = () => {
      const i = Math.min(Math.max(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)), 0), slides.length - 1);
      if (i === cur && slides[i].classList.contains('on')) return;
      cur = i;
      slides.forEach((s, k) => s.classList.toggle('on', k === cur));
      if (dots) dots.querySelectorAll('button').forEach((d, k) => d.setAttribute('aria-selected', k === cur));
      if (count) count.textContent = `${cur + 1} / ${slides.length}`;
      restart();
    };
    let raf = 0;
    track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(mark); }, { passive: true });
    $('.car-btn.prev', car)?.addEventListener('click', () => go(cur - 1));
    $('.car-btn.next', car)?.addEventListener('click', () => go(cur + 1));
    dots?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) go([...dots.children].indexOf(b)); });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    track.addEventListener('click', (e) => { const b = e.target.closest('.slide'); if (b) lightbox(fotos, +b.dataset.i, titolo); });
    if (auto) {
      car.addEventListener('mouseenter', () => { paused = true; restart(); });
      car.addEventListener('mouseleave', () => { paused = false; restart(); });
      car.addEventListener('focusin', () => { paused = true; restart(); });
      car.addEventListener('focusout', () => { paused = false; restart(); });
      document.addEventListener('visibilitychange', restart);
      new MutationObserver(restart).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
      restart();
    }
  };

  /* Home: carosello della partita scelta + ultime foto */
  const carSec = $('[data-carousel="home"]');
  const photoList = $('#photo-list');
  if (carSec || photoList) {
    Promise.all([load('carosello'), load('gallery')]).then(([cfg, g]) => {
      cfg = cfg && typeof cfg === 'object' && !Array.isArray(cfg) ? cfg : {};
      const gals = normGal(g);
      if (carSec && cfg.home !== false) {
        const gal = gals.find((x) => x.home);
        if (gal) {
          const t = cfg.titolo || gal.titolo;
          if (t) $('.car-title', carSec).textContent = t; else $('.sec-h', carSec).remove();
          makeCarousel($('.car-slot', carSec), gal.foto, gal.titolo || 'Foto del Grifone', parseFloat(String(cfg.secondi ?? '5').replace(',', '.')) || 0);
          carSec.hidden = false;
          watch(carSec);
        }
      }
      if (photoList) {
        const ultime = gals.flatMap((x) => x.foto.map((f, i) => ({ f: f.src, cap: f.cap, i, gal: x }))).slice(0, +photoList.dataset.limit || 4);
        show('#home-gallery', ultime.length > 0);
        photoList.innerHTML = ultime.map((u, k) => `
          <button class="ph reveal stagger" data-k="${k}" aria-label="Apri foto: ${esc(u.gal.titolo)}">
            <img src="${esc(img(u.f))}" alt="${esc(u.cap || u.gal.titolo)}" loading="lazy"><span>${esc(u.cap || u.gal.titolo)}</span>
          </button>`).join('');
        photoList.addEventListener('click', (e) => {
          const b = e.target.closest('.ph');
          if (!b) return;
          const u = ultime[+b.dataset.k];
          lightbox(u.gal.foto, u.i, u.gal.titolo);
        });
        watch(photoList);
      }
    });
  }

  /* Pagina Foto e video: album / stagioni, un carosello per partita, video */
  const galList = $('#gal-list');
  const videoList = $('#video-list');
  const ytId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; };
  const SENZA = 'Altre foto';
  if (galList || videoList) {
    let gals = [];
    let videos = [];
    let album = null; // null = tutti
    const inAlbum = (x) => album === null || (String(x.album || '').trim() || SENZA) === album;
    const renderGals = () => {
      if (!galList) return;
      const l = gals.filter(inAlbum);
      galList.innerHTML = l.length ? l.map((x, k) => `
        <article class="gal reveal">
          <div class="gal-h"><h3>${esc(x.titolo)}</h3><span>${x.data ? fmtData(x.data) + ' · ' : ''}${x.foto.length} ${x.foto.length === 1 ? 'foto' : 'foto'}</span></div>
          <div class="car-slot" data-k="${k}"></div>
        </article>`).join('')
        : `<div class="empty">${gals.length ? 'Nessuna galleria in questo album.' : 'Le foto delle partite arriveranno presto.'}</div>`;
      galList.querySelectorAll('.car-slot').forEach((slot) => { const x = l[+slot.dataset.k]; makeCarousel(slot, x.foto, x.titolo, 0); });
      watch(galList);
    };
    const renderVideos = () => {
      if (!videoList) return;
      const l = videos.filter(inAlbum);
      const vh = $('#video-h');
      if (vh) vh.hidden = album !== null && !l.length;
      videoList.hidden = album !== null && !l.length;
      videoList.innerHTML = l.length ? l.map((x) => `
        <a class="vc reveal stagger" href="https://www.youtube.com/watch?v=${ytId(x.youtube)}" target="_blank" rel="noopener">
          <img src="https://img.youtube.com/vi/${ytId(x.youtube)}/hqdefault.jpg" alt="" loading="lazy">
          <span class="play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#0B1F14"/></svg></span>
          <span class="vt">${esc(x.titolo)}</span>
        </a>`).join('') : '<div class="empty" style="grid-column:1/-1">I video arriveranno presto.</div>';
      watch(videoList);
    };
    const setAlbum = (a) => {
      album = a;
      const t = $('#album-title');
      if (t) { t.hidden = a === null; t.innerHTML = a === null ? '' : esc(a).replace(/^(\S+)/, '<span>$1</span>'); }
      document.querySelectorAll('#album-filters button').forEach((b) => {
        const on = (b.dataset.a === '' ? null : b.dataset.a) === a;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on);
      });
      renderGals();
      renderVideos();
    };
    Promise.all([galList ? load('gallery') : null, videoList ? load('video') : null]).then(([g, v]) => {
      gals = normGal(g);
      videos = arr(v).filter((x) => x && ytId(x.youtube)).sort(byDate);
      // album dal più recente; "Altre foto" in fondo
      const latest = {};
      [...gals, ...videos].forEach((x) => {
        const k = String(x.album || '').trim() || SENZA;
        const d = String(x.data || '');
        if (!(k in latest) || d > latest[k]) latest[k] = d;
      });
      const albums = Object.keys(latest).sort((x, y) => (x === SENZA) - (y === SENZA) || latest[y].localeCompare(latest[x]) || y.localeCompare(x, 'it'));
      const filtri = $('#album-filters');
      if (filtri && albums.length && !(albums.length === 1 && albums[0] === SENZA)) {
        filtri.innerHTML = albums.map((k) => `<button role="tab" data-a="${esc(k)}">${esc(k)}</button>`).join('') + '<button role="tab" data-a="">Tutti</button>';
        filtri.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setAlbum(b.dataset.a === '' ? null : b.dataset.a); });
        $('#album-bar').hidden = false;
        setAlbum(albums[0]);
      } else {
        setAlbum(null);
      }
    });
  }

  /* ---------- PERSONE (calciatori e staff) ---------- */
  const slug = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const scheda = (tipo, p) => `persona.html?t=${tipo}&n=${encodeURIComponent(slug(p.nome))}`;
  const card = (p, numero, tipo = 'staff') => `
    <a class="pc reveal stagger" href="${scheda(tipo, p)}">
      <div class="pimg">${p.foto ? `<img src="${esc(img(p.foto))}" alt="${esc(p.nome)}" loading="lazy">` : '<img class="logo" src="images/logo.png" alt="">'}
        ${numero ? `<span class="num">${esc(numero)}</span>` : ''}</div>
      <div class="info"><span class="nome">${esc(p.nome)}</span><span class="ruo">${esc(p.ruolo || '')}${p.anno_nascita ? ' · ' + esc(p.anno_nascita) : ''}</span></div>
    </a>`;

  const rosa = $('#rosa');
  if (rosa) {
    const ordine = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
    const plurale = { Portiere: 'Portieri', Difensore: 'Difensori', Centrocampista: 'Centrocampisti', Attaccante: 'Attaccanti' };
    load('calciatori').then((c) => {
      const list = arr(c).filter((x) => x && x.nome);
      if (!list.length) { rosa.innerHTML = '<div class="empty">La rosa della stagione sarà pubblicata a breve.</div>'; return; }
      const gruppi = [...ordine, ...new Set(list.map((x) => x.ruolo).filter((r) => r && !ordine.includes(r)))];
      const senza = list.filter((x) => !x.ruolo);
      rosa.innerHTML = gruppi.map((r) => {
        const g = list.filter((x) => x.ruolo === r).sort((a, b) => (parseInt(a.numero) || 99) - (parseInt(b.numero) || 99));
        return g.length ? `<div class="ruolo"><h2 class="reveal">${esc(plurale[r] || r)} <small>${g.length}</small></h2><div class="people">${g.map((p) => card({ ...p, ruolo: r }, p.numero, 'calciatori')).join('')}</div></div>` : '';
      }).join('') + (senza.length ? `<div class="ruolo"><h2 class="reveal">Rosa</h2><div class="people">${senza.map((p) => card(p, p.numero, 'calciatori')).join('')}</div></div>` : '');
      watch(rosa);
    });
  }

  const tecnico = $('#staff-tecnico');
  const dirig = $('#staff-dirigenza');
  if (tecnico || dirig) {
    load('staff').then((s) => {
      const list = byOrdine(arr(s).filter((x) => x && x.nome));
      const fill = (el, area, vuoto) => {
        if (!el) return;
        const g = list.filter((x) => (x.area || 'Dirigenza') === area);
        el.innerHTML = g.length ? g.map((p) => card(p)).join('') : `<div class="empty" style="grid-column:1/-1">${vuoto}</div>`;
        watch(el);
      };
      fill(tecnico, 'Staff tecnico', 'Lo staff tecnico sarà pubblicato a breve.');
      // Organigramma: un blocco per ruolo, nell'ordine in cui compaiono nel pannello
      if (dirig) {
        const g = list.filter((x) => (x.area || 'Dirigenza') === 'Dirigenza');
        if (!g.length) { dirig.innerHTML = '<div class="empty">L\'organigramma sarà pubblicato a breve.</div>'; return; }
        const ruoli = [...new Set(g.map((x) => (x.ruolo || 'Dirigenti').trim()))];
        dirig.innerHTML = ruoli.map((r) => {
          const persone = g.filter((x) => (x.ruolo || 'Dirigenti').trim() === r);
          return `<div class="org-row reveal"><h3>${esc(r)}</h3><div class="org-people">${persone.map((p) => `
            <a class="op" href="${scheda('staff', p)}">
              <div class="op-img">${p.foto ? `<img src="${esc(img(p.foto))}" alt="${esc(p.nome)}" loading="lazy">` : '<img class="logo" src="images/logo.png" alt="">'}</div>
              <span>${esc(p.nome)}</span>
            </a>`).join('')}</div></div>`;
        }).join('');
        watch(dirig);
      }
    });
  }

  /* ---------- SCHEDA PERSONALE ---------- */
  const schedaEl = $('#scheda');
  if (schedaEl) {
    const q = new URLSearchParams(location.search);
    const tipo = q.get('t') === 'calciatori' ? 'calciatori' : 'staff';
    const nome = q.get('n') || '';
    load(tipo).then((d) => {
      const list = tipo === 'staff' ? byOrdine(arr(d).filter((x) => x && x.nome)) : arr(d).filter((x) => x && x.nome);
      const isDir = (x) => (x.area || 'Dirigenza') === 'Dirigenza';
      const p = list.find((x) => slug(x.nome) === nome);
      const back = $('#p-back');
      if (!p) {
        schedaEl.innerHTML = '<div class="empty">Scheda non trovata. Torna alla <a href="squadra.html">squadra</a> o alla <a href="societa.html">società</a>.</div>';
        return;
      }
      const giocatore = tipo === 'calciatori';
      const dir = !giocatore && isDir(p);
      back.href = dir ? 'societa.html' : 'squadra.html';
      back.textContent = dir ? '← Torna all\'organigramma' : giocatore ? '← Torna alla rosa' : '← Torna allo staff';
      const ruolo = p.ruolo || (giocatore ? 'Calciatore' : 'Staff');
      $('#p-ruolo').textContent = ruolo;
      $('#p-nome-h').textContent = p.nome;
      document.title = `${p.nome} – ${ruolo} – A.S.D. Grifone Catanzaro`;
      const dati = [
        ['Nome e cognome', p.nome],
        ['Ruolo', ruolo],
        giocatore ? ['Numero di maglia', p.numero] : null,
        [giocatore ? 'Nascita' : 'Data di nascita', giocatore ? p.anno_nascita : p.data_nascita],
        !giocatore ? ['Area', dir ? 'Dirigenza' : 'Staff tecnico'] : null,
      ].filter((x) => x && x[1]);
      schedaEl.innerHTML = `
        <div class="s-foto reveal">${p.foto_scheda || p.foto ? `<img src="${esc(img(p.foto_scheda || p.foto))}" alt="${esc(p.nome)}">` : '<div class="s-nofoto"><img src="images/logo.png" alt=""></div>'}
          ${giocatore && p.numero ? `<span class="s-num">${esc(p.numero)}</span>` : ''}</div>
        <div class="s-dati reveal">
          <h2>Dati anagrafici</h2>
          <dl>${dati.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          ${p.bio ? `<div class="prose">${paras(p.bio)}</div>` : ''}
        </div>`;
      // altri tesserati dello stesso gruppo: precedente / successivo
      const gruppo = giocatore ? list : list.filter((x) => isDir(x) === dir);
      const i = gruppo.indexOf(p);
      const prev = gruppo[i - 1];
      const next = gruppo[i + 1];
      $('#p-nav').innerHTML = (prev ? `<a href="${scheda(tipo, prev)}">← ${esc(prev.nome)}</a>` : '<span></span>') + (next ? `<a href="${scheda(tipo, next)}">${esc(next.nome)} →</a>` : '');
      watch(schedaEl);
    });
  }

  /* ---------- CONTATTI ---------- */
  const contactList = $('#contact-list');
  if (contactList) {
    const mapUrl = (a) => `https://maps.google.com/maps?q=${encodeURIComponent(a)}&z=16&output=embed`;
    const linkUrl = (a) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
    const fillMap = (id, titolo, indirizzo) => {
      const el = $(id);
      if (!el || !indirizzo) return;
      el.querySelector('.mapbox').innerHTML = `<iframe title="Mappa: ${esc(titolo)}" src="${mapUrl(indirizzo)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
      el.querySelector('.addr').textContent = indirizzo;
      el.querySelector('.maplink').href = linkUrl(indirizzo);
      if (titolo) el.querySelector('h2').textContent = titolo;
      el.hidden = false;
    };
    load('contatti').then((c) => {
      c = c && typeof c === 'object' && !Array.isArray(c) ? c : {};
      fillMap('#map-stadio', c.stadio_nome || 'Stadio', c.stadio_indirizzo);
      fillMap('#map-sede', 'Sede legale', c.sede_indirizzo);
      const tel = (t) => `<a href="tel:${esc(String(t).replace(/[^+\d]/g, ''))}">${esc(t)}</a>`;
      const rows = arr(c.contatti).filter((x) => x && (x.email || x.telefono));
      if (c.telefono) rows.unshift({ area: 'Telefono', telefono: c.telefono });
      contactList.innerHTML = rows.length ? rows.map((x) => `<div class="ci"><b>${esc(x.area || 'Contatto')}</b>
        ${x.email ? `<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>` : ''}${x.telefono ? tel(x.telefono) : ''}</div>`).join('')
        : '<div class="empty">I contatti saranno pubblicati a breve.</div>';
    });
  }

  /* ---------- SPONSOR ---------- */
  const sponsorList = $('#sponsor-list');
  if (sponsorList) {
    load('sponsor').then((s) => {
      const list = arr(s).filter((x) => x && x.nome);
      sponsorList.innerHTML = list.length ? list.map((x) => {
        const inner = x.logo ? `<img src="${esc(img(x.logo))}" alt="${esc(x.nome)}" loading="lazy">` : esc(x.nome);
        return x.link
          ? `<a class="pl reveal stagger" href="${esc(x.link)}" target="_blank" rel="noopener" title="${esc(x.nome)}">${inner}</a>`
          : `<div class="pl reveal stagger" title="${esc(x.nome)}">${inner}</div>`;
      }).join('') : '<div class="empty" style="grid-column:1/-1">Spazio riservato ai partner del Grifone.</div>';
      watch(sponsorList);
    });
  }
}
