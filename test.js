const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('about.html', 'utf8');

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost/"
});

dom.window.addEventListener('load', () => {
  console.log("Load event fired");
  console.log("Veil opacity:", dom.window.document.getElementById('page-veil').style.opacity);
});
