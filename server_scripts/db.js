// var pg = require('pg');
// var connectionString = 'postgres://g1527124_u:rpia6dfn33@localhost:5432/g1527124_u';
//
// var client = new pg.Client(connectionString);
// client.connect();
// var x = 1000;
//
// while(x>0){
// //client.query('CREATE TABLE items(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)');
// client.query('INSERT INTO scores(name, score, ts) values("Ted",12,2)');
// //query.on('end', function() {client.end(); });
// x= x-1;
// }
// var query = client.query('SELECT * FROM scores');
//
// query.on('row', function(row){
//   console.log('row');
// });
//
// query.on('end',function(){
//   client.end();
// });

var pg = require("pg");

var conString = "pg://g1527124_u:rpia6dfn33@db.doc.ic.ac.uk:5432/g1527124_u";

var client = new pg.Client(conString);
client.connect();

client.query("CREATE TABLE IF NOT EXISTS trying(name varchar(64), score integer)");
//client.query("INSERT INTO scores(name, score) values($1, $2)", ['Mery', db]);
//client.query("INSERT INTO scores(name, score) values($1, $2)", ['nacho', 1]);

function saveFinalScore(name,score) {
  client.query("INSERT INTO trying(name,score) values($1,$2)", [name,score]);

  query.on("end", function (result) {
      console.log(JSON.stringify(result.rows, null, "    "));
      client.end();
  });

}

//var query = client.query("SELECT name, score FROM scores ORDER BY score DESC");
//query.on("row", function (row, result) {
//    result.addRow(row);
//});





exports.saveFinalScore = saveFinalScore;
