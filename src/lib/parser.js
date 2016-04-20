"use strict";

const COMPLEX_STRING = "s";
const COMPLEX_DOUBLE = "d";
const COMPLEX_INTEGER = "i";
const COMPLEX_FLOAT = "f";
const COMPLEX_OBJECT = "o";
const COMPLEX_OBJECT_2 = "O";
const COMPLEX_STYLE = "c";

const TYPE_COMPLEX = "complex";
const TYPE_SIMPLE = "simple";
const TYPE_OBJECT = "object";
const TYPE_STYLE = "style";

const SUB_REPLACE = "___SUB_REPLACE___";
const SUB_REGEXP = /(?!=%)%(s|d|i|f|o|O|c)/g;
const MAX_DEPTH = 10;

export { TYPE_SIMPLE, TYPE_OBJECT };

export default function parser(rawData) {
  const {messageData: messageDataPre} = rawData.reduce((o, raw) => {
    if (o.subParts.length) {
      const subPartType = o.subParts.shift();
      const parts = o.current.part.parts;
      switch (subPartType) {
        case COMPLEX_STRING:
          parts.push(makeSimplePart(raw + ""));
          break;
        case COMPLEX_DOUBLE:
        case COMPLEX_INTEGER:
          parts.push(makeSimplePart(parseInt(raw)));
          break;
        case COMPLEX_FLOAT:
          parts.push(makeSimplePart(parseFloat(raw)));
          break;
        case COMPLEX_OBJECT:
        case COMPLEX_OBJECT_2:
          parts.push(raw && typeof raw === "object" ? makeObjectPart(raw) : makeSimplePart(raw));
          break;
        case COMPLEX_STYLE:
          parts.push(makeStylePart(raw));
          break;
        default:
          throw new Error("Invalid type!");
      }
    } else {
      if (typeof raw === "object" && raw) {
        o.current = makeObjectPart(raw);
      } else if (typeof raw === "string" && SUB_REGEXP.test(raw)) {
        o.current = makeComplex(raw);
        o.subParts = o.current.part.subParts;
      } else {
        o.current = makeSimplePart(raw);
      }
      o.messageData.push(o.current);
    }
    return o;
  }, {
    messageData: [],
    current: null,
    subParts: []
  });

  const {messageData, messageText} = messageDataPre.reduce((o, data) => {
    const {part, text} = data;
    switch (part.type) {
      case TYPE_COMPLEX:
        part.parts.reduce((o2, subData, index) => {
          const {part: subPart} = subData;
          switch (subPart.type) {
            case TYPE_STYLE:
              part.texts.slice(index).forEach(subText => subText.part.style = subPart.content);
              break;
            case TYPE_SIMPLE:
            case TYPE_OBJECT:
              o2.push(subData);
              break;
            default:
              throw new Error("Invalid type!");
          }
          o2.push(part.texts[index]);
          return o2;
        }, []).forEach(subData => {
          const {part: subPart, text: subText} = subData;
          o.messageData.push(subPart);
          o.messageText.push(subText);
        });
        break;
      default:
        o.messageData.push(part);
        o.messageText.push(text);
        break;
    }
    return o;
  }, {
    messageData: [],
    messageText: []
  });
  return {
    data: messageData,
    text: messageText.join(" ")
  };
}

export function makeSimplePart(raw) {
  const realType = typeof raw;
  const content = realType === "string" ? raw : raw + "" || realType;
  const part = {
    type: TYPE_SIMPLE,
    realType: realType,
    content: content
  };
  const text = content;
  return {
    part,
    text
  };
}

export function prepareObject(obj, maxDepth) {
  maxDepth--;
  if (obj && typeof obj === "object") {
    return Object.keys(obj).reduce((o, key) => {
      const value = obj[key];
      if (value && typeof value === "object") {
        if (!maxDepth) {
          o[key] = Object.prototype.toString.call(value);
        } else if (value instanceof Array) {
          o[key] = value.map(v => prepareObject(v, maxDepth));
        } else {
          o[key] = prepareObject(value, maxDepth);
        }
      } else {
        o[key] = value;
      }
      return o;
    }, {});
  } else {
    return obj;
  }
}

export function makeObjectPart(raw) {
  const content = raw instanceof Error ? Object.assign({
    stack: raw.stack,
    arguments: raw.arguments,
    type: raw.type,
    message: raw.message
  }, raw) : raw;
  const part = {
    type: TYPE_OBJECT,
    realType: Object.prototype.toString.call(raw),
    content: JSON.stringify(prepareObject(content, MAX_DEPTH), null, 2).replace(/\\n/g, "\n")
  };
  const text = part.name;
  return {
    part,
    text
  };
}

export function makeStylePart(raw) {
  const content = raw.split(";").map(s => s.split(":")).reduce((styles, data) => {
    const name = data.shift().replace(/^-/, "").replace(/-./g, val => val[1].toUpperCase());
    const value = data.join(":");
    styles[name] = value;
    return styles;
  }, {});
  const part = {
    type: TYPE_STYLE,
    content: content
  };
  return {
    part
  };
}

export function makeComplex(raw) {
  const subParts = [];
  const content = raw.replace(SUB_REGEXP, (_, subPartType) => {
    subParts.push(subPartType);
    return SUB_REPLACE;
  }).split(SUB_REPLACE);
  if (subParts[0] === COMPLEX_STYLE && content[0] === "") {
    content.shift();
  }
  const part = {
    type: TYPE_COMPLEX,
    texts: content.map(text => makeSimplePart(text)),
    subParts: subParts,
    parts: []
  };
  return {
    part
  };
}
