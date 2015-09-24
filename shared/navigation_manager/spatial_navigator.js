/* global evt, define */
(function(define){'use strict';define(['require','exports','module','evt'],function(require,exports,module){

/**
 * Dependencies
 */

var evt = require('evt');


var SpatialNavigator = module.exports =
    function SpatialNavigator(container, opts) {
  this._focus = null;
  this.maxSteps = null;
  this.container = container;
  for (var opt in opts) {
    this[opt] = opts[opt];
  }
};

SpatialNavigator.prototype = evt({

  isFocusableElement: function sn_isFocusableElement(elem) {
    if (!elem) {
      return false;
    }

    var computedStyle = window.getComputedStyle(elem);
    var isInputElement = !elem.GaiaComponent &&
                         (elem instanceof HTMLInputElement ||
                          elem instanceof HTMLSelectElement ||
                          elem instanceof HTMLTextAreaElement ||
                          elem instanceof HTMLButtonElement);

    if (this.isValidElement(elem) && elem.tabIndex >= 0 &&
        !elem.hasAttribute(SpatialNavigator.ignoreTag)) {

      if (isInputElement && elem.disabled) {
        return false;
      }

      if ((elem instanceof HTMLAnchorElement) && !elem.href.length) {
        return false;
      }

      if (!elem.offsetWidth || computedStyle.visibility === 'hidden') {
        return false;
      }
      return true;
    } else if (elem.isContentEditable && elem.getAttribute('tabindex') === null) {
      // To workaround https://bugzilla.mozilla.org/show_bug.cgi?id=1190261
      // Firefox does not set default tabindex value of editing hosts, hence
      // elem.tabIndex will be -1.
      // So if tabindex is not specified, let's assume it is focusable.
      return true;
    }
    return false;
  },

  isValidElement: function sn_isValidElement(elem) {
    return elem instanceof HTMLElement &&
           !(elem instanceof HTMLStyleElement) &&
           !(elem instanceof HTMLScriptElement);
  },

  _getRect: function sn_getRect(elem) {
    var rect = null;

    if (!this.isFocusableElement(elem)) {
      return null;
    }

    if (elem.getBoundingClientRect) {
      rect = elem.getBoundingClientRect();
      rect.element = elem;
    }

    if (!rect || !rect.width || !rect.height) {
      return null;
    }

    return rect;
  },

  focus: function sn_focus(elem) {
    elem = elem || this._focus;
    if (!elem) {
      return this.focusFirstElement();
    }

    if (this.isFocusableElement(elem)) {
      this._focus = elem;
      this.fire('beforeFocus', this._focus);
      var success = this._focus.focus();
      this.fire('focus', this._focus);
      return this._focus.hasAttribute(SpatialNavigator.scopeTag) ?
             success : true;
    } else {
      console.error(elem, ' is not focusable!');
      return this.focusFirstElement();
    }
    return false;
  },

  focusFirstElement: function sn_focusFirstElement(root) {
    if (root &&
        (root.shadowRoot || root.hasAttribute(SpatialNavigator.scopeTag))) {
      return this.isFocusableElement(root);
    }
    root = root || this.container;

    var index;
    var children = [].slice.call(root.children) || [];
    var candidate;
    for (index = 0; index < children.length; index++) {
      candidate = children[index];
      if (this.isFocusableElement(candidate)) {
        this.focus(candidate);
        return true;
      } else if (this.focusFirstElement(candidate)) {
        return true;
      }
    }
    return false;
  },

  focusLastElement: function sn_focusLastElement(root) {
    if (root &&
        (root.shadowRoot || root.hasAttribute(SpatialNavigator.scopeTag))) {
      return this.isFocusableElement(root);
    }
    root = root || this.container;

    var index;
    var children = [].slice.call(root.children) || [];
    var candidate;
    for (index = children.length - 1; index >= 0; index--) {
      candidate = children[index];
      if (this.isFocusableElement(candidate)) {
        this.focus(candidate);
        return true;
      } else if (this.focusLastElement(candidate)) {
        return true;
      }
    }
    return false;
  },

  navigate: function sn_navigate(direction) {
    if (!direction) {
      return false;
    }

    if (!this._focus) {
      this.focusFirstElement();
      return true;
    }

    if (!this.isFocusableElement(this._focus)) {
      console.log('Current focus ', this._focus, ' is not valid');
      console.log('Automatically switching to the first valid element');
      this.focusFirstElement();
      return true;
    }

    direction = direction.toLowerCase();
    this.maxSteps = this.container.getAttribute(SpatialNavigator.maxStepTag);
    if (this.maxSteps) {
      this.maxSteps = parseInt(this.maxSteps, 10);
    }

    var target = this._focus;
    var targetRec = this._getRect(target);
    if (targetRec) {
      // start scanning from the current parent, and then bottom up
      var focusElement = this.scan(target, targetRec, null, true,
                                   direction, [this.maxSteps], []);
      if (focusElement) {
        this.focus(focusElement);
        return true;
      }
      return false;
    }
    return false;
  },

  scan: function sn_scan(root, targetRec, newFocus, isFirstScan,
                         direction, remainSteps, minDistance) {
    if (!root || root === this.container) {
      return newFocus;
    }

    var sibling;
    var prevNextToggle = true;
    var decendents;
    var prevSibling = root;
    var nextSibling = root.nextElementSibling;

    while (prevSibling || nextSibling) {
      sibling = null;
      if (prevNextToggle && prevSibling) {
        sibling = prevSibling;
        prevSibling = prevSibling.previousElementSibling;
      } else if (!prevNextToggle && nextSibling) {
        sibling = nextSibling;
        nextSibling = nextSibling.nextElementSibling;
      }

      if (sibling && this.isValidElement(sibling)) {
        decendents = ((isFirstScan && sibling === root) ||
                      !this.isFocusableElement(sibling)) ? [] : [sibling];
        if (!sibling.hasAttribute(SpatialNavigator.scopeTag) &&
            (isFirstScan || sibling !== root)) {
          this.findDecendents(sibling, decendents);
        }
        decendents.some(function(candidate) {
          var candidateRect = this._getRect(candidate);
          var distance =
                this.calcDistance(targetRec, candidateRect, direction);
          if (distance && (!minDistance[0] || distance < minDistance[0])) {
            minDistance[0] = distance;
            newFocus = candidate;
          }

          if (remainSteps[0] !== null) {
            remainSteps[0]--;
            if (remainSteps[0] === 0) {
              return true;
            }
          }
          return false;
        }, this);

        if (remainSteps[0] === 0) {
          return newFocus;
        }
      }

      prevNextToggle = !prevNextToggle;
    }

    return this.scan(root.parentElement, targetRec, newFocus,
                     false, direction, remainSteps, minDistance);
  },

  findDecendents: function sn_findDecendents(root, decendents) {
    if (!root || root.shadowRoot ||
        root.hasAttribute(SpatialNavigator.scopeTag)) {
      return;
    }

    var children = [].slice.call(root.children) || [];
    children.forEach(function(child) {
      if (this.isFocusableElement(child)) {
        decendents.push(child);
      }
      this.findDecendents(child, decendents);
    }, this);
  },

  calcDistance: function sn_calcDistance(rect1, rect2, direction) {
    if (!rect1 || !rect2) {
      return null;
    }

    var x = rect1.left - rect2.left;
    var y = rect1.top - rect2.top;

    switch (direction) {
      case 'up':
        if (rect2.top >= rect1.top) {
          return null;
        }
        if (this.strictMode) {
          if (rect2.bottom > rect1.top) {
            return null;
          }
          return y * y;
        }
        break;
      case 'left':
        if (rect2.left >= rect1.left) {
          return null;
        }
        if (this.strictMode) {
          if (rect2.right > rect1.left) {
            return null;
          }
          return x * x;
        }
        break;
      case 'right':
        if (rect2.left <= rect1.left) {
          return null;
        }
        if (this.strictMode) {
          if (rect2.left < rect1.right) {
            return null;
          }
          return x * x;
        }
        break;
      case 'down':
        if (rect2.top <= rect1.top) {
          return null;
        }
        if (this.strictMode) {
          if (rect2.top < rect1.bottom) {
            return null;
          }
          return y * y;
        }
        break;
    }
    return x * x + y * y;
  },

  getActiveElement: function sn_getActiveElement() {
    return this._focus;
  }
});

exports.SpatialNavigator = SpatialNavigator;

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c,d){c=(typeof c == 'function')?c:d;
var m={exports:{}};c(function(n){return w[n];},m.exports,m);w[n]=m.exports;};})
('SpatialNavigator',this));
