var pg = require("pg");

var conString = "pg://g1527124_u:rpia6dfn33@db.doc.ic.ac.uk:5432/g1527124_u";

var client = new pg.Client(conString);



var query = client.query("CREATE TABLE IF NOT EXISTS scores(name varchar(64), score integer, ts timestamp)");

console.log("Got here");

function saveFinalScore(name,score){
  client.connect(function(err) {
    if (err) {
          console.error('Could not connect to DB', err);
          return;
    }

    console.log('Connected with database');
    var query = client.query("INSERT INTO scores(name,score,ts) values($1,$2,now())", [name,score]);
  });
}

function getTopTen(res) {
  var rows = [];
  client.connect();
  var query = client.query("SELECT name,score FROM scores ORDER BY score DESC limit 10 ", function(err, result) {
      if (err) {
          console.error('Error with table query', err);
      } else {
          rows = JSON.stringify(result.rows, null, " ");
          console.log(rows);
          //client.end();
      }
  });
  query.on('end', function() {
    console.log('END QUERY, SEND RESULTS');
    res.send(rows);
    //return res.json(rows);
  });
  return;
}

exports.saveFinalScore = saveFinalScore;
exports.getTopTen = getTopTen;
