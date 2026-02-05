(() => {
  const root = document.querySelector('.cod-form');
  if (!root) return;

  const formSlug = root.dataset.formSlug;
  const variantId = root.dataset.variantId;
  const productPrice = Number(root.dataset.productPrice || '0');
  const locale = root.dataset.locale || 'fr';
  const shop = root.dataset.shop || '';

  const i18n = {
    ar: {
      title: 'إستمارة الدفع عند الإستلام',
      fullName: 'الاسم الكامل',
      phone: 'رقم الهاتف',
      wilaya: 'الولاية',
      baladiya: 'البلدية',
      address: 'العنوان',
      notes: 'ملاحظات (اختياري)',
      qty: 'الكمية',
      shipping: 'خيارات التوصيل',
      standard: 'عادي',
      express: 'سريع',
      daysStandard: '5-7 أيام',
      daysExpress: '2-3 أيام',
      priceSummary: 'ملخص السعر',
      productPrice: 'سعر المنتج',
      deliveryPrice: 'سعر التوصيل',
      discount: 'الخصم',
      total: 'المجموع',
      buyNow: 'إشتري الآن',
      success: 'تم إرسال الطلب بنجاح. سنتصل بك للتأكيد.',
      invalidPhone: 'رقم الهاتف يبدو غير صحيح (يبدأ بـ 05/06/07).',
      free: 'بالـمجّان'
    },
    fr: {
      title: 'Formulaire de paiement à la livraison',
      fullName: 'Nom complet',
      phone: 'Téléphone',
      wilaya: 'Wilaya',
      baladiya: 'Baladiya/Commune',
      address: 'Adresse',
      notes: 'Notes (optionnel)',
      qty: 'Quantité',
      shipping: 'Livraison',
      standard: 'Standard',
      express: 'Express',
      daysStandard: '5-7 jours',
      daysExpress: '2-3 jours',
      priceSummary: 'Récapitulatif',
      productPrice: 'Prix du produit',
      deliveryPrice: 'Prix de livraison',
      discount: 'Remise',
      total: 'Total',
      buyNow: 'Acheter maintenant',
      success: 'Commande envoyée. Nous vous contacterons pour confirmer.',
      invalidPhone: 'Le numéro semble invalide (05/06/07).',
      free: 'Gratuit'
    }
  };

  const state = {
    language: locale.startsWith('ar') ? 'ar' : 'fr',
    quantity: 1,
    shipping: 'standard',
    settings: null,
    locations: []
  };

  function money(amount) {
    return `${Math.max(0, amount)} DZD`;
  }

  function calcTotals() {
    const deliveryPrice =
      state.shipping === 'express'
        ? state.settings.shipping.express.price
        : state.settings.shipping.standard.price;
    const discount = state.settings.discount.enabled
      ? state.settings.discount.amount
      : 0;
    const total = productPrice * state.quantity + deliveryPrice - discount;
    return { deliveryPrice, discount, total };
  }

  function render() {
    const t = i18n[state.language];
    const { deliveryPrice, discount, total } = calcTotals();
    const rtlEnabled = state.settings.rtl ?? true;
    const dir = state.language === 'ar' && rtlEnabled ? 'rtl' : 'ltr';
    const req = state.settings.requiredFields || {};

    root.innerHTML = `
      <div class="cod-wrap" dir="${dir}">
        <div class="cod-header">
          <strong>${t.title}</strong>
          <div class="cod-lang-toggle">
            <button data-lang="ar" class="${state.language === 'ar' ? 'active' : ''}">AR</button>
            <button data-lang="fr" class="${state.language === 'fr' ? 'active' : ''}">FR</button>
          </div>
        </div>
        <div class="cod-summary">
          <div class="cod-summary-row">
            <span class="cod-summary-label">💰 ${t.productPrice}</span>
            <span class="cod-summary-value">${money(productPrice * state.quantity)}</span>
          </div>
          <div class="cod-summary-row">
            <span class="cod-summary-label">🚚 ${t.deliveryPrice}</span>
            <span class="cod-summary-value">${deliveryPrice === 0 ? t.free : money(deliveryPrice)}</span>
          </div>
          <div class="cod-summary-row">
            <span class="cod-summary-label">🎁 ${t.discount}</span>
            <span class="cod-summary-value cod-summary-discount">-${money(discount)}</span>
          </div>
          <div class="cod-summary-row">
            <span class="cod-summary-label">🧾 ${t.total}</span>
            <span class="cod-summary-value">${money(total)}</span>
          </div>
        </div>
        <div class="cod-error" style="display:none;"></div>
        <div class="cod-success" style="display:none;"></div>
        <div class="cod-input cod-icon cod-icon--user">
          <label>${t.fullName}</label>
          <input type="text" name="name" ${req.name ? 'required' : ''} />
        </div>
        <div class="cod-input cod-icon cod-icon--phone">
          <label>${t.phone}</label>
          <input type="tel" name="phone" ${req.phone ? 'required' : ''} placeholder="05xxxxxxxx" />
          <div class="cod-note" data-phone-note></div>
        </div>
        <div class="cod-input cod-icon cod-icon--pin">
          <label>${t.wilaya}</label>
          <select name="wilaya" ${req.wilaya ? 'required' : ''}></select>
        </div>
        <div class="cod-input cod-icon cod-icon--building">
          <label>${t.baladiya}</label>
          <select name="baladiya" ${req.baladiya ? 'required' : ''}></select>
        </div>
        <div class="cod-input cod-icon cod-icon--home">
          <label>${t.address}</label>
          <input type="text" name="address" ${req.address ? 'required' : ''} />
        </div>
        <div class="cod-input">
          <label>${t.notes}</label>
          <textarea name="notes" rows="2"></textarea>
        </div>
        <div class="cod-qty">
          <label>${t.qty}</label>
          <button type="button" data-qty="-">-</button>
          <span data-qty-value>${state.quantity}</span>
          <button type="button" data-qty="+">+</button>
        </div>
        <div class="cod-shipping">
          <div>${t.shipping}</div>
          <div class="cod-shipping-option ${state.shipping === 'standard' ? 'active' : ''}" data-ship="standard">
            <span>🚚 ${t.standard} (${t.daysStandard})</span>
            <strong>${money(state.settings.shipping.standard.price)}</strong>
          </div>
          ${
            state.settings.shipping.enableExpress
              ? `<div class="cod-shipping-option ${state.shipping === 'express' ? 'active' : ''}" data-ship="express">
                <span>⚡ ${t.express} (${t.daysExpress})</span>
                <strong>${money(state.settings.shipping.express.price)}</strong>
              </div>`
              : ''
          }
        </div>
        <button class="cod-submit" data-submit>${t.buyNow}</button>
        <div class="cod-sticky-cta">
          <button class="cod-submit" data-submit>${t.buyNow}</button>
        </div>
      </div>
    `;

    root.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.language = btn.getAttribute('data-lang');
        render();
      });
    });

    root.querySelectorAll('[data-qty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = btn.getAttribute('data-qty') === '+' ? 1 : -1;
        state.quantity = Math.max(1, state.quantity + delta);
        render();
      });
    });

    root.querySelectorAll('[data-ship]').forEach((row) => {
      row.addEventListener('click', () => {
        state.shipping = row.getAttribute('data-ship');
        render();
      });
    });

    const wilayaSelect = root.querySelector('select[name="wilaya"]');
    const baladiyaSelect = root.querySelector('select[name="baladiya"]');

    wilayaSelect.innerHTML = state.locations
      .map((w, idx) => `<option value="${w.name}" ${idx === 0 ? 'selected' : ''}>${w.name}</option>`)
      .join('');

    function updateBaladiya() {
      const selected = state.locations.find((w) => w.name === wilayaSelect.value);
      const list = selected ? selected.baladiyas : [];
      baladiyaSelect.innerHTML = list.map((b) => `<option value="${b}">${b}</option>`).join('');
    }
    wilayaSelect.addEventListener('change', updateBaladiya);
    updateBaladiya();

    const phoneInput = root.querySelector('input[name="phone"]');
    const phoneNote = root.querySelector('[data-phone-note]');
    phoneInput.addEventListener('input', () => {
      const v = phoneInput.value.trim();
      if (v && !/^0[5-7]/.test(v)) {
        phoneNote.textContent = t.invalidPhone;
      } else {
        phoneNote.textContent = '';
      }
    });

    root.querySelectorAll('[data-submit]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const errorBox = root.querySelector('.cod-error');
        const successBox = root.querySelector('.cod-success');
        errorBox.style.display = 'none';
        successBox.style.display = 'none';

        const totals = calcTotals();
        const payload = {
          formId: state.settings.id,
          variantId,
          quantity: state.quantity,
          name: root.querySelector('input[name="name"]').value.trim(),
          phone: phoneInput.value.trim(),
          wilaya: wilayaSelect.value,
          baladiya: baladiyaSelect.value,
          address: root.querySelector('input[name="address"]').value.trim(),
          notes: root.querySelector('textarea[name="notes"]').value.trim(),
          shippingOption: state.shipping,
          productPrice,
          deliveryPrice: totals.deliveryPrice,
          discountAmount: totals.discount,
          locale: state.language
        };

        const req = state.settings.requiredFields || {};
        if (
          (req.name && !payload.name) ||
          (req.phone && !payload.phone) ||
          (req.wilaya && !payload.wilaya) ||
          (req.baladiya && !payload.baladiya) ||
          (req.address && !payload.address)
        ) {
          errorBox.textContent = 'Please fill all required fields.';
          errorBox.style.display = 'block';
          return;
        }

        try {
          const res = await fetch(`/apps/cod/submit?shop=${encodeURIComponent(shop)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.message || 'Submit failed');
          fetch(`/apps/cod/track?shop=${encodeURIComponent(shop)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ formId: state.settings.id, type: 'submit' })
          }).catch(() => {});
          successBox.textContent = state.settings.successMessage?.[state.language] || t.success;
          successBox.style.display = 'block';
        } catch (err) {
          errorBox.textContent = err.message || 'Submit failed';
          errorBox.style.display = 'block';
        }
      });
    });
  }

  async function init() {
    try {
      const [formRes, locRes] = await Promise.all([
        fetch(`/apps/cod/form?slug=${encodeURIComponent(formSlug)}&shop=${encodeURIComponent(shop)}`),
        fetch(`/apps/cod/locations?shop=${encodeURIComponent(shop)}`)
      ]);
      const formData = await formRes.json();
      const locData = await locRes.json();
      if (!formData.ok) throw new Error(formData.message || 'Form missing');
      state.settings = { id: formData.form.id, ...formData.form.settings };
      const defLang = state.settings.defaultLanguage || 'fr';
      state.language = locale.startsWith('ar') ? 'ar' : defLang;
      state.locations = locData.locations || [];
      fetch(`/apps/cod/track?shop=${encodeURIComponent(shop)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: state.settings.id, type: 'view' })
      }).catch(() => {});
      if (state.settings.tokens?.accent) {
        root.style.setProperty('--cod-accent', state.settings.tokens.accent);
      }
      if (state.settings.tokens?.radius) {
        root.style.setProperty('--cod-radius', `${state.settings.tokens.radius}px`);
      }
      render();
    } catch (err) {
      root.innerHTML = `<div class="cod-error">${err.message || 'Failed to load form'}</div>`;
    }
  }

  init();
})();
