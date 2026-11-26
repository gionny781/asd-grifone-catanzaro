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
  const cache = {};
  const load = (f) => (cache[f] ||= fetch(`data/${f}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  const show = (id, yes) => { const el = $(id); if (el) el.hidden = !yes; };

  $('#anno').textContent = new Date().getFullYear();

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
    if (s.foto_squadra && $('#team-img')) {
      $('#team-img').src = img(s.foto_squadra);
      if (s.didascalia_foto) $('#team-cap').textContent = s.didascalia_foto;
      show('#team-block', true);
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
        ['Colori sociali', 'Giallo e verde'],
        ['Email', s.email ? `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ''],
      ].filter(([, v]) => v);
      $('#facts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${k === 'Email' ? v : esc(v)}</dd></div>`).join('');
    }
  });

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
          <div class="img${n.foto ? '' : ' noimg'}"><img src="${n.foto ? esc(img(n.foto)) : 'images/logo.png'}" alt="" loading="lazy"></div>
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
        ${n.foto ? `<img src="${esc(img(n.foto))}" alt="">` : ''}
        <div class="in"><span class="cat" style="color:var(--verde);font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase">${esc(n.categoria || 'News')}${n.data ? ' · ' + fmtData(n.data) : ''}</span>
        <h3 id="modal-title">${esc(n.titolo)}</h3>${paras(n.testo || n.sommario)}</div></article>`);
    newsList.addEventListener('click', (e) => {
      const c = e.target.closest('.nc');
      if (c) openNews(all[+c.dataset.i]);
    });
    if (more) more.addEventListener('click', () => { shown += step; render(); });
    load('news').then((n) => {
      all = arr(n).filter((x) => x && x.titolo).sort(byDate);
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

  /* ---------- FOTO ---------- */
  const photoList = $('#photo-list');
  if (photoList) {
    const more = $('#photo-more');
    const step = +photoList.dataset.limit || 8;
    let photos = [];
    let shown = step;
    const render = () => {
      if (!photos.length) {
        photoList.innerHTML = '<div class="empty" style="grid-column:1/-1">Le foto delle partite arriveranno presto.</div>';
        if (more) more.hidden = true;
        return;
      }
      photoList.innerHTML = photos.slice(0, shown).map((p, i) => `
        <button class="ph reveal stagger" data-i="${i}" aria-label="Apri foto${p.didascalia ? ': ' + esc(p.didascalia) : ''}">
          <img src="${esc(img(p.foto))}" alt="${esc(p.didascalia)}" loading="lazy">
          ${p.didascalia ? `<span>${esc(p.didascalia)}</span>` : ''}
        </button>`).join('');
      if (more) more.hidden = shown >= photos.length;
      watch(photoList);
    };
    photoList.addEventListener('click', (e) => {
      const b = e.target.closest('.ph');
      if (!b) return;
      const p = photos[+b.dataset.i];
      open(`<img src="${esc(img(p.foto))}" alt="${esc(p.didascalia)}">${p.didascalia ? `<p id="modal-title">${esc(p.didascalia)}</p>` : ''}`, true);
    });
    if (more) more.addEventListener('click', () => { shown += step; render(); });
    load('gallery').then((g) => {
      photos = arr(g).filter((x) => x && x.foto).sort(byDate);
      show('#home-gallery', photos.length > 0);
      render();
    });
  }

  /* ---------- VIDEO ---------- */
  const videoList = $('#video-list');
  if (videoList) {
    const ytId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; };
    load('video').then((v) => {
      const list = arr(v).filter((x) => x && ytId(x.youtube));
      videoList.innerHTML = list.length ? list.map((x) => `
        <a class="vc reveal stagger" href="https://www.youtube.com/watch?v=${ytId(x.youtube)}" target="_blank" rel="noopener">
          <img src="https://img.youtube.com/vi/${ytId(x.youtube)}/hqdefault.jpg" alt="" loading="lazy">
          <span class="play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#0B1F14"/></svg></span>
          <span class="vt">${esc(x.titolo)}</span>
        </a>`).join('') : '<div class="empty" style="grid-column:1/-1">I video arriveranno presto.</div>';
      watch(videoList);
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
      const list = arr(s).filter((x) => x && x.nome);
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
      const list = arr(d).filter((x) => x && x.nome);
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
