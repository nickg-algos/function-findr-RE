// "Login or Sign up!" (mockup page 3). DEMO ONLY: accounts aren't set up yet, so both forms check
// their fields and carry on. Passwords never leave the page; the name and email are kept in this tab
// (sessionStorage ff.customer.v1) so the welcome page (page 4) can greet the customer.
// TODO(confirm): real sign-in needs a server and decisions on accounts (CLAUDE.md §9).
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const KEY = "ff.customer.v1";
  const NEXT = "welcome.html";
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function check(form, rules) {
    let first = null;
    rules.forEach(([name, test]) => {
      const input = form.elements[name];
      const text = test(input.value.trim());
      $(`#${form.id}-${name}-msg`).textContent = text;
      input.closest(".av-field").classList.toggle("is-bad", !!text);
      input.toggleAttribute("aria-invalid", !!text);
      if (text && !first) first = input;
    });
    if (first) first.focus();
    return !first;
  }
  const keep = (who) => { try { sessionStorage.setItem(KEY, JSON.stringify(who)); } catch (e) { /* the next page uses a general greeting */ } };

  $("#login").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const ok = check(f, [
      ["username", (v) => (v ? "" : "Please enter your username.")],
      ["password", (v) => (v ? "" : "Please enter your password.")],
    ]);
    if (!ok) return;
    f.elements.password.value = "";
    keep({ username: f.elements.username.value.trim() });
    location.href = NEXT;
  });

  $("#signup").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const ok = check(f, [
      ["name", (v) => (v ? "" : "Please enter your full name.")],
      ["email", (v) => (!v ? "Please enter your email address." : emailOk(v) ? "" : "Please enter an email address, like name@example.com.")],
      ["username", (v) => (v ? "" : "Please choose a username.")],
      ["password", (v) => (v ? "" : "Please choose a password.")],
    ]);
    if (!ok) return;
    f.elements.password.value = "";
    keep({ name: f.elements.name.value.trim(), email: f.elements.email.value.trim(), username: f.elements.username.value.trim(), marketing: f.elements.marketing.checked });
    location.href = NEXT;
  });

  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
