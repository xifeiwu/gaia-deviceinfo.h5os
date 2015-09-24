/* global define */
(function(define){'use strict';define(['require','exports','module','gaia-icons','gaia-component'],function(require,exports,module){

/**
 * Dependencies
 */

require('gaia-icons');
var component = require('gaia-component');

/**
 * Exports
 */

module.exports = component.register('gaia-checkbox', {
  extends: HTMLInputElement.prototype,

  created: function() {
    this.setupShadowRoot();

    this.els = { inner: this.shadowRoot.querySelector('.inner') };
    this.addEventListener('click', this.onClick.bind(this), true);

    // Setup initial attributes
    this.checked = this.getAttribute('checked');
    this.disabled = this.getAttribute('disabled');
    this.danger = this.getAttribute('danger');
    this.name = this.getAttribute('name');
    this.value = this.getAttribute('value');

    // process everything that doesn't affect user interaction
    // after the component is created
    this.makeAccessible();
  },

  makeAccessible: function() {
    this.setAttribute('role', 'checkbox');

    // Make tabable
    this.tabIndex = 0;

    this.setAttr('aria-checked', this.checked);
    if (this.disabled) {
      this.setAttr('aria-disabled', true);
    }
  },

  onClick: function(e) {
    if (e.detail && e.detail.customEvent) {
      return;
    }
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (this.disabled) {
      return;
    }
    this._checked = !this._checked;
    // Dispatch a click event.
    var event = new CustomEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      detail: {
        customEvent: true
      }
    });
    this.dispatchEvent(event);
    this._checked = !this._checked;

    if (!event.defaultPrevented) {
      this.checked = !this.checked;
    }
  },

  toggle: function(value) {

    value = arguments.length ? value : !this.checked;
    if (value || value === '') { this.check(); }
    else { this.uncheck(); }
  },

  check: function() {
    if (!this.disabled) {
      this.updateSoftKeyContent({
        dpe: 'Deselect'
      });
    }

    if (this.checked) { return; }
    this._checked = true;
    this.setAttr('checked', '');
    this.setAttribute('aria-checked', true);
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      cancelable: false
    }));
  },

  uncheck: function() {
    if (!this.disabled) {
      this.updateSoftKeyContent({
        dpe: 'Select'
      });
    }
    if (!this.checked) { return; }
    this._checked = false;
    this.removeAttr('checked');
    this.setAttribute('aria-checked', false);
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      cancelable: false
    }));
  },

  attrs: {
    checked: {
      get: function() { return !!this._checked; },
      set: function(value) { this.toggle(value); }
    },

    disabled: {
      get: function() { return this._disabled; },
      set: function(value) {
        value = !!(value || value === '');
        if (this._disabled === value) { return; }
        this._disabled = value;
        if (value) {
          this.updateSoftKeyContent({
            dpe: ' '
          });
          this.setAttr('disabled', '');
          this.setAttr('aria-disabled', true);
        } else {
          this.updateSoftKeyContent({
            dpe: (this.checked) ? 'Deselect' : 'Select'
          });
          this.removeAttr('disabled');
          this.removeAttr('aria-disabled');
        }
      }
    },

    danger: {
      get: function() { return this._danger; },
      set: function(value) {
        if (value || value === '') { this.setAttr('danger', value); }
        else { this.removeAttr('danger'); }
        this._danger = value;
      }
    },

    name: {
      get: function() { return this._name; },
      set: function(value) {
        if (value === null) { this.removeAttr('name'); }
        else { this.setAttr('name', value); }
        this._name = value;
      }
    },

    type: {
      get: function() { return 'checkbox'; }
    },

    value: {
      get: function() { return this._value; },
      set: function(value) {
        this.setAttribute('value', value);
        this._value = value;
      }
    }
  },

  template: `<div class="inner">
      <div class="background"></div>
      <div class="tick"></div>
    </div>
    <style>

    /** Host
     ---------------------------------------------------------*/

    :host {
      position: relative;
      display: inline-block;
      cursor: pointer;
      outline: 0;
    }

    /** Inner
     ---------------------------------------------------------*/

    .inner {
      display: block;
      box-sizing: border-box;
      position: relative;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid #a6a6a6;
      z-index: 0;

      --gaia-checkbox-background:
        var(--checkbox-background,
        var(--input-background,
        var(--button-background,
        var(--background-plus))));

      background:
        var(--gaia-checkbox-background);

      border-color:
        var(--checkbox-border-color,
        var(--border-color,
        var(--background-minus)));
    }

    /**
     * Increase hit area
     */

    .inner:before {
      content: '';
      position: absolute;
      top: -10px; right: -10px;
      bottom: -10px; left: -10px;
    }

    /** Background
     ---------------------------------------------------------*/

    .background {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      top: 0px;
      left: 0px;
      position: absolute;
      z-index: -1;
      opacity: 0;
      background: var(--highlight-color, #000);
    }

    /**
     * .active
     */

    .inner[checked] .background {
      animation-name: gaia-checkbox-animation;
      animation-duration: 350ms;
      animation-fill-mode: forwards;
    }

    /** Tick
     ---------------------------------------------------------*/

    .tick {
      text-align: center;
      line-height: 26px;
      margin-left: -1px;
      opacity: 0;

      transition-property: opacity;
      transition-duration: 100ms;

      color: var(--highlight-color, #000);
    }

    /**
     * [checked]
     */

    [checked] .tick {
      opacity: 1;
      transition-delay: 140ms;
    }

    /** Icon
     ---------------------------------------------------------*/

    .tick:before {
      font-family: 'gaia-icons';
      content: 'tick';
      font-style: normal;
      font-weight: 500;
      text-rendering: optimizeLegibility;
      font-size: 16px;
      line-height: 1;
    }

    </style>`,

    globalCss: `@keyframes gaia-checkbox-animation {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      65% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: scale(1);
      }
    }`
});

// Bind a 'click' delegate to the
// window to listen for all clicks
// and toggle checkboxes when required.
addEventListener('click', function(e) {
  var label = getLabel(e.target);
  var gaiaCheckbox = getLinkedCheckbox(label);
  if (gaiaCheckbox) { gaiaCheckbox.toggle(); }
}, true);

/**
 * Find a checkbox when given a <label>.
 *
 * @param  {Element} label
 * @return {GaiaCheckbox|null}
 */
function getLinkedCheckbox(label) {
  if (!label) { return; }
  var id = label.getAttribute('for');
  var el = id && document.getElementById(id);
  return el && el.tagName === 'GAIA-CHECKBOX' ? el : null;
}

/**
 * Walk up the DOM tree from a given
 * element until a <label> is found.
 *
 * @param  {Element} el
 * @return {HTMLLabelElement|undefined}
 */
function getLabel(el) {
  return el && (el.tagName == 'LABEL' ? el : getLabel(el.parentNode));
}

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c,d){c=(typeof c == 'function')?c:d;
var m={exports:{}};c(function(n){return w[n];},m.exports,m);w[n]=m.exports;};})
('gaia-checkbox',this));
