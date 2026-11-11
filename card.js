// Card form helpers shared by the deposit (pay.js) and venue sign-up (trial.js) pages.
// FORMAT CHECKS ONLY: nothing is charged and card details are never stored or sent.
window.FF_CARD = (function () {
  const digits = (v) => v.replace(/\D/g, "");

  function luhn(num) {
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
      let d = Number(num[num.length - 1 - i]);
      if (i % 2) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  function expiryProblem(v) {
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return "Please enter the expiry as MM/YY.";
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return "Please enter a month from 01 to 12.";
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return "This card has expired.";
    return "";
  }

  // Tidies typing as it happens: card number in fours, expiry as MM/YY, CVC digits only.
  function tidy(number, expiry, cvc) {
    number.addEventListener("input", () => { number.value = digits(number.value).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 "); });
    expiry.addEventListener("input", () => {
      const d = digits(expiry.value).slice(0, 4);
      expiry.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    });
    cvc.addEventListener("input", () => { cvc.value = digits(cvc.value).slice(0, 4); });
  }

  // [field, message] pairs in form order; message is "" when the field is fine.
  function problems({ number, name, expiry, cvc }) {
    const n = digits(number);
    return [
      ["number", !n ? "Please enter the card number." : n.length < 13 || !luhn(n) ? "Please check the card number." : ""],
      ["name", name.trim() ? "" : "Please enter the name on the card."],
      ["expiry", expiry ? expiryProblem(expiry) : "Please enter the expiry date."],
      ["cvc", /^\d{3,4}$/.test(cvc) ? "" : "Please enter the 3 or 4 digit code on the back of the card."],
    ];
  }

  return { tidy, problems };
})();
