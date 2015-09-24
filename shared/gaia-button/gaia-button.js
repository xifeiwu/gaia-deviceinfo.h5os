/* globals define */
(function(define){'use strict';define(['require','exports','module','gaia-component'],function(require,exports,module){

/**
 * Dependencies
 */

var component = require('gaia-component');

/**
 * Simple logger
 * @type {Function}
 */
var debug = 0 ? console.log.bind(console) : function() {};

/**
 * Exports
 */

module.exports = component.register('gaia-button', {
  extends: HTMLButtonElement.prototype,

  created: function() {
    this.setupShadowRoot();
    // Setup initial attributes
    this.disabled = this.getAttribute('disabled');
    this.type = this.getAttribute('type') || 'button';
    this.setAttribute('role', 'button');
    this.tabIndex = 0;
    if (!this.disabled) {
      this.updateSoftKeyContent({
        dpe: 'Select'
      });
    }

    this.addEventListener('click', this.onClick.bind(this), true);
  },

  onClick: function(e) {
    if (this.disabled) {
      e.stopImmediatePropagation();
      return;
    }
  },

  attrs: {
    circular: {
      get: function() { return this.getAttribute('circular'); },
      set: function(value) {
        value = !!(value === '' || value);
        if (value) {
          this.setAttribute('circular', '');
        } else {
          this.removeAttribute('circular');
        }
      }
    },

    disabled: {
      get: function() { return this._disabled; },
      set: function(value) {
        value = !!(value || value === '');
        if (this._disabled === value) { return; }
        debug('set disabled', value);
        this._disabled = value;
        if (value) {
          this.setAttr('disabled', '');
          this.updateSoftKeyContent({
            dpe: ' '
          });
        } else {
          this.removeAttr('disabled');
          this.updateSoftKeyContent({
            dpe: 'Select'
          });
        }
      }
    },

    type: {
      set: function(value) {
        this._type = value;
        this.setAttribute('type', value);
      },
      get: function() { return this._type; }
    },
  },

  template: `
    <div class="inner">
      <div class="background"></div>
      <div class="content"><content></content></div>
    </div>

    <style>

    :host {
      display: block;
      box-sizing: border-box;
      overflow: hidden;
      height: 40px;
      min-width: 50%;
      border-radius: 50px;
      margin: var(--base-m, 0) 0;
      outline: 0;
      font-style: italic;
      font-size: 17px;
      cursor: pointer;
      -moz-user-select: none;
      line-height: 1;

      background:
        var(--button-background,
        var(--input-background,
        var(--background-plus,
        #fff)));

      color:
        var(--button-color,
        var(--text-color,
        inherit));

      box-shadow:
        var(--button-box-shadow,
        var(--box-shadow,
        none));
    }

    @media(min-width:500px) {
      :host { min-width: 140px; }
    }

    /**
     * Pressed
     */

    :host(:focus:active) {
      color: var(--button-color-active, #fff);
      box-shadow: var(--button-box-shadow-active, none);
      transition: none;
      background:
        var(--button-background-active,
        var(--highlight-color,
        #333));
    }

    :host(:focus)  {
      background: #ddd;
    }

    /**
     * [circular]
     */

    :host([circular]) {
      width: 50px;
      min-width: 0;
      border-radius: 50%;
    }

    :host([disabled]) {
      pointer-events: none;
    }

    /** Inner
     ---------------------------------------------------------*/

    .inner {
      display: flex;
      align-items: center;
      position: relative;
      height: 100%;
    }

    .inner[disabled] {
      opacity: 0.5;
    }

    /** Content
     ---------------------------------------------------------*/

    /**
     * 1. In some cases events seems to be getting
     *    swallowed by text-nodes. Ignoring pointer-
     *    events means we can listen on parent nodes
     *    instead.
     */

    .content {
      width: 100%;
      position: relative;
      z-index: 2;
      pointer-events: none; /* 1 */
    }

    [circular] .content {
      padding: 0;
    }

    i:before {
      font-size: 26px;
    }

    ::content i {
      margin-left: -2px;
      margin-right: -2px;
    }

    ::content i + span,
    ::content span + i {
      -moz-margin-start: 8px;
    }

    </style>`
});

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c,d){c=(typeof c == 'function')?c:d;
var m={exports:{}};c(function(n){return w[n];},m.exports,m);w[n]=m.exports;};})
('gaia-button',this));
