/* =====================================================
   بن قيّم — script.js
   الداتا (الأسعار) + الجافاسكربت العادي للموقع.
   كل حاجة جوه IIFE عشان ما يحصلش تعارض أسماء مع app.jsx،
   والمشاركة بتتم عن طريق window.QAIEM بس.
   ===================================================== */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ============ 1. UTILITIES ============ */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const nf = new Intl.NumberFormat('ar-EG');
  const fmt = (n) => nf.format(n);
  const money = (n) => `${fmt(n)} ج`;

  // تطبيع النص العربي للبحث (يتجاهل التشكيل والهمزات والتاء المربوطة)
  const norm = (s) => String(s || '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    kids.flat().forEach((c) => {
      if (c !== null && c !== undefined && c !== false && c !== '') n.append(c);
    });
    return n;
  }

  /* ============ 2. DATA ============ */
  const WHATSAPP = '201069990756';
  const STORE_NAME = 'بن قيّم';

  const WEIGHTS = [
    { key: 'eighth',  label: 'ثمن',  grams: '١٢٥ جم' },
    { key: 'quarter', label: 'ربع',  grams: '٢٥٠ جم' },
    { key: 'half',    label: 'نص',   grams: '٥٠٠ جم' },
    { key: 'kilo',    label: 'كيلو', grams: '١٠٠٠ جم' },
  ];

  // p = [ثمن, ربع, نص, كيلو]
  const BEAN_FAMILIES = [
    { id: 'sharqi',   name: 'شرقي', roast: '', items: [
      { v: 'سادة', p: [75, 150, 300, 600] }, { v: 'محوج', p: [85, 170, 340, 680] } ] },
    { id: 'makhsous', name: 'مخصوص', roast: 'فاتح - وسط', items: [
      { v: 'سادة', p: [85, 170, 340, 680] }, { v: 'محوج', p: [95, 190, 380, 760] } ] },
    { id: 'qaiem',    name: 'قيّم', roast: 'فاتح - وسط', items: [
      { v: 'سادة', p: [95, 190, 380, 760] }, { v: 'محوج', p: [105, 210, 420, 840] } ] },
    { id: 'aseel',    name: 'الأصيل', roast: 'فاتح - وسط', items: [
      { v: 'سادة', p: [122, 245, 490, 980] }, { v: 'محوج', p: [132, 265, 530, 1060] } ] },
    { id: 'ghamqa',   name: 'غامقة', roast: 'تحميص غامق', items: [
      { v: 'سادة', p: [80, 160, 320, 640] }, { v: 'محوج', p: [90, 180, 360, 720] } ] },
    { id: 'espresso', name: 'توليفة إسبريسو', roast: '', items: [
      { v: '', p: [95, 190, 380, 760] } ] },
    { id: 'brazil',   name: 'برازيلي', roast: 'فاتح - وسط', items: [
      { v: 'سادة', p: [95, 190, 380, 760] }, { v: 'محوج', p: [105, 210, 420, 840] } ] },
    { id: 'brazil-dark', name: 'برازيلي غامقة', roast: 'تحميص غامق', items: [
      { v: 'سادة', p: [100, 200, 400, 800] }, { v: 'محوج', p: [110, 220, 440, 880] } ] },
    { id: 'habashi',  name: 'حبشي', roast: 'فاتح - وسط', items: [
      { v: 'سادة', p: [95, 190, 380, 760] }, { v: 'محوج', p: [105, 210, 420, 840] } ] },
    { id: 'colombia', name: 'كولومبي', roast: 'فاتح - وسط', items: [
      { v: 'سادة', p: [150, 300, 600, 1200] }, { v: 'محوج', p: [160, 320, 640, 1280] } ] },
    { id: 'colombia-dark', name: 'كولومبي غامقة', roast: 'تحميص غامق', items: [
      { v: 'سادة', p: [160, 320, 640, 1280] }, { v: 'محوج', p: [170, 340, 680, 1360] } ] },
  ];

  const BULK = [
    { name: 'قهوة خضراء',     p: [70, 140, 280, 560] },
    { name: 'قهوة عربي',      p: [120, 240, 480, 960] },
    { name: 'نسكافيه كلاسيك', p: [175, 350, 700, 1400] },
    { name: 'نسكافيه جولد',   p: [225, 450, 900, 1800] },
    { name: 'قهوة بندة قطع',  p: [95, 190, 380, 760] },
    { name: 'هوت شوكليت',     p: [75, 150, 300, 600] },
    { name: 'قهوة فرنساوي',   p: [75, 150, 300, 600] },
    { name: 'نسكافيه 3×1',    p: [75, 150, 300, 600] },
    { name: 'كابتشينو', note: 'سادة - بندق - شوكولاتة', p: [75, 150, 300, 600] },
    { name: 'كاكاو خام',      p: [95, 190, 380, 760] },
  ];

  const D = (name, price, alt) => ({
    name,
    options: alt ? [{ label: '', price }, { label: alt.label, price: alt.price }] : [{ label: '', price }],
  });

  const DRINKS = [
    D('قهوة', 25), D('قهوة كبيرة', 40), D('إسبريسو', 30), D('إسبريسو كبير', 45),
    D('قهوة فرنساوي', 40), D('قهوة بندة', 45),
    D('كابتشينو', 40, { label: 'كبير', price: 65 }),
    D('هوت شوكليت', 40), D('نسكافيه 3×1', 40), D('نسكافيه كلاسيك', 45),
    D('نسكافيه جولد', 55), D('لاتيه', 65), D('فلات وايت', 50), D('أمريكانو', 50),
  ];

  const HERBAL = [
    D('شاي', 10), D('شاي باللبن', 15), D('ينسون', 10), D('نعناع', 10),
    D('زنجبيل', 10), D('قرفة', 10), D('تفاح بالقرفة', 15), D('كركديه', 10),
  ];

  const MOODS = [
    { id: 'classic', title: 'أصيلة وتقليدية',
      desc: 'لو بتحب القهوة العربي على أصولها، دي أصنافنا الكلاسيكية.',
      picks: ['sharqi', 'makhsous', 'aseel'] },
    { id: 'bold', title: 'غامقة وقوية',
      desc: 'تحميص غامق لمحبي الطعم القوي والإسبريسو.',
      picks: ['ghamqa', 'brazil-dark', 'espresso'] },
    { id: 'special', title: 'مميزة ومختلفة',
      desc: 'أصناف من أصول مختلفة لو عايز تجرب حاجة جديدة.',
      picks: ['habashi', 'brazil', 'colombia'] },
  ];

  // مشاركة الداتا والدوال مع app.jsx (React) — الطريقة الوحيدة للمشاركة
  window.QAIEM = { WHATSAPP, STORE_NAME, WEIGHTS, BEAN_FAMILIES, BULK, DRINKS, HERBAL, fmt, money, norm };

  /* ============ 3. NAVIGATION ============ */
  function initNavigation() {
    const header = $('#header');
    if (!header) return;

    const burger = $('#burger');
    const links = $$('#nav a');
    const bar = $('.scroll-progress', header);
    const toTop = $('#toTop');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* --- قائمة الموبايل: فتح/قفل --- */
    const setMenu = (open) => {
      header.classList.toggle('open', open);
      if (!burger) return;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    };
    burger?.addEventListener('click', () => setMenu(!header.classList.contains('open')));
    links.forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', (e) => { if (!header.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

    /* --- الأقسام اللي في القائمة (بنفس ترتيب الصفحة) --- */
    const targets = links
      .map((a) => ({ a, s: document.getElementById((a.getAttribute('href') || '').slice(1)) }))
      .filter((t) => t.s);

    /* --- تحديث الحالة مع السكرول: اللينك النشط + الشريط + زر الأعلى --- */
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;

      header.classList.toggle('scrolled', y > 10);
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      toTop?.classList.toggle('show', y > 700);

      // آخر قسم عدّى خط القراءة هو النشط
      const line = header.offsetHeight + window.innerHeight * 0.25;
      let current = targets[0];
      for (const t of targets) {
        if (t.s.getBoundingClientRect().top <= line) current = t;
      }
      // لو وصلنا لآخر الصفحة نخلي آخر لينك هو النشط
      if (max > 0 && y >= max - 4) current = targets[targets.length - 1];

      targets.forEach((t) => {
        const on = t === current;
        t.a.classList.toggle('active', on);
        if (on) t.a.setAttribute('aria-current', 'true'); else t.a.removeAttribute('aria-current');
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', update);
    update();

    toTop?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });

    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function initReveals() {
    const targets = $$('.reveal');
    if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    targets.forEach((t) => io.observe(t));
  }

  /* ============ 4. COUNTERS ============ */
  function initCounters() {
    const nums = $$('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const node = e.target;
        const end = Number(node.dataset.count);
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min((t - t0) / 1200, 1);
          node.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(node);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => { n.textContent = fmt(0); io.observe(n); });
  }

  /* ============ 5. HOME SECTIONS ============ */
  // أقل سعر ثمن في المنيو (لستيكر الهيرو)
  function initMinPrice() {
    const min = Math.min(...BEAN_FAMILIES.flatMap((f) => f.items.map((i) => i.p[0])));
    $$('[data-min-price]').forEach((n) => { n.textContent = fmt(min); });
  }

  function initFeatured() {
    const grid = $('#featured-grid');
    if (!grid) return;
    ['sharqi', 'makhsous', 'qaiem', 'aseel'].forEach((id) => {
      const f = BEAN_FAMILIES.find((x) => x.id === id);
      if (!f) return;
      const from = Math.min(...f.items.map((i) => i.p[0]));
      grid.append(el('article', { class: 'blend reveal' },
        el('h3', { text: f.name }),
        el('span', { class: 'badge', text: f.roast || 'سادة / محوج' }),
        el('p', { class: 'blend-price' }, 'الثمن يبدأ من ', el('strong', { text: money(from) })),
        el('a', { href: `#bean-${f.id}`, text: 'شوف كل الأوزان ←' })));
    });
  }

  function initGuide() {
    const moodsEl = $('#moods');
    const result = $('#mood-result');
    if (!moodsEl || !result) return;

    const select = (id) => {
      $$('.mood', moodsEl).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.id === id)));
      const m = MOODS.find((x) => x.id === id);
      result.replaceChildren(
        el('p', { class: 'mood-desc', text: m.desc }),
        el('div', { class: 'mood-picks' }, m.picks.map((pid) => {
          const f = BEAN_FAMILIES.find((x) => x.id === pid);
          return el('div', { class: 'pick' },
            el('h4', { text: f.name }),
            el('small', { text: f.roast || 'تحميص متوسط' }),
            el('p', { text: `الربع بـ ${money(Math.min(...f.items.map((i) => i.p[1])))}` }),
            el('a', { href: `#bean-${f.id}`, text: 'شوف الأسعار ←' }));
        })));
    };

    MOODS.forEach((m) => moodsEl.append(el('button', {
      class: 'mood', type: 'button', role: 'tab', 'data-id': m.id, text: m.title, onclick: () => select(m.id),
    })));
    select(MOODS[0].id);
  }

  /* ============ 5.1 DEEP LINKS ============ */
  // أي لينك href="#bean-<id>" بيفتح تاب البن ويروح لكارت الصنف.
  // الشغل الفعلي بيتم في app.jsx (React) عن طريق الحدث ده.
  function initDeepLinks() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#bean-"]');
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      history.pushState(null, '', `#${id}`);
      window.dispatchEvent(new CustomEvent('qaiem:goto', { detail: { id } }));
    });
  }

  /* ============ 6. BOOT ============ */
  document.addEventListener('DOMContentLoaded', () => {
    initDeepLinks();
    initNavigation();
    initMinPrice();
    initFeatured();
    initGuide();
    initCounters();
    initReveals();
  });
})();