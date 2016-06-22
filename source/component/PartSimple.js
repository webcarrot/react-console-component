"use strict";

import React from "react";

export default class PartSimple extends React.Component {

  static propTypes = {
    part: React.PropTypes.shape({
      type: React.PropTypes.string.isRequired,
      realType: React.PropTypes.string.isRequired,
      content: React.PropTypes.string.isRequired,
      style: React.PropTypes.object
    }).isRequired,
    style: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    style: {
      marginLeft: ".3em"
    }
  };

  shouldComponentUpdate(nextProps) {
    return nextProps.part !== this.props.part;
  }

  render() {
    const style = {
      ...this.props.style,
      ...this.props.part.style
    };
    return <span style={style}
                 title={this.props.part.realType}>{this.props.part.content}</span>;
  }

}
