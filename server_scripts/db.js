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
//var query = client.query("CREATE TABLE IF NOT EXISTS scores(name varchar(64), score integer, ts timestamp)");
//client.query("INSERT INTO scores(name, score) values($1, $2)", ['Mery', db]);
//client.query("INSERT INTO scores(name, score) values($1, $2)", ['nacho', 1]);
//console.log("Connected with database");

//function saveFinalScore(name,score) {
  //var query = client.query("INSERT INTO scores(name,score,ts) values($1,$2,now())", [name,score]);

// UNUSED
//  query.on("end", function (result) {
//      console.log(JSON.stringify(result.rows, null, "    "));
//      client.end();
//  });

//}

// app.listen(3000,function(){
// console.log("It's Started on PORT 3000");
// });
//
// app.get('/',function(req,res){
// console.log("Done this")
// res.sendfile('/../html/index.html');
//
// });

/*
* Here we will call Database.
* Fetch news from table.
* Return it in JSON.
*/
// app.get('/load',function(req,res){
// client.query("SELECT * from scores",function(err,rows){
// if(err)
// {
// console.log("Problem with psql"+err);
// }
// else
// {
// res.end(JSON.stringify(rows));
// }
// });
// });



// var allRows = [];
// var query = client.query("SELECT name, score FROM scores ORDER BY score DESC");
//
// query.on("row", function (row) {
//    allRows.push(row);
// });
// console.log(allRows);
//
exports.saveFinalScore = saveFinalScore;
exports.getTopTen = getTopTen;
