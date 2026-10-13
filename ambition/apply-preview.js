// Step logic copied from the live site.js apply form. The only difference:
// the final submit shows the thank-you state without sending anything.
(function () {
  var form = document.getElementById('interest-form');
  if (!form) return;
  var errorLine = document.getElementById('form-error');
  var confirmation = document.getElementById('form-confirmation');
  var pages = [].slice.call(form.querySelectorAll('.form-page'));
  var backBtn = document.getElementById('form-back');
  var nextBtn = document.getElementById('form-next');
  var submitBtn = document.getElementById('form-submit');
  var progressEl = document.getElementById('form-progress');
  var TOTAL = pages.length;
  var current = 1;

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
      if (amb && amb.value === '') { amb.classList.add('invalid'); fail('Please tell us where you want the business to be in three years.'); return false; }
      if (amb) amb.classList.remove('invalid');
    }
    if (page === 4) {
      var c = document.getElementById('f-commitment');
      if (c && !c.checked) { fail('Circles only work when everyone shows up - please confirm the commitment (or this isn’t the right time).'); return false; }
    }
    if (page === 5) {
      var inv = document.getElementById('f-investment');
      if (inv && !inv.checked) { fail('Please confirm the investment works for you before applying.'); return false; }
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
  nextBtn.addEventListener('click', function () { if (!validate(current)) return; show(current + 1); });
  backBtn.addEventListener('click', function () { show(current - 1); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(1)) { show(1); return; }
    if (!validate(2)) { show(2); return; }
    if (!validate(4)) { show(4); return; }
    if (!validate(5)) { return; }
    form.hidden = true; confirmation.hidden = false;
  });
  show(1);
})();
