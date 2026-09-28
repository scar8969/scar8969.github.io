// Shared header + footer injection. Keeps nav consistent across pages.
// Each page includes <div id="site-header"></div> and <div id="site-footer"></div>.

const NAV_LINKS = [
  { href: "index.html", label: "home" },
  { href: "projects.html", label: "projects" },
  { href: "tools.html", label: "tools" },
  { href: "about.html", label: "about" }
];

function currentPath() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function renderHeader() {
  const el = document.getElementById("site-header");
  if (!el) return;
  const active = currentPath();
  const links = NAV_LINKS.map(l => {
    const cls = l.href === active ? ' class="active"' : "";
    return `<a href="${l.href}"${cls}>${l.label}</a>`;
  }).join("");
  el.innerHTML = `
    <header class="site-header">
      <div class="container nav">
        <a class="brand" href="index.html">priyanshu<span class="accent">.</span>rout</a>
        <nav class="nav-links">${links}</nav>
      </div>
    </header>`;
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  if (!el) return;
  const year = new Date().getFullYear();
  el.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <p>&copy; ${year} Priyanshu Rout. Built with plain HTML, CSS &amp; JS.</p>
        <p>
          <a href="https://github.com/scar8969" target="_blank" rel="noopener">github</a>
          &nbsp;·&nbsp;
          <a href="https://linkedin.com/in/priyanshu-rout-abbb37261" target="_blank" rel="noopener">linkedin</a>
          &nbsp;·&nbsp;
          <a href="mailto:priyanshurout8969@gmail.com">email</a>
        </p>
      </div>
    </footer>`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
});
