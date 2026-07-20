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

  var form = document.getElementById('interest-form');
  if (!form) return;
    var errorLine = document.getElementById('form-error');
  var confirmation = document.getElementById('form-confirmation');

  function handleRequest(data) {
    // TODO: send `data` to your form handler, e.g.
    //   return fetch('/api/invite-request', { method: 'POST',
    //     headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return Promise.resolve(data);
  }
  function val(id) { return document.getElementById(id).value.trim(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var required = ['f-name', 'f-email', 'f-website'], ok = true;
    required.forEach(function (id) {
      var fld = document.getElementById(id);
      var good = fld.value.trim() !== '' && fld.checkValidity();
      fld.classList.toggle('invalid', !good);
      if (!good) ok = false;
    });
    errorLine.hidden = ok;
    if (!ok) return;
    var motivations = Array.prototype.map.call(
      document.querySelectorAll('input[name="motivation"]:checked'), function (c) { return c.value; });
    handleRequest({ name: val('f-name'), email: val('f-email'), website: val('f-website'),
      linkedin: val('f-linkedin'), founded: val('f-founded'),
      turnover: document.getElementById('f-turnover').value,
      value: document.getElementById('f-value').value, motivation: motivations,
      exception: val('f-exception') })
      .then(function () { form.hidden = true; confirmation.hidden = false; });
  });
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
