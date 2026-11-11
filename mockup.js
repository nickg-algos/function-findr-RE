// Shows one page of the mockup as an image until that page is built.
// mockup.html?p=8 shows page 8.
(function () {
  "use strict";

  const { esc, flow, stepHref } = window.FF_SHARED;
  const sizes = window.FF_MOCKUP.images;
  const main = document.getElementById("mockup");
  const n = Number(new URLSearchParams(location.search).get("p")) || 1;
  const step = flow.find((s) => s.p === n);

  // A page that has been built opens there instead.
  if (step && step.href) {
    location.replace(stepHref(step));
    return;
  }

  if (!step || !sizes[n]) {
    document.title = "Page not found | FunctionFindr";
    main.innerHTML = `<div class="mockup-missing"><h1>There’s no page ${esc(n)} in the mockup</h1><p>The mockup has 24 pages. <a href="index.html">Go to the landing page</a>.</p></div>`;
    return;
  }

  const [w, h] = sizes[n];
  document.title = `${step.title} (mockup) | FunctionFindr`;
  main.innerHTML = `<h1 class="sr-only">${esc(step.title)}</h1><img src="mockup/p${n}.jpg" width="${w}" height="${h}" alt="Mockup of page ${n}: ${esc(step.title)}. This page isn’t built yet.">`;
})();
