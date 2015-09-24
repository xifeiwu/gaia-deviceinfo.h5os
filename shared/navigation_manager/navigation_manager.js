/* global evt, define */
(function(define){'use strict';define(['require','exports','module','evt','SpatialNavigator','KeyNavigationAdapter'],function(require,exports,module){

/**
 * Dependencies
 */

var evt = require('evt');
var SpatialNavigator = require('SpatialNavigator');
var KeyNavigationAdapter = require('KeyNavigationAdapter');


const SCOPE_TAG = 'nav-scope';
const IGNORE_TAG = 'nav-ignore';
const MAX_STEP_TAG = 'nav-max-steps';

var NavigationManager =
    module.exports = function NavigationManager(baseContainer, opts) {
  SpatialNavigator.scopeTag = SCOPE_TAG;
  SpatialNavigator.ignoreTag = IGNORE_TAG;
  SpatialNavigator.maxStepTag = MAX_STEP_TAG;

  // name for the element that has nav-scope attribute but no value
  this.activeNavigatorId = null;
  this.activeElement = null;
  this.navIndex = 0;
  this.navigators = {};
  for (var opt in opts) {
    this[opt] = opts[opt];
  }

  window.addEventListener('focus', function(e) {
    var target = e.target;
    if (target instanceof HTMLElement) {
      this.activeElement = target;
      if (target.hasAttribute(SCOPE_TAG)) {
        this.addNavigator(target);
      } else {
        var navElem = this.getNavigator(target);
        var navId = (navElem) ? navElem.getAttribute(SCOPE_TAG) : null;
        var nav = this.navigators[navId];
        if (nav) {
          if (nav.getActiveElement() !== target) {
            nav.focus(target);
          }
        } else {
          this.addNavigator(navElem, target);
        }
      }
    }
  }.bind(this), true);

  window.addEventListener('blur', function(e) {
    var target = e.target;
    if (target instanceof HTMLElement) {
      this.activeElement = document.body;
    }
  }.bind(this), true);

  // body is considered as default navigation container
  this.container = baseContainer || document.body;
  this.addNavigator(this.container);
  this.addMutationObserver();
};

var nmProto = NavigationManager.prototype = evt();

nmProto.addNavigator = function nm_addNavigator(container, targetElem) {
  if (!container) {
    return;
  }

  var id = container.getAttribute(SCOPE_TAG) ||
           ('nav-' + (this.navIndex++));
  if (this.navigators[id]) {
    return;
  }
  container.setAttribute(SCOPE_TAG, id);

  var spatialNavigator = new SpatialNavigator(container, {
    strictMode: container.hasAttribute('nav-strict-mode') ?
                container.getAttribute('nav-strict-mode') === 'true' :
                this.defaultStrict
  });
  spatialNavigator.on('beforeFocus', this._onBeforeFocus.bind(this));
  spatialNavigator.on('focus', this._onFocus.bind(this));
  this.navigators[id] = spatialNavigator;
  container.spatialNavigator = spatialNavigator;

  // listen key event on 'container'
  var enabledDirection = this.defaultDirection || {
    up: true,
    right: true,
    down: true,
    left: true
  };
  ['up', 'right', 'down', 'left'].forEach(function(dir) {
    enabledDirection[dir] = container.hasAttribute('nav-' + dir) ?
                            container.getAttribute('nav-' + dir) === 'true' :
                            enabledDirection[dir];
  }, this);

  var looping = container.hasAttribute('nav-loop');
  var keyNavigatorAdapter = new KeyNavigationAdapter(container);
  keyNavigatorAdapter.init(container);
  keyNavigatorAdapter.on('move', function(direction, evt) {
    if (evt.target.getAttribute('contenteditable') !== 'true' &&
        !(evt.target instanceof HTMLTextAreaElement) &&
        !(evt.target instanceof HTMLInputElement &&
          (evt.target.getAttribute('type') === 'range' ||
           evt.target.getAttribute('type') === 'text'))) {
      evt.preventDefault();
    }

    this.activeNavigatorId = id;
    if (!enabledDirection[direction]) {
      return;
    }

    if (evt && container.hasAttribute(IGNORE_TAG)) {
      evt.stopPropagation();
    }

    if (evt && spatialNavigator.navigate(direction)) {
      evt.stopPropagation();
    } else if (evt && looping) {
      if (direction === 'up' && spatialNavigator.focusLastElement()) {
        evt.stopPropagation();
      } else if (direction === 'down' && spatialNavigator.focusFirstElement()) {
        evt.stopPropagation();
      }
    }
  }.bind(this));

  var self = this;
  container.focus = function(elem) {
    self.activeNavigatorId = id;
    return spatialNavigator.focus(elem);
  };
  container.focus(targetElem);
};

nmProto.addMutationObserver = function nm_addMutationObserver() {
  var observer = new MutationObserver(function(mutations) {
    if (this.activeElement !== document.activeElement) {
      mutations = mutations.filter(function(mutation) {
        var nodes = [].slice.call(mutation.removedNodes).filter(function(node) {
          return node instanceof HTMLElement;
        }, this);
        return nodes.length;
      });

      if (mutations.length) {
        var nav = this.navigators[this.activeNavigatorId];
        var isFocusSuccess;
        while (nav && (isFocusSuccess = nav.focus()) === false) {
          if (!isFocusSuccess) {
            nav.focusFirstElement();
          }
          nav = this.getNavigator(nav.container.parentElement);
          if (nav) {
            nav = this.navigators[nav.getAttribute(SCOPE_TAG)];
          }
        }
      }
    }
  }.bind(this));

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

nmProto.getNavigator = function nm_getNavigator(elem) {
  if (!elem) {
    return null;
  }
  if (elem.hasAttribute(SCOPE_TAG)) {
    return elem;
  } else if (elem.parentElement) {
    return this.getNavigator(elem.parentElement);
  }
};

nmProto._onBeforeFocus = function nm__onBeforeFocus(elem) {
  this.fire('beforeFocus', elem);
};

nmProto._onFocus = function nm__onFocus(elem) {
  this.fire('focus', elem);
};

nmProto._onBlur = function nm__onBlur(elem) {
  this.fire('blur', elem);
};

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c,d){c=(typeof c == 'function')?c:d;
var m={exports:{}};c(function(n){return w[n];},m.exports,m);w[n]=m.exports;};})
('NavigationManager',this));
