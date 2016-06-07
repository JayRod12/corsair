var pg = require("pg");
var conString = "pg://g1527124_u:rpia6dfn33@db.doc.ic.ac.uk:5432/g1527124_u";
var client = new pg.Client(conString);
var query = client.query("CREATE TABLE IF NOT EXISTS scores(name varchar(64), score integer, ts timestamp)");

client.connect(function(err) {
    if (err) {
          console.error('Could not connect to DB', err);
          return;
    }else {
      console.log("Connected with db");
    }
});

function saveFinalScore(name,score){
  var query = client.query("INSERT INTO scores(name,score,ts) values($1,$2,now())", [name,score]);
}


function getTopTen(res) {
  var rows = [];
  var query = client.query("SELECT name,score FROM scores ORDER BY score DESC limit 10 ", function(err, result) {
      if (err) {
          console.error('Error with table query', err);
      } else {
          rows = JSON.stringify(result.rows, null, " ");
          //console.log(rows);
      }
  });
  query.on('end', function() {
    res.send(rows);
    console.log('results sent to highscores table');

  });
  return;
}

exports.saveFinalScore = saveFinalScore;
exports.getTopTen = getTopTen;
