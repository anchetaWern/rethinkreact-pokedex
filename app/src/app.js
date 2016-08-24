import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import ListItem from './components/ListItem';

import io from 'socket.io-client/socket.io';

import Loading from 'react-loading';
import aja from 'aja';

class Main extends Component {

  constructor(props) {
    
    super(props);

    this.base_url = 'http://192.168.33.10:3000';

    this.socket = io(this.base_url, {
      transports: ['websocket']
    });

    this.state = {
    	search_term: '',
    	pokemon_list: [],
    	filtered_pokemon_list: [],
    	is_loading: false
    };

  }

  componentWillMount() {

    this.socket.on('pokedex_updated', (data) => {

      var pokemon_list = this.state.pokemon_list;
      if(data.old_val === null){
        pokemon_list.push(data.new_val);

        this.setState({
          pokemon_list: pokemon_list
        }, () => {
          this.filterPokemonList.call(this, this.state.search_term, pokemon_list);
        });
      }
    });

    this.getPokemonList();

  }

  getPokemonList() {

    aja()
      .method('get')
      .url(this.base_url + '/pokemon')
      .on('200', (pokemon_list) => {
        this.setState({
          pokemon_list: pokemon_list,
          filtered_pokemon_list: pokemon_list
        });
      })
      .go();

  }

  render() {

    return (
      <div>
        <div id="header">
          <h1>RethinkReact Pokedex</h1>
          <input type="text" name="pokemon" id="pokemon" onChange={this.searchPokemon.bind(this)} placeholder="What Kind of Pokemon are you?" />
        </div>
        <div className="pokemon-list flex">
        {this.state.filtered_pokemon_list.map(this.renderListItem.bind(this))}
        </div>
        <div className={this.state.is_loading ? 'loader' : 'loader hidden'}>
          <Loading type="bubbles" color='#f93434' />
        </div>
        {this.renderNoResults.call(this)}
      </div>
    );

  }

  filterPokemonList(search_term, pokemon_list) {

    var filtered_pokemon_list = pokemon_list.filter((pokemon) => {
      if(pokemon.name.indexOf(search_term) !== -1){
        return pokemon;
      }
    });
    this.setState({filtered_pokemon_list});

  }

  searchPokemon(e) {

    let search_term = e.target.value.toLowerCase();
    this.setState({search_term});
    this.filterPokemonList.call(this, search_term, this.state.pokemon_list);

  }

  renderNoResults() {

    if(!this.state.filtered_pokemon_list.length){			
      return (
        <div className={this.state.is_loading ? 'no-result hidden' : 'no-result'}>
          Sorry, I cannot find that Pokemon. Would you like to add it? <br />
          <button onClick={this.savePokemon.bind(this)}>yes!</button>
        </div>
      );
    }

  }

  renderListItem(pokemon) {

    return (
      <ListItem pokemon={pokemon} key={pokemon.id} />
    );

  }

  savePokemon() {

    this.setState({
      is_loading: true
    });

    if(this.state.search_term.trim() != ''){		
      aja()
        .method('post')
        .url(this.base_url + '/save')
        .data({name: this.state.search_term})
        .on('200', (response) => {
          if(response.type == 'fail'){
            alert(response.msg);
          }

          this.setState({
            is_loading: false
          });
        })
        .go();
    }

  }

}

var main = document.getElementById('main');
ReactDOM.render(<Main />, main);