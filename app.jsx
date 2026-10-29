/* =====================================================
   بن قيّم — app.jsx (React)
   المنيو + سلة الطلب + إرسال واتساب
   كل حاجة جوه IIFE (مفيش تعارض مع script.js)،
   والداتا بتيجي من window.QAIEM.
   ===================================================== */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const { WHATSAPP, STORE_NAME, WEIGHTS, BEAN_FAMILIES, BULK, DRINKS, HERBAL, fmt, money, norm } = window.QAIEM;

  const STORAGE_KEY = 'qaiem-cart-v1';
  const VARIANTS = [
    { id: 'all', title: 'الكل' },
    { id: 'سادة', title: 'سادة' },
    { id: 'محوج', title: 'محوج' },
  ];

  /* ============ 1. HELPERS ============ */
  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(raw)
        ? raw.filter((i) => i && typeof i.key === 'string' && typeof i.name === 'string' &&
            Number.isFinite(i.price) && Number.isInteger(i.qty) && i.qty > 0)
        : [];
    } catch (e) { return []; }
  }

  function buildMessage(items) {
    const lines = items.map((i) =>
      `• ${i.name}${i.label ? ` (${i.label})` : ''} × ${i.qty} = ${i.qty * i.price} ج`);
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    return `السلام عليكم، عايز أطلب من ${STORE_NAME}:\n${lines.join('\n')}\n\nالإجمالي: ${total} ج`;
  }

  // درجة التحميص -> كلاس لون الكارت (فاتح = تان، غامق = بني، غير كده = تيل)
  function roastClass(roast) {
    if (!roast) return 'roast-classic';
    if (roast.includes('غامق')) return 'roast-dark';
    if (roast.includes('فاتح')) return 'roast-light';
    return 'roast-classic';
  }

  /* ============ 2. COMPONENTS ============ */
  function PriceButton({ label, price, aria, onAdd }) {
    const [added, setAdded] = useState(false);
    const timer = useRef();
    useEffect(() => () => clearTimeout(timer.current), []);

    const handleClick = () => {
      onAdd();
      setAdded(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setAdded(false), 450);
    };

    return (
      <button type="button" className={`price-btn${added ? ' added' : ''}`} aria-label={aria} onClick={handleClick}>
        {label ? <span className="pb-label">{label}</span> : null}
        <span className="pb-price">{fmt(price)}</span>
      </button>
    );
  }

  function WeightPrices({ name, prices, onAdd }) {
    return (
      <div className="prices">
        {WEIGHTS.map((w, i) => (
          <PriceButton
            key={w.key}
            label={w.label}
            price={prices[i]}
            aria={`أضف ${name} ${w.label} بسعر ${prices[i]} جنيه`}
            onAdd={() => onAdd({ key: `${name}|${w.key}`, name, label: w.label, price: prices[i] })}
          />
        ))}
      </div>
    );
  }

  function FamilyCard({ family, variant, onAdd }) {
    const items = variant === 'all' ? family.items : family.items.filter((it) => it.v === variant);
    return (
      <article id={`bean-${family.id}`} className={`card family ${roastClass(family.roast)}`}>
        <header className="card-tab">
          <h3>{family.name}</h3>
          {family.roast ? <span className="badge">{family.roast}</span> : null}
        </header>
        {items.map((it) => (
          <div className="variant" key={it.v || 'default'}>
            {it.v ? <div className="variant-name">{it.v}</div> : null}
            <WeightPrices name={`${family.name} ${it.v}`.trim()} prices={it.p} onAdd={onAdd} />
          </div>
        ))}
      </article>
    );
  }

  function BulkCard({ item, onAdd }) {
    return (
      <article className="card family">
        <header className="card-tab"><h3>{item.name}</h3></header>
        <div className="variant">
          {item.note ? <p className="item-note">{item.note}</p> : null}
          <WeightPrices name={item.name} prices={item.p} onAdd={onAdd} />
        </div>
      </article>
    );
  }

  function ListCard({ title, rows, onAdd }) {
    return (
      <article className="card list-card">
        <header className="card-tab"><h3>{title}</h3></header>
        <ul>
          {rows.map((d) => (
            <li className="drink-row" key={d.name}>
              <span className="dr-name">{d.name}</span>
              <span className="dr-dots" aria-hidden="true"></span>
              {d.options.map((o) => {
                const full = o.label ? `${d.name} ${o.label}` : d.name;
                return (
                  <PriceButton
                    key={full}
                    label={o.label}
                    price={o.price}
                    aria={`أضف ${full} بسعر ${o.price} جنيه`}
                    onAdd={() => onAdd({ key: `${full}|cup`, name: d.name, label: o.label, price: o.price })}
                  />
                );
              })}
            </li>
          ))}
        </ul>
      </article>
    );
  }

  /* أقسام المنيو: كل قسم بيرجّع JSX (أو null لو مفيش نتيجة) */
  const SECTIONS = [
    { id: 'beans', title: 'أسعار البن', render: (q, onAdd, variant) => {
        const rows = BEAN_FAMILIES.filter((f) => {
          const matchQ = !q || norm([f.name, f.roast, ...f.items.map((i) => i.v)].join(' ')).includes(q);
          const matchV = variant === 'all' || f.items.some((i) => i.v === variant);
          return matchQ && matchV;
        });
        return rows.length
          ? <div className="menu-grid">{rows.map((f) => <FamilyCard key={f.id} family={f} variant={variant} onAdd={onAdd} />)}</div>
          : null;
    } },
    { id: 'drinks', title: 'المشروبات', render: (q, onAdd) => {
        const rows = DRINKS.filter((d) => !q || norm(d.name).includes(q));
        return rows.length
          ? <div className="menu-grid"><ListCard title="المشروبات" rows={rows} onAdd={onAdd} /></div>
          : null;
    } },
    { id: 'herbal', title: 'شاي وأعشاب', render: (q, onAdd) => {
        const rows = HERBAL.filter((d) => !q || norm(d.name).includes(q));
        return rows.length
          ? <div className="menu-grid"><ListCard title="شاي وأعشاب" rows={rows} onAdd={onAdd} /></div>
          : null;
    } },
    { id: 'bulk', title: 'منتجات بالوزن', render: (q, onAdd) => {
        const rows = BULK.filter((b) => !q || norm(`${b.name} ${b.note || ''}`).includes(q));
        return rows.length
          ? <div className="menu-grid">{rows.map((b) => <BulkCard key={b.name} item={b} onAdd={onAdd} />)}</div>
          : null;
    } },
  ];

  function Menu({ onAdd }) {
    const fromHash = () => {
      const h = location.hash.slice(1);
      return SECTIONS.some((s) => s.id === h) ? h : 'beans';
    };
    const [active, setActive] = useState(fromHash);
    const [variant, setVariant] = useState('all');
    const [rawQuery, setRawQuery] = useState('');
    const [focus, setFocus] = useState(null); // { id, n } — الكارت المطلوب الوصول له
    const query = norm(rawQuery);

    // نفتح تاب البن، نشيل البحث والفلتر (عشان الكارت يكون ظاهر)، ونطلب السكرول
    const goToBean = (id) => {
      setActive('beans');
      setVariant('all');
      setRawQuery('');
      setFocus({ id, n: Date.now() });
    };

    useEffect(() => {
      // لينك من الصفحة (كروت التوليفات / اختار قهوتك)
      const onGoto = (e) => goToBean(e.detail.id);
      // تغيير الهاش (#drinks أو #bean-xxx) من زر الرجوع مثلًا
      const onHash = () => {
        const h = location.hash.slice(1);
        if (h.startsWith('bean-')) goToBean(h);
        else if (SECTIONS.some((s) => s.id === h)) setActive(h);
      };
      window.addEventListener('qaiem:goto', onGoto);
      window.addEventListener('hashchange', onHash);
      // لو الصفحة اتفتحت برابط مباشر لصنف
      if (location.hash.startsWith('#bean-')) goToBean(location.hash.slice(1));
      return () => {
        window.removeEventListener('qaiem:goto', onGoto);
        window.removeEventListener('hashchange', onHash);
      };
    }, []);

    // بعد ما الـ DOM يتحدّث: سكرول للكارت + وميض
    useEffect(() => {
      if (!focus) return;
      const node = document.getElementById(focus.id);
      if (!node) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      node.classList.remove('flash');
      void node.offsetWidth;
      node.classList.add('flash');
      const t = setTimeout(() => node.classList.remove('flash'), 2200);
      return () => clearTimeout(t);
    }, [focus]);

    const pickTab = (id) => {
      setActive(id);
      history.replaceState(null, '', `#${id}`);
    };

    const visible = query ? SECTIONS : SECTIONS.filter((s) => s.id === active);
    const blocks = visible
      .map((s) => ({ s, node: s.render(query, onAdd, variant) }))
      .filter((b) => b.node);

    const showVariants = !query && active === 'beans';

    return (
      <>
        <div className="toolbar">
          <div className="toolbar-inner">
            <div className={`tabs${query ? ' searching' : ''}`} role="tablist" aria-label="أقسام المنيو">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={s.id === active}
                  className={`tab${s.id === active ? ' active' : ''}`}
                  onClick={() => pickTab(s.id)}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <label className="search">
              <span className="sr-only">ابحث في المنيو</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="search"
                placeholder="ابحث عن نوع بن أو مشروب..."
                autoComplete="off"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
              />
              {rawQuery ? (
                <button type="button" aria-label="مسح البحث" onClick={() => setRawQuery('')}>✕</button>
              ) : null}
            </label>

            {showVariants && (
              <div className="tabs variants" role="group" aria-label="نوع التحويج">
                {VARIANTS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`tab${variant === v.id ? ' active' : ''}`}
                    aria-pressed={variant === v.id}
                    onClick={() => setVariant(v.id)}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="menu-hint">
          الأوزان: ثمن = ١٢٥ جم • ربع = ٢٥٠ جم • نص = ٥٠٠ جم • كيلو = ١٠٠٠ جم
        </p>

        <div aria-live="polite">
          {blocks.length === 0 && <p className="no-results">مفيش نتيجة بالاسم ده.. جرّب كلمة تانية 🔎</p>}
          {blocks.map(({ s, node }) => (
            <React.Fragment key={s.id}>
              {query ? <h3 className="results-title">{s.title}</h3> : null}
              {node}
            </React.Fragment>
          ))}
        </div>
      </>
    );
  }

  /* ============ 3. CART ============ */
  function CartDrawer({ open, items, total, onClose, onChange, onClear }) {
    const empty = items.length === 0;
    const href = empty ? '#' : `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildMessage(items))}`;

    const handleClear = () => {
      if (window.confirm('تفريغ السلة بالكامل؟')) onClear();
    };

    return (
      <>
        <div className={`cart-overlay${open ? ' show' : ''}`} onClick={onClose}></div>
        <aside className={`cart${open ? ' show' : ''}`} aria-label="سلة الطلب" aria-hidden={!open}>
          <div className="cart-head">
            <h3>طلبك</h3>
            <button type="button" className="cart-close" aria-label="إغلاق السلة" onClick={onClose}>✕</button>
          </div>

          {empty ? (
            <div className="cart-empty">السلة فاضية.. اختار من المنيو وضيف طلبك ☕</div>
          ) : (
            <ul className="cart-list">
              {items.map((i) => (
                <li className="cart-item" key={i.key}>
                  <div className="ci-name">
                    {i.name}{i.label ? <small>{i.label}</small> : null}
                  </div>
                  <div className="ci-price">{money(i.qty * i.price)}</div>
                  <div className="qty">
                    <button type="button" aria-label="زيادة" onClick={() => onChange(i.key, 1)}>+</button>
                    <span>{fmt(i.qty)}</span>
                    <button type="button" aria-label="تقليل" onClick={() => onChange(i.key, -1)}>−</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="cart-foot">
            <div className="cart-total">
              <span>الإجمالي</span>
              <strong>{money(total)}</strong>
            </div>
            <a
              className="btn btn-primary"
              href={href}
              target="_blank"
              rel="noopener"
              aria-disabled={empty}
              tabIndex={empty ? -1 : 0}
              onClick={(e) => { if (empty) e.preventDefault(); else setTimeout(onClose, 300); }}
            >
              ابعت الطلب على واتساب
            </a>
            {!empty && <button type="button" className="btn-link" onClick={handleClear}>تفريغ السلة</button>}
            <p className="cart-note">الأسعار حسب المنيو وممكن تتغير.</p>
          </div>
        </aside>
      </>
    );
  }

  /* ============ 4. APP ============ */
  function App() {
    const [items, setItems] = useState(loadCart);
    const [open, setOpen] = useState(false);
    const [toast, setToast] = useState('');
    const toastTimer = useRef();

    const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
    const total = useMemo(() => items.reduce((s, i) => s + i.qty * i.price, 0), [items]);

    // حفظ السلة
    useEffect(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
    }, [items]);

    // ربط زر السلة في الهيدر
    useEffect(() => {
      const btns = [...document.querySelectorAll('[data-open-cart]')];
      const openCart = () => setOpen(true);
      btns.forEach((b) => b.addEventListener('click', openCart));
      return () => btns.forEach((b) => b.removeEventListener('click', openCart));
    }, []);

    // تحديث عداد الهيدر
    useEffect(() => {
      document.querySelectorAll('.cart-count').forEach((b) => {
        b.textContent = fmt(count);
        b.dataset.zero = String(count === 0);
      });
    }, [count]);

    // Escape يقفل السلة + منع سكرول الصفحة والسلة مفتوحة
    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
      document.body.style.overflow = open ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }, [open]);

    const showToast = (msg) => {
      setToast(msg);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(''), 1800);
    };

    const addItem = (item) => {
      setItems((prev) => {
        const found = prev.find((i) => i.key === item.key);
        return found
          ? prev.map((i) => (i.key === item.key ? { ...i, qty: i.qty + 1 } : i))
          : [...prev, { ...item, qty: 1 }];
      });
      showToast(`تمت الإضافة: ${item.name}${item.label ? ' — ' + item.label : ''}`);

      const cb = document.querySelector('.cart-btn');
      if (cb) { cb.classList.remove('bump'); void cb.offsetWidth; cb.classList.add('bump'); }
    };

    const changeQty = (key, delta) => {
      setItems((prev) => prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0));
    };

    return (
      <>
        <Menu onAdd={addItem} />

        {ReactDOM.createPortal(
          <>
            <CartDrawer
              open={open}
              items={items}
              total={total}
              onClose={() => setOpen(false)}
              onChange={changeQty}
              onClear={() => setItems([])}
            />
            <div className={`toast${toast ? ' show' : ''}`} role="status">{toast}</div>
          </>,
          document.body
        )}
      </>
    );
  }

  /* ============ 5. MOUNT ============ */
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();