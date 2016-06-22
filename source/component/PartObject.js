"use strict";

import React from "react";

export default class PartObject extends React.Component {

  static propTypes = {
    part: React.PropTypes.shape({
      type: React.PropTypes.string.isRequired,
      realType: React.PropTypes.string.isRequired,
      content: React.PropTypes.string.isRequired
    }).isRequired,
    style: React.PropTypes.object.isRequired,
    nameStyle: React.PropTypes.object.isRequired,
    contentStyle: React.PropTypes.object.isRequired
  };

  static defaultProps = {
    style: {
      display: "inline"
    },
    nameStyle: {
      color: "blue",
      fontWight: "bold",
      cursor: "pointer",
      marginLeft: ".3em"
    },
    contentStyle: {
      whiteSpace: "pre",
      width: "100%",
      overflow: "auto"
    }
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      displayDetails: false
    };
    this._toggleDetails = ev => {
      ev.preventDefault();
      this.setState({
        displayDetails: !this.state.displayDetails
      });
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.part !== this.props.part || nextState.displayDetails !== this.state.displayDetails;
  }


  render() {
    return <div style={this.props.style}>
             {this.renderType()}
             {this.renderContent()}
           </div>;
  }

  renderType() {
    return <a href="#"
              onClick={this._toggleDetails}
              style={this.props.nameStyle}>
             {this.props.part.realType}
           </a>;
  }

  renderContent() {
    if (this.state.displayDetails) {
      return <pre style={this.props.contentStyle}>{this.props.part.content}</pre>;
    } else {
      return null;
    }
  }
}
