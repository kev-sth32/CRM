const fs = require('fs');
const files = ['404.html','approvals.html','automations.html','campaigns.html','companies.html','onboarding.html','products.html','quote-view.html','quotes.html','reports.html','settings.html','tasks.html','workspace.html'];
const snippet = '  <script>\n    (function() {\n      try {\n        var t = localStorage.getItem("salesos_theme") || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");\n        document.documentElement.setAttribute("data-theme", t);\n      } catch(e) {}\n    })();\n  </script>\n';
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('salesos_theme')) { console.log(f, 'already has salesos_theme'); return; }
  if (c.includes('<link rel="stylesheet"')) {
    c = c.replace('<link rel="stylesheet"', snippet + '  <link rel="stylesheet"');
  } else if (c.includes('</head>')) {
    c = c.replace('</head>', snippet + '</head>');
  }
  fs.writeFileSync(f, c, 'utf8');
  console.log('Updated', f);
});