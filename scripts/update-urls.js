const fs = require('fs');
const files = ['index.html', 'about.html', 'services.html', 'process.html', 'contact.html'];
files.forEach(f => {
  let data = fs.readFileSync(f, 'utf8');
  data = data.replace(/href="index\.html"/g, 'href="/"')
             .replace(/href="(about|services|process|contact)\.html"/g, 'href="/$1"');
  fs.writeFileSync(f, data);
});
console.log('Hrefs updated');
