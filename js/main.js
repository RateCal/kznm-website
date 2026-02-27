/**
 * 京華風の芽 - メインJS
 */

// ==================== スクロール時のヘッダースタイル ====================
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ==================== モバイルメニュー ====================
const menuToggle = document.getElementById('menu-toggle');
const globalNav  = document.getElementById('global-nav');

if (menuToggle && globalNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.classList.toggle('open');
    globalNav.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });

  // ナビリンクをクリックでメニューを閉じる
  globalNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      globalNav.classList.remove('open');
    });
  });

  // メニュー外をクリックで閉じる
  document.addEventListener('click', e => {
    if (!header.contains(e.target)) {
      menuToggle.classList.remove('open');
      globalNav.classList.remove('open');
    }
  });
}

// ==================== スクロールアニメーション（Intersection Observer） ====================
const fadeEls = document.querySelectorAll('.fade-in');

if (fadeEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // 少しずつ遅延をつけてアニメーション
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  fadeEls.forEach(el => observer.observe(el));
}

// ==================== お問い合わせフォーム（デモ用） ====================
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();

    // 必須項目チェック
    const required = contactForm.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      if (field.type === 'checkbox') {
        field.closest('.form-group') || field.parentElement;
        if (!field.checked) { valid = false; field.style.outline = '2px solid #c0392b'; }
        else { field.style.outline = ''; }
      } else {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = '#c0392b';
        } else {
          field.style.borderColor = '';
        }
      }
    });

    if (!valid) {
      alert('必須項目をすべて入力してください。');
      return;
    }

    /*
     * ▼ 実際の送信処理はここに実装してください ▼
     *
     * 例）Formspree を使う場合:
     *   fetch('https://formspree.io/f/YOUR_FORM_ID', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
     *   }).then(...);
     *
     * 例）Netlify Forms を使う場合:
     *   フォームに data-netlify="true" を追加するだけで動作します。
     */

    // デモ用：送信成功表示
    contactForm.style.display = 'none';
    const successMsg = document.getElementById('form-success');
    if (successMsg) successMsg.style.display = 'block';
  });
}

// ==================== スムーススクロール（# リンク） ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
