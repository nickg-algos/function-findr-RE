// "90 days free" (mockup page 17): the venue picks a billing cycle and adds a card for after the trial.
// DEMO ONLY: nothing is charged and card details never leave the page. Prices come from billing-data.js.
(function () {
  "use strict";

  const { esc } = window.FF_SHARED;
  const B = window.FF_BILLING;
  const $ = (sel, root = document) => root.querySelector(sel);
  const KEY = "ff.venueSignup.v1";
  const dollars = (cents) => "$" + (cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  let signup = {};
  try { signup = JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { /* fine: nothing to carry on */ }

  /* ---------- Prices and terms, all from billing-data.js ---------- */

  document.querySelectorAll("[data-trial-days]").forEach((el) => { el.textContent = B.trialDays; });
  const monthly = B.plans.find((p) => p.id === "monthly");
  $("#tr-terms").innerHTML = [
    `${B.trialDays}-day free trial available to new venues only.`,
    "No subscription fees will be charged during the trial period.",
    `Subscription fee of ${dollars(monthly.priceCents)}/month applies after the trial period unless cancelled.`,
    `A booking fee of ${dollars(B.bookingFeeCents)} applies for each confirmed function booked through FunctionFindr.`,
    "Cancel at any time.",
  ].map((t) => `<li>${esc(t)}</li>`).join("");
  $("#tr-footnote").textContent = `* Plus ${dollars(B.bookingFeeCents)} per function booking received through the FunctionFindr platform. Your subscription will begin automatically after your ${B.trialDays}-day free trial ends. You can cancel your free trial or subscription at any time.`;

  const chosen = signup.plan || "monthly";
  $("#tr-plans").innerHTML = B.plans.map((p) => `
    <label class="check tr-plan"><input type="radio" name="plan" value="${esc(p.id)}"${p.id === chosen ? " checked" : ""} aria-describedby="tr-plan-msg">
      <span class="tr-plan-name">${esc(p.label)}</span><span class="tr-plan-price">${dollars(p.priceCents)}/${esc(p.per)}*</span></label>`).join("");
  $("#t-marketing").checked = !!signup.marketing;

  // TODO(confirm): no promo codes exist yet.
  $("#t-apply").addEventListener("click", () => {
    const code = $("#t-promo").value.trim();
    $("#t-promo-msg").textContent = code ? "Promo codes aren’t set up yet, so this one can’t be applied." : "Please enter a promo code.";
  });

  /* ---------- Card (format checks only, in card.js) ---------- */

  const el = (id) => $(`#c-${id}`);
  window.FF_CARD.tidy(el("number"), el("expiry"), el("cvc"));

  $("#trial").addEventListener("submit", (e) => {
    e.preventDefault();
    const plan = $('input[name="plan"]:checked');
    $("#tr-plan-msg").textContent = plan ? "" : "Please choose a billing cycle.";
    const checks = window.FF_CARD.problems({ number: el("number").value, name: el("name").value, expiry: el("expiry").value, cvc: el("cvc").value });
    const bad = checks.filter(([id, text]) => {
      $(`#c-${id}-msg`).textContent = text;
      el(id).toggleAttribute("aria-invalid", !!text);
      return text;
    });
    if (!plan) { $('input[name="plan"]').focus(); return; }
    if (bad.length) { el(bad[0][0]).focus(); return; }

    ["number", "name", "expiry", "cvc"].forEach((id) => { el(id).value = ""; }); // never kept
    try { sessionStorage.setItem(KEY, JSON.stringify({ ...signup, plan: plan.value, marketing: $("#t-marketing").checked, trial: "demo" })); } catch (err) { /* carry on */ }
    location.href = "mockup.html?p=18"; // TODO: page 18's own address once it's built
  });

  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
