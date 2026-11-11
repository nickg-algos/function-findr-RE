// "Get started" (mockup page 16): a venue signs up. DEMO ONLY: nothing is sent anywhere.
// The venue's details (never the password) and a downsized copy of its photo are kept in this tab
// (sessionStorage ff.venueSignup.v1) so the next steps can greet it and preview its listing.
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const KEY = "ff.venueSignup.v1";
  const form = $("#signup");
  const el = (id) => $(`#g-${id}`);
  let photo = null; // data URL, downsized

  // Pick up where they left off if they come back.
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (saved) {
      ["name", "email", "username", "venue", "address", "abn", "menu", "type", "about"].forEach((k) => { if (saved[k]) el(k).value = saved[k]; });
      el("marketing").checked = !!saved.marketing;
      if (saved.photo) showPhoto(saved.photo);
    }
  } catch (e) { /* start fresh */ }

  /* ---------- Photo: shown here and downsized to keep in the tab ---------- */

  function showPhoto(src) {
    photo = src;
    $("#g-photo-preview").innerHTML = `<img src="${src}" alt="Your venue’s street view photo">`;
    $("#g-photo-box").classList.add("has-photo");
    $("#g-photo-label").textContent = "Change photo";
  }
  el("photo").addEventListener("change", () => {
    const file = el("photo").files[0];
    $("#g-photo-msg").textContent = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { $("#g-photo-msg").textContent = "Please choose a JPG, PNG or WebP photo."; return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      showPhoto(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); $("#g-photo-msg").textContent = "That photo couldn’t be opened. Please try another."; };
    img.src = url;
  });

  /* ---------- Checks ---------- */

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  // ABN checksum from the ABR: take 1 from the first digit, weight, and the total divides by 89.
  function abnOk(v) {
    const d = v.replace(/\s/g, "");
    if (!/^\d{11}$/.test(d)) return false;
    const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const sum = d.split("").reduce((t, c, i) => t + (Number(c) - (i === 0 ? 1 : 0)) * w[i], 0);
    return sum % 89 === 0;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = (id) => el(id).value.trim();
    const checks = [
      ["name", v("name") ? "" : "Please enter your full name."],
      ["email", !v("email") ? "Please enter your email address." : emailOk(v("email")) ? "" : "Please enter an email address, like name@example.com."],
      ["venue", v("venue") ? "" : "Please enter your venue’s name."],
      ["abn", !v("abn") ? "Please enter your ABN." : abnOk(v("abn")) ? "" : "That ABN doesn’t look right. Please check all 11 digits."],
      ["address", v("address") ? "" : "Please enter your venue’s address."],
      ["menu", v("menu") ? "" : "Please describe your menu, like Modern Australian."],
      ["type", v("type") ? "" : "Please describe your venue type, like Gastro Pub."],
      ["photo", photo ? "" : "Please add a street view photo of your venue."],
    ];
    const bad = checks.filter(([id, text]) => {
      $(`#g-${id}-msg`).textContent = text;
      if (id === "photo") $("#g-photo-box").classList.toggle("is-bad", !!text);
      else el(id).toggleAttribute("aria-invalid", !!text);
      return text;
    });
    if (bad.length) { el(bad[0][0]).focus(); return; }

    const details = {
      name: v("name"), email: v("email"), username: v("username"), venue: v("venue"), address: v("address"),
      abn: v("abn").replace(/\s/g, ""), menu: v("menu"), type: v("type"), about: v("about"), marketing: el("marketing").checked, photo,
    };
    el("password").value = ""; // never kept
    try { sessionStorage.setItem(KEY, JSON.stringify(details)); } catch (err) {
      try { sessionStorage.setItem(KEY, JSON.stringify({ ...details, photo: null })); } catch (err2) { /* carry on without it */ }
    }
    location.href = "mockup.html?p=17"; // TODO: page 17's own address once it's built
  });

  document.addEventListener("click", (e) => { if (e.target.closest('a[href="#"]')) e.preventDefault(); });
})();
