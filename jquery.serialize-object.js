/**
 * jQuery serializeObject
 * @copyright 2014, macek <paulmacek@gmail.com>
 * @link https://github.com/macek/jquery-serialize-object
 * @license BSD
 * @version 2.3.0 Modified
 */
(function (root, factory) {
    // AMD
    if (typeof define === "function" && define.amd) {
        define(["jquery", "exports"], function ($, exports) {
            factory(root, exports, $);
        });
    }

        // CommonJS
    else if (typeof exports !== "undefined") {
        var $ = require("jquery");
        factory(root, exports, $);
    }

        // Browser
    else {
        root.FormSerializer = factory(root, {}, (root.jQuery || root.Zepto || root.ender || root.$));
    }
}(this, function (root, exports, $) {
    var patterns = {
        validate: /^[a-z][a-z0-9_]*(?:\[(?:\d*|[a-z0-9_]+)\]|\.[a-z0-9_]+)*$/i,
        key: /[a-z0-9_]+|(?=\[\])/gi,
        push: /^$/,
        fixed: /^\d+$/,
        named: /^[a-z0-9_]+$/i
    };

    function FormSerializer(helper) {
        // private variables
        var data = {},
            pushes = {},
            rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/;

        // private API
        function build(base, key, value) {
            base[key] = value;
            return base;
        }

        function makeObject(root, value) {
            var keys = root.match(patterns.key), k;

            // nest, nest, ..., nest
            while ((k = keys.pop()) !== undefined) {
                // foo[]
                if (patterns.push.test(k)) {
                    var idx = incrementPush(root.replace(/\[\]$/, ''));
                    value = build([], idx, value);
                }

                    // foo[n]
                else if (patterns.fixed.test(k)) {
                    value = build([], k, value);
                }

                    // foo; foo[bar]
                else if (patterns.named.test(k)) {
                    value = build({}, k, value);
                }
            }

            return value;
        }

        function incrementPush(key) {
            if (pushes[key] === undefined) {
                pushes[key] = 0;
            }
            return pushes[key]++;
        }

        function addPair(pair) {
            if (!patterns.validate.test(pair.name)) return this;
            var obj = makeObject(pair.name, parseValue(pair.value));
            data = helper.extend(true, data, obj);
            return this;
        }

        function addPairs(pairs) {
            if (!helper.isArray(pairs)) {
                throw new Error("formSerializer.addPairs expects an Array");
            }
            for (var i = 0, len = pairs.length; i < len; i++) {
                this.addPair(pairs[i]);
            }
            return this;
        }

        function serialize() {
            return data;
        }

        function serializeJSON() {
            return JSON.stringify(serialize());
        }

        function parseValue(data) {
            //From jQuery data attribute handler
            if (typeof data === "string") {
                try {
                    data = data === "true" ? true :
                        data === "false" ? false :
                        data === "null" ? null :
                        // Only convert to a number if it doesn't change the string
                        +data + "" === data ? +data :
                        rbrace.test(data) ? jQuery.parseJSON(data) :
                        data;
                } catch (e) { }
            }/* else {
                data = undefined;
            }*/
            return data;
        }

        // public API
        this.addPair = addPair;
        this.addPairs = addPairs;
        this.serialize = serialize;
        this.serializeJSON = serializeJSON;
    }

    FormSerializer.patterns = patterns;

    FormSerializer.serializeObject = function serializeObject() {
        if (this.length > 1) {
            return new Error("jquery-serialize-object can only serialize one form at a time");
        }
        return new FormSerializer($).
          addPairs(this.serializeArray()).
          serialize();
    };

    FormSerializer.serializeJSON = function serializeJSON() {
        if (this.length > 1) {
            return new Error("jquery-serialize-object can only serialize one form at a time");
        }
        return new FormSerializer($).
          addPairs(this.serializeArray()).
          serializeJSON();
    };

    if (typeof $.fn !== "undefined") {
        $.fn.serializeObject = FormSerializer.serializeObject;
        $.fn.serializeJSON = FormSerializer.serializeJSON;
    }

    exports.FormSerializer = FormSerializer;

    return FormSerializer;
}));
