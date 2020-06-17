/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/light");

var $root = ($protobuf.roots["default"] || ($protobuf.roots["default"] = new $protobuf.Root()))
.setOptions({
  java_package: "com.demo.im.protocol.proto",
  java_outer_classname: "MessageDef"
})
.addJSON({
  Message: {
    fields: {
      fromId: {
        type: "string",
        id: 1
      },
      toId: {
        type: "string",
        id: 2
      },
      cmd: {
        type: "CommandType",
        id: 3
      },
      content: {
        type: "string",
        id: 4
      }
    },
    nested: {
      CommandType: {
        values: {
          NORMAL: 0,
          HEARTBEAT_REQUEST: 1,
          HEARTBEAT_RESPONSE: 2
        }
      }
    }
  }
});

module.exports = $root;
