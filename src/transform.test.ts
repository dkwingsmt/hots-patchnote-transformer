"use strict";
exports.__esModule = true;
var parse5 = require("parse5");
var origin = "\n  <ul>\n    <li><font color=\"#0099ff\"><span style=\"font-size: 14px;\"><b>SkillName</b></span></font>\n    <ul>\n      <li><span style=\"font-size: 14px;\">Contents</span></li>\n    </ul>\n    </li>\n  </ul>\n";
var node = parse5.parse(origin);
console.log(node);
