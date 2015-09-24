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

module.exports = component.register('gaia-radio', {
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
    this.updateSoftKeyContent({
      dpe: 'Select'
    });

    this.makeAccessible();
  },

  makeAccessible: function() {
    this.setAttribute('role', 'radio');

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

    var selector = 'gaia-radio[name="' + this.name + '"]';
    var els = [].slice.call(document.querySelectorAll(selector));
    var checkedEl;
    els.forEach(function(el) {
      if (el._checked === true) {
        checkedEl = el;
      }
      el._checked = false;
    });
    this._checked = true;
    var event = new CustomEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      detail: {
        customEvent: true
      }
    });
    this.dispatchEvent(event);
    els.forEach(function(el) {
      el._checked = false;
    });
    if (checkedEl) {
      checkedEl._checked = true;
    }

    if (!event.defaultPrevented && this.checked !== true) {
      this.checked = !this.checked;
    }
  },

  toggle: function(value) {

    value = arguments.length ? value : !this.checked;
    if (value || value === '') { this.check(); }
    else { this.uncheck(); }
  },

  check: function() {
    if (this.checked) { return; }
    this.uncheckGroup();
    this._checked = true;
    this.setAttr('checked', '');
    this.setAttribute('aria-checked', true);
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      cancelable: false
    }));
  },

  uncheckGroup: function() {
    var selector = 'gaia-radio[name="' + this.name + '"]';
    var els = document.querySelectorAll(selector);
    [].forEach.call(els, function(el) { el.checked = false; });
  },

  uncheck: function() {
    if (!this.checked) { return; }
    this._checked = false;
    this.removeAttr('checked');
    this.setAttribute('aria-checked', false);
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
          this.setAttr('disabled', '');
          this.setAttr('aria-disabled', true);
        } else {
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
      get: function() { return 'radio'; }
    },

    value: {
      get: function() { return this._value; },
      set: function(value) {
        this.setAttribute('value', value);
        this._value = value;
      }
    }
  },

  template: `<button class="inner" id="inner"></button>
    <style>
    gaia-radio {
      display: inline-block;
      width: 2.2rem;
      height: 2.2rem;
    }

    /** Inner
     ---------------------------------------------------------*/

    .inner {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: none;
      border-radius: 50%;
      border: solid 2px;
      color: var(--color, #00AACC);
    }

    /**
     * danger
     */

    [danger].inner {
      color: var(--color-danger, #B90000);
    }

    /** Circle
     ---------------------------------------------------------*/

    [checked].inner:after {
      content: "";
      position: absolute;
      top: calc(50% - 0.5rem);
      left: calc(50% - 0.5rem);
      display: block;
      width: 1rem;
      height: 1rem;
      background: currentColor;
      border-radius: 50%;
    }
    </style>
    `

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
  return el && el.tagName === 'GAIA-RADIO' ? el : null;
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
('gaia-radio',this));

