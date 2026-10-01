(function () {
  // scroll reveal — fail-safe: the hidden state is only ever added here, only
  // below the fold, and is force-cleared by a timeout, so content can never
  // stay invisible if the observer misbehaves (or never fires).
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.remove('pre'); io.unobserve(en.target); }
      });
    }, { threshold: .12 });
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight * .85) {
        el.classList.add('pre');
        io.observe(el);
      }
    });
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.remove('pre'); });
    }, 2500);
  }

  var form = document.getElementById('city-list-form');
  if (!form) return;
  var errorLine = document.getElementById('form-error');
  var confirmation = document.getElementById('form-confirmation');

  var ENDPOINT = 'https://formspree.io/f/mkodbzej';
  var PROGRESS_ENDPOINT = 'https://radar.rarecompany.co.uk/api/inbound/application-progress';
  var NETWORK_MSG = 'Something went wrong sending your application. Please try again, or email hello@rarecompany.co.uk.';

  var pages = [].slice.call(form.querySelectorAll('.form-page'));
  var backBtn = document.getElementById('form-back');
  var nextBtn = document.getElementById('form-next');
  var submitBtn = document.getElementById('form-submit');
  var progressEl = document.getElementById('form-progress');
  var TOTAL = pages.length;
  var current = 1;

  /* Progress mirrors into Rare Radar per page; fire-and-forget. Lander keys
     are separate from the main /apply form so the two never fight, and the
     city prefill is never overwritten by restore. */
  function sessionId() {
    try {
      var s = localStorage.getItem('rc_lander_session');
      if (!s) {
        s = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
          : ('a0' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2, 10));
        localStorage.setItem('rc_lander_session', s);
      }
      return s;
    } catch (e) { return 'a0' + Date.now().toString(16); }
  }
  function payload() {
    var p = {};
    new FormData(form).forEach(function (v, k) {
      if (k === 'motivation') { (p.motivations = p.motivations || []).push(v); }
      else { p[k] = v; }
    });
    return p;
  }
  function saveLocal() {
    try {
      localStorage.setItem('rc_lander_data', JSON.stringify(payload()));
      localStorage.setItem('rc_lander_step', String(current));
    } catch (e) {}
  }
  function restoreLocal() {
    try {
      var raw = localStorage.getItem('rc_lander_data');
      if (raw) {
        var d = JSON.parse(raw);
        Object.keys(d).forEach(function (k) {
          if (k === 'motivations') {
            (d[k] || []).forEach(function (v) {
              var box = form.querySelector('input[name="motivation"][value="' + v + '"]');
              if (box) box.checked = true;
            });
          } else if (k === 'commitment') {
            var cc = document.getElementById('f-commitment');
            if (cc) cc.checked = true;
          } else if (k === 'investment') {
            var ii = document.getElementById('f-investment');
            if (ii) ii.checked = true;
          } else if (k !== '_gotcha' && k !== '_subject' && k !== 'city') {
            var fld = form.querySelector('[name="' + k + '"]');
            if (fld) fld.value = d[k];
          }
        });
      }
      var st = parseInt(localStorage.getItem('rc_lander_step') || '1', 10);
      if (st > 1 && st <= TOTAL) current = st;
    } catch (e) {}
  }
  function postProgress(complete) {
    try {
      var p = payload();
      p.session = sessionId();
      p.step = current;
      if (complete) p.complete = true;
      return fetch(PROGRESS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      }).catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }

  function fail(msg) { errorLine.textContent = msg; errorLine.hidden = false; }
  function fieldOk(id) {
    var fld = document.getElementById(id);
    var good = fld && fld.value.trim() !== '' && fld.checkValidity();
    if (fld) fld.classList.toggle('invalid', !good);
    return good;
  }
  function validate(page) {
    errorLine.hidden = true;
    if (page === 1) {
      var ok = ['f-name', 'f-email', 'f-website', 'f-city'].map(fieldOk).every(Boolean);
      if (!ok) { fail('Please complete your name, email, company website and nearest city.'); return false; }
    }
    if (page === 2) {
      var amb = document.getElementById('f-ambition');
      if (amb && amb.value === '') {
        amb.classList.add('invalid');
        fail('Please tell us where you want the business to be in three years.');
        return false;
      }
      if (amb) amb.classList.remove('invalid');
    }
    if (page === 4) {
      var c = document.getElementById('f-commitment');
      if (c && !c.checked) {
        fail('Circles only work when everyone shows up - please confirm the commitment (or this isn’t the right time).');
        return false;
      }
    }
    if (page === 5) {
      var inv = document.getElementById('f-investment');
      if (inv && !inv.checked) {
        fail('Please confirm the investment works for you before applying.');
        return false;
      }
    }
    return true;
  }
  function show(page) {
    current = page;
    pages.forEach(function (p) { p.hidden = (parseInt(p.getAttribute('data-page'), 10) !== page); });
    backBtn.style.display = (page === 1) ? 'none' : '';
    nextBtn.style.display = (page === TOTAL) ? 'none' : '';
    submitBtn.style.display = (page === TOTAL) ? '' : 'none';
    progressEl.textContent = 'Step ' + page + ' of ' + TOTAL;
    errorLine.hidden = true;
  }

  nextBtn.addEventListener('click', function () {
    if (!validate(current)) return;
    postProgress(false);
    show(current + 1);
    saveLocal();
  });
  backBtn.addEventListener('click', function () { show(current - 1); saveLocal(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(1)) { show(1); return; }
    if (!validate(2)) { show(2); return; }
    if (!validate(4)) { show(4); return; }
    if (!validate(5)) { return; }

    var label = submitBtn.textContent;
    submitBtn.disabled = true; submitBtn.textContent = 'Sending…';

    postProgress(true);

    fetch(ENDPOINT, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (res.ok) {
          try {
            localStorage.removeItem('rc_lander_session');
            localStorage.removeItem('rc_lander_data');
            localStorage.removeItem('rc_lander_step');
          } catch (err) {}
          form.hidden = true; confirmation.hidden = false; return;
        }
        throw new Error('bad response');
      })
      .catch(function () {
        submitBtn.disabled = false; submitBtn.textContent = label;
        fail(NETWORK_MSG);
      });
  });

  restoreLocal();
  show(current);
})();

/* circles diagram: one-shot draw-in when scrolled into view (visible regardless) */
(function () {
  var figs = document.querySelectorAll('.circles-fig');
  if (!figs.length) return;
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('drawn'); io.unobserve(en.target); }
    });
  }, { threshold: 0.55, rootMargin: '0px 0px -10% 0px' });
  figs.forEach(function (f) { io.observe(f); });
})();

/* hero valuation gauge: curve + figure count up in sync (fail-safe, reduced-motion aware) */
(function () {
  var fig = document.getElementById('gauge-figure');
  var chart = document.querySelector('.gauge-chart');
  if (!chart) return;
  var clip = chart.querySelector('.g-clip');
  var dot = chart.querySelector('.gauge-dot');
  var X0 = 24, X1 = 396, YB = 224, YT = 30, START = 2000000, END = 25000000;
  function ease(t) { return t * t * t; }
  function fmt(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }
  function frame(p) {
    var e = ease(p);
    if (fig) fig.textContent = fmt(START + (END - START) * e);
    clip.setAttribute('width', String(X0 + (X1 - X0) * p));
    dot.setAttribute('cx', String(X0 + (X1 - X0) * p));
    dot.setAttribute('cy', String(YB - (YB - YT) * e));
  }
  if (!('requestAnimationFrame' in window) ||
      (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    frame(1); return;                       // static end state
  }
  var DUR = 6200, started = false;
  function run(ts0) {
    function step(ts) {
      var p = Math.min((ts - ts0) / DUR, 1);
      frame(p);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function begin() {
    if (started) return; started = true;
    frame(0);
    requestAnimationFrame(function (ts) { run(ts); });
  }
  begin();   // hero is always at the top: run on load
})();

/* newsletter signup -> MailerLite (fail-safe, honeypot, optimistic on no-cors) */
(function () {
  var forms = document.querySelectorAll('form.signup');
  if (!forms.length) return;
  // REPLACE with the MailerLite embedded-form action URL:
  //   https://assets.mailerlite.com/jsonp/<ACCOUNT_ID>/forms/<FORM_ID>/subscribe
  var MAILERLITE_ENDPOINT = 'https://assets.mailerlite.com/jsonp/2522302/forms/193589669310497871/subscribe';
  var reEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  forms.forEach(function (form) {
    var input = form.querySelector('input[type="email"]');
    var hp = form.querySelector('.signup-hp');
    var err = form.querySelector('.signup-error');
    var done = form.querySelector('.signup-done');
    var btn = form.querySelector('button[type="submit"]');
    var row = form.querySelector('.signup-row');
    var fine = form.querySelector('.signup-fine');
    function showDone() {
      if (row) row.hidden = true;
      if (fine) fine.hidden = true;
      if (err) err.hidden = true;
      if (done) done.hidden = false;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input.value.trim();
      var ok = reEmail.test(email);
      input.classList.toggle('invalid', !ok);
      if (err) err.hidden = ok;
      if (!ok) return;
      if (hp && hp.value) { showDone(); return; }            // honeypot: silently drop
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      if (!MAILERLITE_ENDPOINT) { showDone(); return; }       // demo until wired
      var body = new URLSearchParams();
      body.append('fields[email]', email);
      body.append('ml-submit', '1');
      body.append('anticsrf', 'true');
      fetch(MAILERLITE_ENDPOINT, { method: 'POST', body: body, mode: 'no-cors' })
        .then(function () { showDone(); })
        .catch(function () { showDone(); });                  // opaque no-cors; MailerLite's confirm email is the real signal
    });
  });
})();
