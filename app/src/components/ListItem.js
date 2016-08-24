import React, {Component, PropTypes} from 'react';
import ReactImageFallback from "react-image-fallback";
import ReactTooltip from 'react-tooltip';

export default class ListItem extends Component {

  render() {
    let {id, name, sprite, description, types} = this.props.pokemon;
    let sprite_img = `http://192.168.33.10:3000/img/${sprite}`;
    let loader_img = "img/loader.gif";
    let fallback_img = "img/pokeball.png";
    return (
      <li className="pokemon" data-tip={description} data-event="click focus">
        <ReactTooltip place="bottom" type="dark" effect="float" class="tooltip" />
        <ReactImageFallback
          src={sprite_img}
          fallbackImage={fallback_img}
          initialImage={loader_img}
          alt={name}
          className="pokemon-sprite" />
        <div className="pokemon-name">{name}</div>
        <div className="types">
        {types.map(this.renderTypes.bind(this))}
        </div>
      </li>
    );
  }

  renderTypes(type) {
    return (
      <div className={type} key={type}>
      {type}
      </div>
    );
  }

}


ListItem.propTypes = {
  pokemon: PropTypes.object.isRequired
};

