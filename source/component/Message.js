"use strict";

import React from "react";

import { TYPE_SIMPLE, TYPE_OBJECT } from "../lib/parser";

import PartObject from "./PartObject";
import PartSimple from "./PartSimple";

export default class Message extends React.Component {

  static propTypes = {
    message: React.PropTypes.shape({
      no: React.PropTypes.number.isRequired,
      type: React.PropTypes.string.isRequired,
      data: React.PropTypes.arrayOf(React.PropTypes.shape({
        type: React.PropTypes.string.isRequired,
        content: React.PropTypes.any.isRequired
      })),
      text: React.PropTypes.string.isRequired
    }).isRequired,
    style: React.PropTypes.object.isRequired,
    styleObject: React.PropTypes.object,
    styleSimple: React.PropTypes.object
  };

  static defaultProps = {
    style: {
      padding: "5px",
      background: "white",
      borderBottom: "1px solid #aaa",
      fontFamily: "monospace"
    }
  };

  shouldComponentUpdate(nextProps) {
    return nextProps.message !== this.props.message;
  }

  render() {
    return <div style={this.props.style}>
             {this.renderParts()}
           </div>;
  }

  renderParts() {
    return this.props.message.data.map((part, index) => {
      switch (part.type) {
        case TYPE_OBJECT:
          return <PartObject key={index}
                             part={part}
                             style={this.props.styleObject} />;
        case TYPE_SIMPLE:
          return <PartSimple key={index}
                             part={part}
                             style={this.props.styleSimple} />;
      }
    });
  }

}
