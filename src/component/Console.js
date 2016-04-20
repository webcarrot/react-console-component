"use strict";

import React from "react";

import parser from "../lib/parser";

import Message from "./Message";

const BUTTON_STYLE = {
  display: "inline-block",
  boxSizing: "border-box",
  padding: ".2em .5em",
  margin: "0 0 0 .2em",
  verticalAlign: "middle",
  cursor: "pointer",
  height: "3em"
};

const INPUT_STYLE = {
  display: "inline-block",
  boxSizing: "border-box",
  color: "black",
  background: "white",
  padding: ".2em .5em",
  margin: "0 .2em",
  border: "1px solid black",
  height: "3em"
};


export default class Console extends React.Component {

  static propTypes = {
    capturing: React.PropTypes.bool.isRequired,
    types: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    consoleStyle: React.PropTypes.object.isRequired,
    headerStyle: React.PropTypes.object.isRequired,
    filterStyle: React.PropTypes.object.isRequired,
    filterActiveStyle: React.PropTypes.object.isRequired,
    filterInActiveStyle: React.PropTypes.object.isRequired,
    searchStyle: React.PropTypes.object.isRequired,
    listStyle: React.PropTypes.object.isRequired,
    openStyle: React.PropTypes.object.isRequired,
    messageStyle: React.PropTypes.object
  };

  static defaultProps = {
    capturing: false,
    types: [
      'log',
      'error',
      'info',
      'debug',
      'warn'
    ],
    consoleStyle: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      position: "fixed",
      background: "white",
      color: "black",
      width: "100%",
      height: "100%",
      zIndex: 99999,
      padding: "4em 10px"
    },
    headerStyle: {
      top: 0,
      left: 0,
      right: 0,
      position: "absolute",
      height: "4em",
      background: "#eee",
      lineHeight: "4em",
      borderBottom: "1px solid black",
      padding: "0 1em"
    },
    filterStyle: BUTTON_STYLE,
    filterActiveStyle: {
      color: "black",
      background: "white"
    },
    filterInActiveStyle: {
      color: "#aaa",
      background: "#333"
    },
    searchStyle: INPUT_STYLE,
    clearStyle: {
      ...BUTTON_STYLE,
      float: "right",
      background: "red",
      color: "white"
    },
    startStopStyle: {
      ...BUTTON_STYLE,
      float: "right",
      background: "blue",
      color: "white"
    },
    closeStyle: {
      ...BUTTON_STYLE,
      float: "right",
      background: "yellow",
      color: "black"
    },
    listStyle: {
      top: "4em",
      left: 0,
      right: 0,
      bottom: "4em",
      position: "absolute",
      background: "white",
      overflow: "auto"
    },
    footerStyle: {
      bottom: 0,
      left: 0,
      right: 0,
      position: "absolute",
      height: "4em",
      background: "#eee",
      lineHeight: "4em",
      borderTop: "1px solid black",
      padding: "0 1em"
    },
    evalInputStyle: {
      ...INPUT_STYLE,
      color: "red",
      background: "white"
    },
    evalRunStyle: {
      ...BUTTON_STYLE,
      background: "red",
      color: "white"
    },
    openStyle: {
      ...BUTTON_STYLE,
      top: 0,
      left: 0,
      position: "fixed",
      background: "yellow",
      color: "black",
      zIndex: 99999
    }
  };


  constructor(props, context) {
    super(props, context);
    this.state = {
      capturing: this.props.capturing,
      enabled: false,
      visible: false,
      messages: [],
      searchRegExp: null,
      search: "",
      filter: props.types.reduce((filter, type) => {
        filter[type] = true;
        return filter;
      }, {}),
      eval: "",
      debug: typeof window === "undefined" ? "" : window.localStorage.getItem("debug")
    };
    this._open = () => this.setState({
        visible: true
      });
    this._close = () => this.setState({
        visible: false
      });
    this._clear = () => this.setState({
        messages: []
      });
    this._handleStartStop = () => this.startStop();
    this._handleSearch = ev => this.search(ev.target.value);
    this._handleEvalChange = ev => this.setState({
        eval: ev.target.value
      });
    this._runEval = () => this.runEval();
    this._handleDebugChange = ev => this.setState({
        debug: ev.target.value
      });
    this._setDebug = () => this.setDebug();
    this._handleGlobalError = (...data) => this.addMessage("error", data);
  }

  componentDidMount() {
    if (this.props.capturing) {
      this.replaceNative();
    }
    this.setState({
      enabled: true
    });
  }

  shouldComponentUpdate(_, nextState) {
    return nextState.enabled !== this.state.enabled || nextState.visible !== this.state.visible || nextState.capturing !== this.state.capturing || nextState.visible;
  }

  componentWillUnmount() {
    this.restoreNative();
  }

  startStop() {
    const capturing = this.state.capturing;
    if (capturing) {
      this.restoreNative();
      this.setState({
        capturing: false
      });
    } else {
      this.replaceNative();
      this.setState({
        capturing: true
      });
    }
  }

  replaceNative() {
    if (!this._native) {
      this._native = this.props.types.reduce((native, type) => {
        native[type] = console[type];
        console[type] = (...props) => this.addMessage(type, ...props);
        return native;
      }, {});
      if (this.props.types.indexOf("error") > -1) {
        this._native.onError = window.onerror;
        window.onerror = this._handleGlobalError;
      }
    }
  }

  restoreNative() {
    if (this._native) {
      Object.keys(this._native).forEach(type => {
        console[type] = this._native[type];
      });
      if (this.props.types.indexOf("error") > -1) {
        window.onerror = this._native.onError;
      }
      delete this._native;
    }
  }

  addMessage(type, ...rawData) {
    if (!this._native) {
      return;
    }
    this._native[type].apply(console, rawData);
    const {data, text} = parser(rawData);
    this.setState({
      messages: this.state.messages.concat([{
        no: this.state.messages.length,
        type: type,
        data: data,
        text: text
      }])
    });
  }

  search(text) {
    if (text !== this.state.search) {
      const search = text.trim();
      if (search) {
        this.setState({
          search: text,
          searchRegExp: new RegExp(search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), "ig")
        });
      } else {
        this.setState({
          search: text,
          searchRegExp: null
        });
      }
    }
  }

  filter(type) {
    this.setState({
      filter: Object.assign({}, this.state.filter, {
        [type]: !this.state.filter[type]
      })
    });
  }

  filterStyle(type) {
    return {
      ...(this.state.filter[type] ? this.props.filterActiveStyle : this.props.filterInActiveStyle),
      ...this.props.filterStyle
    };
  }

  runEval() {
    if (this.state.eval) {
      try {
        const value = eval(this.state.eval);
        if (value) {
          setTimeout(() => console.info(value), 100);
        }
      } catch (e) {
        setTimeout(() => console.error(e), 100);
      }
    }
  }

  setDebug() {
    window.localStorage.setItem("debug", this.state.debug);
  }

  render() {
    if (this.state.enabled) {
      if (this.state.visible) {
        return this.renderConsole();
      } else {
        return this.renderOpenButton();
      }
    } else {
      return null;
    }
  }

  renderConsole() {
    return <div style={this.props.consoleStyle}>
             {this.renderHeader()}
             {this.renderList()}
             {this.renderFooter()}
           </div>;
  }

  renderHeader() {
    const filters = Object.keys(this.state.filter).map(type => {
      const changeState = () => this.filter(type);
      const style = this.filterStyle(type);
      return <button onClick={changeState}
                     style={style}
                     key={type}>
               {type}
             </button>;
    });
    return <div style={this.props.headerStyle}>
             Filter:
             <input type="text"
                    style={this.props.searchStyle}
                    value={this.state.search}
                    onChange={this._handleSearch} />
             <button style={this.props.clearStyle}
                     onClick={this._clear}>
               Clear
             </button>
             <button style={this.props.startStopStyle}
                     onClick={this._handleStartStop}>
               {this.state.capturing ? "Stop" : "Start"}
             </button>
             <button style={this.props.closeStyle}
                     onClick={this._close}>
               Close
             </button>
             {filters}
           </div>;
  }

  renderFooter() {
    return <div style={this.props.footerStyle}>
             Eval:
             <input type="text"
                    style={this.props.evalInputStyle}
                    value={this.state.eval}
                    onChange={this._handleEvalChange} />
             <button style={this.props.evalRunStyle}
                     onClick={this._runEval}>
               Run
             </button>
             Debug:
             <input type="text"
                    style={this.props.evalInputStyle}
                    value={this.state.debug}
                    onChange={this._handleDebugChange} />
             <button style={this.props.evalRunStyle}
                     onClick={this._setDebug}>
               Change
             </button>
           </div>;
  }

  renderList() {
    const elements = this.state.messages
      .filter(message => this.state.filter[message.type] && (!this.state.searchRegExp || this.state.searchRegExp.test(message.text)))
      .map(message => <Message key={message.no}
                               message={message}
                               style={this.props.messageStyle} />);
    return <div style={this.props.listStyle}>
             {elements}
           </div>;
  }

  renderOpenButton() {
    return <button onClick={this._open}
                   style={this.props.openStyle}>
             Open
           </button>;
  }
}
