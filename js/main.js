{
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Pages CMS salva i percorsi immagine; li rendiamo relativi così funzionano anche sotto /asd-grifone-catanzaro/
  const img = (p) => (p ? String(p).replace(/^\/+/, '') : '');
  const fmtData = (d) => {
    if (!d) return '';
    const x = new Date(d);
    return isNaN(x) ? esc(d) : x.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const byDate = (a, b) => String(b.data || '').localeCompare(String(a.data || ''));
  const load = (f) => fetch(`data/${f}.json`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : [])).catch(() => []);

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
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); }
  });

  // voce di menu attiva in base alla sezione visibile
  const links = [...menu.querySelectorAll('a[href^="#"]')].filter((a) => a.getAttribute('href').length > 1);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const t = $(a.getAttribute('href')); if (t) spy.observe(t); });

  /* ---------- comparsa allo scroll ---------- */
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); reveal.unobserve(en.target); } });
  }, { threshold: 0.12 });
  const watch = (root = document) => root.querySelectorAll('.reveal:not(.in), .sec-h').forEach((el, i) => {
    el.style.transitionDelay = el.classList.contains('stagger') ? `${(i % 6) * 70}ms` : '';
    reveal.observe(el);
  });
  watch();

  /* ---------- logo che segue il mouse ---------- */
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

  /* ---------- NEWS ---------- */
  const newsList = $('#news-list');
  const newsMore = $('#news-more');
  let news = [];
  let newsShown = 3;
  const renderNews = () => {
    if (!news.length) {
      newsList.innerHTML = '<div class="empty">Le news arriveranno presto. Seguici sui social per gli aggiornamenti.</div>';
      newsMore.hidden = true;
      return;
    }
    newsList.innerHTML = news.slice(0, newsShown).map((n, i) => `
      <button class="nc reveal stagger" data-i="${i}">
        <div class="img${n.foto ? '' : ' noimg'}"><img src="${n.foto ? esc(img(n.foto)) : 'images/logo.png'}" alt="" loading="lazy"></div>
        <div class="t">
          <span class="cat">${esc(n.categoria || 'News')}${n.data ? ' · ' + fmtData(n.data) : ''}</span>
          <span class="tit">${esc(n.titolo)}</span>
          ${n.sommario ? `<span class="sum">${esc(n.sommario)}</span>` : ''}
          <span class="go">Leggi →</span>
        </div>
      </button>`).join('');
    newsMore.hidden = newsShown >= news.length;
    watch(newsList);
  };
  newsList.addEventListener('click', (e) => {
    const c = e.target.closest('.nc');
    if (!c) return;
    const n = news[+c.dataset.i];
    const testo = String(n.testo || n.sommario || '').split(/\n\s*\n/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    open(`<article class="art">
      ${n.foto ? `<img src="${esc(img(n.foto))}" alt="">` : ''}
      <div class="in"><span class="cat" style="color:var(--verde);font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase">${esc(n.categoria || 'News')}${n.data ? ' · ' + fmtData(n.data) : ''}</span>
      <h3 id="modal-title">${esc(n.titolo)}</h3>${testo}</div></article>`);
  });
  newsMore.addEventListener('click', () => { newsShown += 6; renderNews(); });

  /* ---------- VIDEO ---------- */
  const ytId = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; };
  const renderVideo = (list) => {
    const v = list.filter((x) => ytId(x.youtube));
    $('#video-list').innerHTML = v.map((x) => `
      <a class="vc reveal stagger" href="https://www.youtube.com/watch?v=${ytId(x.youtube)}" target="_blank" rel="noopener">
        <img src="https://img.youtube.com/vi/${ytId(x.youtube)}/hqdefault.jpg" alt="" loading="lazy">
        <span class="play" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#0B1F14"/></svg></span>
        <span class="vt">${esc(x.titolo)}</span>
      </a>`).join('');
    watch($('#video-list'));
  };

  /* ---------- FOTO ---------- */
  const photoList = $('#photo-list');
  const photoMore = $('#photo-more');
  let photos = [];
  let photosShown = 8;
  const renderPhotos = () => {
    if (!photos.length) {
      photoList.innerHTML = '<div class="empty" style="grid-column:1/-1">Le foto delle partite arriveranno presto.</div>';
      photoMore.hidden = true;
      return;
    }
    photoList.innerHTML = photos.slice(0, photosShown).map((p, i) => `
      <button class="ph reveal stagger" data-i="${i}" aria-label="Apri foto${p.didascalia ? ': ' + esc(p.didascalia) : ''}">
        <img src="${esc(img(p.foto))}" alt="${esc(p.didascalia)}" loading="lazy">
        ${p.didascalia ? `<span>${esc(p.didascalia)}</span>` : ''}
      </button>`).join('');
    photoMore.hidden = photosShown >= photos.length;
    watch(photoList);
  };
  photoList.addEventListener('click', (e) => {
    const b = e.target.closest('.ph');
    if (!b) return;
    const p = photos[+b.dataset.i];
    open(`<img src="${esc(img(p.foto))}" alt="${esc(p.didascalia)}">${p.didascalia ? `<p id="modal-title">${esc(p.didascalia)}</p>` : ''}`, true);
  });
  photoMore.addEventListener('click', () => { photosShown += 8; renderPhotos(); });

  /* ---------- SPONSOR ---------- */
  const renderSponsor = (list) => {
    const el = $('#sponsor-list');
    if (!list.length) { el.innerHTML = '<div class="empty" style="grid-column:1/-1">Spazio riservato ai partner del Grifone.</div>'; return; }
    el.innerHTML = list.map((s) => {
      const inner = s.logo ? `<img src="${esc(img(s.logo))}" alt="${esc(s.nome)}" loading="lazy">` : esc(s.nome);
      return s.link
        ? `<a class="pl reveal stagger" href="${esc(s.link)}" target="_blank" rel="noopener" title="${esc(s.nome)}">${inner}</a>`
        : `<div class="pl reveal stagger" title="${esc(s.nome)}">${inner}</div>`;
    }).join('');
    watch(el);
  };

  Promise.all(['news', 'gallery', 'video', 'sponsor'].map(load)).then(([n, g, v, s]) => {
    news = (Array.isArray(n) ? n : []).filter((x) => x && x.titolo).sort(byDate);
    photos = (Array.isArray(g) ? g : []).filter((x) => x && x.foto).sort(byDate);
    renderNews();
    renderPhotos();
    renderVideo(Array.isArray(v) ? v : []);
    renderSponsor((Array.isArray(s) ? s : []).filter((x) => x && x.nome));
  });
}
