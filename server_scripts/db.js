var pg = require("pg");
pg.defaults.ssl = true;
var conString = process.env.CORSAIR_DB_URL;
var client = new pg.Client(conString);
var query = client.query("CREATE TABLE IF NOT EXISTS scores(name varchar(64), score integer, date date)");

client.connect(function(err) {
    if (err) {
          console.error('Could not connect to DB', err);
          return;
    }else {
      console.log("Connected with db");
    }
});

function saveFinalScore(name,score){
  console.log('final score for ' + name + ': ' + score);
  var query = client.query("INSERT INTO scores(name,score,date) values($1,$2,current_date)", [name,score]);
}


function getTopTenOverall(res) {
  var rows = [];
  var query = client.query("SELECT name,score FROM scores where name is not null order by score DESC limit 10;", function(err, result) {
      if (err) {
          console.error('Error with table query', err);
      } else {
          rows = JSON.stringify(result.rows, null, " ");
      }
  });
  query.on('end', function() {
    res.send(rows);
  });
  return;
}

function getTopTenToday(res){
  var rows = [];
  var query = client.query("SELECT name,score from scores where date=current_date and name is not null order by score DESC limit 10;", function(err, result) {
      if (err) {
          console.error('Error with table query', err);
      } else {
          rows = JSON.stringify(result.rows, null, " ");
      }
  });
  query.on('end', function() {
    res.send(rows);
  });
  return;
}



exports.saveFinalScore = saveFinalScore;
exports.getTopTenOverall = getTopTenOverall;
exports.getTopTenToday = getTopTenToday;
