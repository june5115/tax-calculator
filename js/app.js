(function () {
  'use strict';

  // ========================
  // STATE
  // ========================
  const state = {
    mode: 'inclusive',  // 'inclusive' = 税込み計算, 'exclusive' = 税抜き計算
    rate: 0.08,
    amount: 0
  };

  // ========================
  // DOM ELEMENTS
  // ========================
  const el = {
    amountInput: document.getElementById('amountInput'),
    inputLabel: document.getElementById('inputLabel'),
    clearBtn: document.getElementById('clearBtn'),
    resultLabel: document.getElementById('resultLabel'),
    resultValue: document.getElementById('resultValue'),
    breakdownOrigLabel: document.getElementById('breakdownOrigLabel'),
    breakdownOrig: document.getElementById('breakdownOrig'),
    breakdownTax: document.getElementById('breakdownTax'),
    resultSection: document.getElementById('resultSection'),
    copyBtn: document.getElementById('copyBtn'),
    installBtn: document.getElementById('installBtn'),
    toast: document.getElementById('toast'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    rateBtns: document.querySelectorAll('.rate-btn')
  };

  // ========================
  // FORMATTING
  // ========================
  function formatNumber(num) {
    return Math.floor(num).toLocaleString('ja-JP');
  }

  // ========================
  // CALCULATION
  // ========================
  function calculate() {
    var amount = state.amount;
    if (amount === 0) {
      return { result: 0, tax: 0, original: 0 };
    }

    if (state.mode === 'inclusive') {
      // 税抜き価格 → 税込み価格
      var tax = Math.floor(amount * state.rate);
      return { result: amount + tax, tax: tax, original: amount };
    } else {
      // 税込み価格 → 税抜き価格
      var base = Math.ceil(amount / (1 + state.rate));
      var taxAmount = amount - base;
      return { result: base, tax: taxAmount, original: amount };
    }
  }

  // ========================
  // UI UPDATE
  // ========================
  function updateUI() {
    var calc = calculate();

    el.resultValue.textContent = formatNumber(calc.result);
    el.breakdownOrig.textContent = '¥' + formatNumber(calc.original);
    el.breakdownTax.textContent = '¥' + formatNumber(calc.tax);

    if (state.mode === 'inclusive') {
      el.inputLabel.textContent = '税抜価格を入力';
      el.resultLabel.textContent = '税込価格';
      el.breakdownOrigLabel.textContent = '本体価格';
    } else {
      el.inputLabel.textContent = '税込価格を入力';
      el.resultLabel.textContent = '税抜価格';
      el.breakdownOrigLabel.textContent = '税込価格';
    }

    el.clearBtn.hidden = state.amount === 0;

    // Trigger pop animation
    el.resultSection.classList.remove('updated');
    // Force reflow
    void el.resultSection.offsetWidth;
    el.resultSection.classList.add('updated');
  }

  // ========================
  // INPUT HANDLING
  // ========================
  el.amountInput.addEventListener('input', function (e) {
    var raw = e.target.value.replace(/[^0-9]/g, '');
    state.amount = parseInt(raw, 10) || 0;

    if (raw) {
      var formatted = formatNumber(state.amount);
      var cursorPos = e.target.selectionStart;
      var lenBefore = e.target.value.length;
      e.target.value = formatted;
      var lenAfter = e.target.value.length;
      var newCursor = cursorPos + (lenAfter - lenBefore);
      e.target.setSelectionRange(
        Math.max(0, newCursor),
        Math.max(0, newCursor)
      );
    }

    updateUI();
  });

  // ========================
  // CLEAR
  // ========================
  el.clearBtn.addEventListener('click', function () {
    state.amount = 0;
    el.amountInput.value = '';
    el.amountInput.focus();
    updateUI();
  });

  // ========================
  // MODE TOGGLE
  // ========================
  el.modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      el.modeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      document.body.dataset.mode = state.mode;
      updateUI();
    });
  });

  // ========================
  // RATE TOGGLE
  // ========================
  el.rateBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      el.rateBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.rate = parseFloat(btn.dataset.rate);
      updateUI();
    });
  });

  // ========================
  // COPY TO CLIPBOARD
  // ========================
  el.copyBtn.addEventListener('click', function () {
    var calc = calculate();
    var text = calc.result.toString();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast('コピーしました！');
      });
    } else {
      var textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('コピーしました！');
    }
  });

  // ========================
  // TOAST
  // ========================
  var toastTimer = null;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('show');
    }, 2000);
  }

  // ========================
  // PWA INSTALL
  // ========================
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    el.installBtn.hidden = false;
  });

  el.installBtn.addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (choice.outcome === 'accepted') {
        el.installBtn.hidden = true;
      }
      deferredPrompt = null;
    });
  });

  // ========================
  // SERVICE WORKER
  // ========================
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  }

  // ========================
  // INIT
  // ========================
  document.body.dataset.mode = state.mode;
  updateUI();
})();
