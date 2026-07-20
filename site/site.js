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
