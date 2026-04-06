const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('data/chatbot_metrics.db');

db.all("SELECT DISTINCT oficina FROM directorio WHERE oficina IS NOT NULL AND oficina != '' ORDER BY oficina", (err, rows) => {
  console.log('\n🏢 Total de OFICINAS únicas:', rows.length);
  console.log('\nListado de oficinas:');
  rows.forEach((o, i) => {
    console.log(`${i + 1}. ${o.oficina}`);
  });
  
  db.close();
});
