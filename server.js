var r = require('rethinkdb');

var http = require('https');
var fs = require('fs');

var Pokedex = require('pokedex-promise-v2');
var P = new Pokedex();

var express = require('express');
var app = express();

var cors = require('cors');

var server = require('http').createServer(app);
var io = require('socket.io')(server);

var bodyParser = require('body-parser');

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var connection;

r.connect({host: 'localhost', port: 32769}, function(err, conn){
  if(err) throw err;
  connection = conn;

  r.db('pokedex').table('pokemon')
    .changes()
    .run(connection, function(err, cursor){
      if (err) throw err;
      io.sockets.on('connection', function(socket){
        cursor.each(function(err, row){
          if(err) throw err;
          io.sockets.emit('pokedex_updated', row);   
        });
      });
    });
});


app.post('/save', function(req, res){

  var pokemon = req.body.name;

  r.db('pokedex').table('pokemon').filter(r.row('name').eq(pokemon)).
    run(connection, function(err, cursor){
      if (err) throw err;
      cursor.toArray(function(err, result){
        if (err) throw err;
        if(result.length){
          res.send({type: 'fail', msg: 'Pokemon already exists'});
          return;
        }
      });
    });


    var p1 = P.getPokemonByName(pokemon).then(function(response){

      var name = response.name;
      var sprite = response.sprites.front_default;
      var filename = 'public/img/' + name + ".png";

      var file = fs.createWriteStream(filename);
      var request = http.get(sprite, function(response){
        response.pipe(file);
      });

      var types = [];
      response.types.forEach(function(row){
        types.push(row.type.name);
      });

      var data = {
        name: name,
        sprite: name + ".png",
        types: types
      };

      return data;

    })
    .catch(function(error){
      res.send({type: 'fail', msg: 'Pokemon not found'});
      return;
    });

    var p2 = P.getPokemonSpeciesByName(pokemon).then(function(response){
      var result = response.flavor_text_entries.filter(function(row){
        return row.version.name == 'alpha-sapphire' && row.language.name == 'en';
      });
      var description = result[0].flavor_text;
      return description;
    })
    .catch(function(error) {
      res.send({type: 'fail', msg: 'Pokemon not found'});
      return;
    });

    Promise.all([p1, p2]).then(function(response){
      var basic_info = response[0];
      var description = response[1];
      basic_info.description = description;

      r.db('pokedex').table('pokemon').insert([
        basic_info,
      ]).run(connection, function(err, result){
        if(err) throw err;
        res.send({
          type: 'ok'
        });
      });
    });

});

app.get('/pokemon', function(req, res){
  res.header("Content-Type", "application/json");
  r.db('pokedex').table('pokemon')
    .run(connection, function(err, cursor) {
      if (err) throw err;
      cursor.toArray(function(err, result) {
        if (err) throw err;
        res.send(result);
      });
    });
});

app.use(express.static('public'));
server.listen(3000);