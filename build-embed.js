/* Build a Squarespace Code-block package from the standalone site.
   Output: squarespace-embed.html — paste-only, shadow-DOM isolated. */
const fs = require("fs");
const path = require("path");

const dir = "C:/dev/aarremake-site";
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");

const html = read("index.html");
let css = read("assets/styles.css");
let mainJs = read("assets/main.js");
let bgJs = read("assets/background.js");

/* ---------- markup: body children, minus scripts ---------- */
let body = html.split("<body>")[1].split("</body>")[0];
body = body.replace(/<script[\s\S]*?<\/script>/g, "");
body = `<div class="aa">${body}</div>`;

/* ---------- css: scoped to .aa, no viewport-fixed layers ---------- */
css = css.replace(/:root\{/, ".aa{");
css = css.replace(/\nhtml\{scroll-behavior:smooth; -webkit-text-size-adjust:100%\}/, "");
css = css.replace(/body::before\{/, ".aa::before{");
css = css.replace(/\nbody\{/, "\n.aa{");

css = css.replace(".aurora{\n  position:fixed; inset:-15%;", ".aurora{\n  position:absolute; inset:0;");
css = css.replace(".bg-canvas{\n  position:fixed; inset:0;", ".bg-canvas{\n  position:absolute; inset:0;");
css = css.replace(".grain{\n  position:fixed;", ".grain{\n  position:absolute;");
css = css.replace(".site-header{\n  position:sticky;", ".site-header{\n  position:relative;");
css = css.replace(".nav{\n    position:fixed;", ".nav{\n    position:absolute;");
css = css.replace(/section\[id\], main \[id\]\{scroll-margin-top:calc\(var\(--header-h\) \+ 18px\)\}/, "section[id], main [id]{scroll-margin-top:18px}");

/* containment so the absolute art layers stay inside the block */
css += `
.aa{position:relative; isolation:isolate; overflow:hidden; background:var(--bg);
    margin-left:calc(50% - 50vw); margin-right:calc(50% - 50vw);}
.aa > #main{display:block}
.aa a[href^="#"]{cursor:pointer}
`;

/* ---------- js: point DOM lookups at the shadow root ---------- */
const scopeJs = (src) =>
  src
    .replace(/document\.getElementById\(/g, "doc.getElementById(")
    .replace(/document\.querySelectorAll\(/g, "doc.querySelectorAll(")
    .replace(/document\.querySelector\(/g, "doc.querySelector(");

mainJs = scopeJs(mainJs);
bgJs = scopeJs(bgJs);

/* background canvas sizes to the host, not the window */
bgJs = bgJs
  .replace(/window\.innerWidth/g, "host.clientWidth")
  .replace(/window\.innerHeight/g, "host.clientHeight")
  .replace(/window\.addEventListener\(\n    "resize"/, "false && window.addEventListener(\n    \"resize\"");

/* ---------- assemble ---------- */
const fontLink =
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap">';

const payload = `<style>${css}</style>${body}`;

const out = `<!-- ===================================================================
  AAARemakes — Squarespace Code block (self-contained)
  Paste this whole file into one Code block on a page. Nothing else needed.
  Requires a plan that runs JavaScript in Code blocks (Core / Plus / Advanced
  or legacy Business+).
  =================================================================== -->
${fontLink}
<style>html,body{overflow-x:clip}</style>
<div id="aa-embed"></div>
<script>
(function () {
  "use strict";
  var host = document.getElementById("aa-embed");
  if (!host || host.dataset.built) return;
  host.dataset.built = "1";

  var root = host.attachShadow({ mode: "open" });
  root.innerHTML = ${JSON.stringify(payload)};
  var doc = root;

  ${mainJs}

  ${bgJs}
})();
</script>
`;

fs.writeFileSync(path.join(dir, "squarespace-embed.html"), out, "utf8");
console.log("written", out.length, "bytes");
