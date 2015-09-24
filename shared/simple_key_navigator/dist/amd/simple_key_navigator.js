define(['exports', 'module'], function (exports, module) {
  /**
   * SimpleKeyNavigator provides a way to manage key navigation easily. There are
   * manual mode and automatic mode. In manual mode you add the nodes and specify
   * where to navigate when key down event emits. In automatic mode you provide
   * selectors of the focusable nodes and SimpleKeyNavigator applies a default
   * navigation for you.
   *
   * Note that a node can be a DOM element or a SimpleKeyNavigator. Therefore you
   * can create nested navigation if necessary.
   *
   * Manually mode:
   *
   * @example
   *   var simpleKeyNavigator = SimpleKeyNavigator.create(root);
   *   simpleKeyNavigator.add(element1, {
   *     default: true,
   *     [SimpleKeyNavigator.NAV_KEY.UP]: null,
   *     [SimpleKeyNavigator.NAV_KEY.DOWN]: element2
   *   });
   *   simpleKeyNavigator.add(element2, {
   *     [SimpleKeyNavigator.NAV_KEY.UP]: element1,
   *     [SimpleKeyNavigator.NAV_KEY.DOWN]: element3
   *   });
   *   simpleKeyNavigator.add(element3, {
   *     'ArrowLeft': elemen2,
   *     'ArrowRight': elemen4
   *   });
   *   simpleKeyNavigator.add(element4, {
   *     [SimpleKeyNavigator.NAV_KEY.UP]: elemen3,
   *     [SimpleKeyNavigator.NAV_KEY.DOWN]: null
   *   });
   *
   * Automatic mode:
   *
   * @example
   *   var simpleKeyNavigator =
   *     SimpleKeyNavigator.create(root, '.class1, .class2');
   *
   * @module modules/key_navigator
   */
  'use strict';

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  var NAV_KEY = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight'
  };

  var KEY_CODE_MAPPING = new Map([[KeyboardEvent.DOM_VK_DOWN, NAV_KEY.DOWN], [KeyboardEvent.DOM_VK_UP, NAV_KEY.UP], [KeyboardEvent.DOM_VK_LEFT, NAV_KEY.LEFT], [KeyboardEvent.DOM_VK_RIGHT, NAV_KEY.RIGHT]]);

  /**
   * @class SimpleKeyNavigator
   * @params {HTMLElement} root
   * @params {String} selector
   * @returns {SimpleKeyNavigator}
   */
  function SimpleKeyNavigator(root, selector) {
    this._root = root;
    this._active = false;

    this._nodes = null;
    this._mutationObserver = null;

    this._curFocus = null;
    this._defaultFocus = null;
    this._nodeMap = new WeakMap();

    root.addEventListener('keydown', this);
    root.addEventListener('focus', this, true);
    root.addEventListener('no-available-focus', this);
    if (selector) {
      this.setSelector(selector);
    }
  }

  Object.defineProperty(SimpleKeyNavigator.prototype, 'curFocus', {
    enumerable: true,
    get: function get() {
      return this._curFocus;
    }
  });

  /**
   * Construct the node map using the nodes using default navigation options.
   *
   * @access private
   * @memberOf SimpleKeyNavigator.prototype
   * @params {Array} nodes
   * @returns {WeakMap}
   */
  SimpleKeyNavigator.prototype._consturctNodeMap = function (nodes) {
    var map = new WeakMap();
    nodes.forEach((node, index) => {
      var _map$set;

      var prevNode = nodes[index - 1] || null;
      var nextNode = nodes[index + 1] || null;
      map.set(node, (_map$set = {}, _defineProperty(_map$set, NAV_KEY.UP, prevNode), _defineProperty(_map$set, NAV_KEY.DOWN, nextNode), _map$set));
    });
    return map;
  };

  /**
   * Calculate the new focuses given the mutations and the different versions
   * of the nodes.
   *
   * @access private
   * @memberOf SimpleKeyNavigator.prototype
   * @params {Array.<MutationRecord>} mutations
   * @params {Array} originalNodes
   * @params {Array} newNodes
   * @params {Object} curFocus
   * @params {Object} defaultFocus
   * @returns {Object} result
   *                   New focuses.
   * @returns {Object} result.focus
   * @returns {Object} result.defaultFocus
   */
  SimpleKeyNavigator.prototype._getNewFocuses = function (mutations, originalNodes, newNodes, curFocus, defaultFocus) {
    var newFocus = curFocus;
    var newDefaultFocus = defaultFocus;

    mutations && mutations.forEach(mutation => {
      var removedNodes = Array.prototype.slice.call(mutation.removedNodes);
      var isCurFocusRemoved = removedNodes.indexOf(curFocus) > -1;
      var isDefaultFocusRemoved = removedNodes.indexOf(defaultFocus) > -1;

      if (isCurFocusRemoved) {
        var originalIndex = originalNodes.indexOf(curFocus);
        // The current focus has been removed and we need to find a new focus.
        newFocus = newNodes[Math.min(originalIndex, newNodes.length - 1)];
      }
      if (isDefaultFocusRemoved) {
        newDefaultFocus = null;
      }
    });

    return {
      focus: newFocus,
      defaultFocus: newDefaultFocus
    };
  };

  /**
   * Get the next nodes give the current node and an action.
   * XXX: If the action is not provided, we find the node using the following
   * order: NAV_KEY.DOWN, NAV_KEY.RIGHT, NAV_KEY.UP, NAV_KEY.LEFT.
   *
   * @access private
   * @memberOf SimpleKeyNavigator.prototype
   * @params {Object} curNode
   * @params {String=} action
   * @returns {Object}
   */
  SimpleKeyNavigator.prototype._getNextNode = function (curNode, action) {
    var navOption = this._nodeMap.get(curNode);
    if (!navOption) {
      return;
    }
    if (action) {
      return navOption[action];
    } else {
      var nextNode;
      [NAV_KEY.DOWN, NAV_KEY.RIGHT, NAV_KEY.UP, NAV_KEY.LEFT].some(action => {
        nextNode = navOption[action];
        return !!nextNode;
      });
      return nextNode;
    }
  };

  /**
   * Get the action given the keyCode of the keydown event.
   * XXX: This is for development only, because right now we cannot get correct keyEvent.key
   * on device with the fake keypad.
   *
   * @access private
   * @memberOf SimpleKeyNavigator.prototype
   * @params {Object} evt
   * @returns {String} one of NAV_KEY.UP, NAV_KEY.DOWN, NAV_KEY.LEFT or
   *                   NAV_KEY.RIGHT, which depends on the keyCode or just evt.key if it is
   *                   not "Unidentified".
   */
  SimpleKeyNavigator.prototype._getAction = function (evt) {
    if (evt.key === 'Unidentified') {
      return KEY_CODE_MAPPING.get(evt.keyCode);
    } else {
      return evt.key;
    }
  };

  /**
   * Refresh the nodes, the node map, and the default focus based on the
   * mutations.
   *
   * @access private
   * @memberOf SimpleKeyNavigator.prototype
   * @params {Array.<MutationRecord>} mutations
   */
  SimpleKeyNavigator.prototype._refreshNodes = function (mutations) {
    var originalNodes = this._nodes;
    var newNodes = Array.prototype.slice.call(this._root.querySelectorAll(this._selector));

    if (newNodes.length === 0) {
      this._nodes = [];
      this._curFocus = null;
      this._defaultFocus = null;
      if (this._active) {
        this._root.dispatchEvent(new CustomEvent('no-available-focus', {
          bubbles: true,
          cancelable: true
        }));
      }
      return;
    }

    var newFocuses = this._getNewFocuses(mutations, originalNodes, newNodes, this._curFocus, this._defaultFocus);
    var newNodeMap = this._consturctNodeMap(newNodes);

    this._nodes = newNodes;
    this._nodeMap = newNodeMap;

    // Update the focuses
    this._defaultFocus = newFocuses.defaultFocus || newNodes[0];
    // Focus the new element.
    if (this._active && newFocuses.focus) {
      this.focus(newFocuses.focus);
    }
  };

  /**
   * Return the mutation observer. Create one if it does not exit.
   *
   * @access private
   * @memberOf SimpleKeyNavigator.prototype
   * @returns {Object}
   */
  SimpleKeyNavigator.prototype._getMutationObserver = function () {
    if (!this._mutationObserver) {
      this._mutationObserver = new MutationObserver(this._refreshNodes.bind(this));
    }
    return this._mutationObserver;
  };

  SimpleKeyNavigator.prototype.handleEvent = function (event) {
    switch (event.type) {
      case 'keydown':
        if (event.key !== 'Unidentified' && [NAV_KEY.DOWN, NAV_KEY.RIGHT, NAV_KEY.UP, NAV_KEY.LEFT].indexOf(event.key) < 0) {
          return;
        } else if (event.keyCode && [KeyEvent.DOM_VK_UP, KeyEvent.DOM_VK_DOWN, KeyEvent.DOM_VK_LEFT, KeyEvent.DOM_VK_RIGHT].indexOf(event.keyCode) < 0) {
          return;
        }
      /* falls through */
      case 'no-available-focus':
        if (event.type === 'keydown' || event.type === 'no-available-focus' && event.target !== this._root) {
          var nextNode = this._curFocus;
          var success = false;
          do {
            var action = this._getAction(event);
            nextNode = this._getNextNode(nextNode, action);
            if (nextNode) {
              success = this.focus(nextNode);
            }
          } while (!success && nextNode);

          if (success) {
            event.stopPropagation();
            event.preventDefault();
          }
        }
        break;
      case 'focus':
        if (event.target === this._root) {
          // Focus on the default focus of this group.
          if (this._curFocus) {
            this.focus(this._curFocus);
          } else {
            this.focus(this._defaultFocus);
          }
        } else {
          // The target is within the group, update the focus.
          if (this._nodeMap.has(event.target)) {
            this._curFocus = event.target;
          }
        }
        break;
    }
  };

  /**
   * Set selector to the navigator. The selector are used to select all
   * focusable items under the root element. The existing node map will be
   * reconstructed.
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   * @params {String} selector
   */
  SimpleKeyNavigator.prototype.setSelector = function (selector) {
    this._selector = selector;
    if (this._selector) {
      this._getMutationObserver().observe(this._root, {
        childList: true,
        subtree: true
      });
    } else {
      this._getMutationObserver().disconnect();
    }
    this._refreshNodes();
  };

  /**
   * Add a node to the navigator. navOptions is used to specify where to
   * navigate when a key down event emits. Add the name of the key to navOptions
   * and set the value to the node to be navigated.
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   * @params {SimpleKeyNavigator|HTMLElement} node
   * @params {Object} navOptions
   * @params {Boolean=} navOptions.default
   *                    Indicating whether this is the default focus.
   */
  SimpleKeyNavigator.prototype.add = function (node, navOptions) {
    if (this._selector) {
      throw new Error('Update is not allowed when selector are set.');
    }
    this._nodeMap.set(node, navOptions);
    if (navOptions['default']) {
      this._defaultFocus = node;
    }
  };

  /**
   * Remove a node from the navigator.
   *
   * @params {Object} node
   */
  SimpleKeyNavigator.prototype.remove = function (node) {
    if (this._selector) {
      throw new Error('Update is not allowed when selector are set.');
    }
    this._nodeMap['delete'](node);
  };

  /**
   * Update the navigation option of a node.
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   * @params {SimpleKeyNavigator|HTMLElement} node
   */
  SimpleKeyNavigator.prototype.update = function (node, navOptions) {
    if (this._selector) {
      throw new Error('Update is not allowed when selector are set.');
    }
    if (!this._nodeMap.has(node)) {
      return;
    }
    this._nodeMap.set(node, navOptions);
  };

  /**
   * Focus on a node. Returns a boolean indicating whether the call success or
   * not.
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   * @params {SimpleKeyNavigator|HTMLElement=} node
   * @returns {Boolean} Indicates whether the focus success.
   */
  SimpleKeyNavigator.prototype.focus = function (node) {
    node = node || this._curFocus || this._defaultFocus;
    if (!node) {
      // Let upper navigator find the next node.
      return false;
    }
    if (!this._nodeMap.has(node)) {
      // The node is not managed by the navigator.
      return false;
    }
    if (this._active && this._curFocus === node && document.activeElement === node) {
      return true;
    }

    if (node instanceof HTMLElement) {
      // dom elements
      this.setActive();
      node.focus();
      return true;
    } else {
      // key navigators
      if (node.focus()) {
        if (this._curFocus) {
          this._curFocus.setInactive();
        }
        // There is no focus event for non-HTML elements, set curFocus manually.
        this._curFocus = node;
        return true;
      } else {
        return false;
      }
    }
  };

  /**
   * Remove the focus from the current focused item.
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   */
  SimpleKeyNavigator.prototype.blur = function () {
    var node = this._curFocus;
    if (node) {
      if (node instanceof HTMLElement) {
        this.setInactive();
        this._curFocus = null;
        node.blur();
      } else {
        node.blur();
      }
    }
  };

  /**
   * Set the navigator to active. (the current focus is managed by this
   * navigator)
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   */
  SimpleKeyNavigator.prototype.setActive = function () {
    this._active = true;
  };

  /**
   * Set the navigator to inactive.
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   */
  SimpleKeyNavigator.prototype.setInactive = function () {
    this._active = false;
  };

  /**
   * Destructor, remove event listeners and destroy root element and
   * inner-state.
   *
   * @access public
   * @memberOf SimpleKeyNavigator.prototype
   */
  SimpleKeyNavigator.prototype.destroy = function () {
    if (this._root) {
      this._root.removeEventListener('keydown', this);
      this._root.removeEventListener('focus', this, true);
      this._root.removeEventListener('no-available-focus', this);
    }
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
    }

    this._root = null;
    this._nodes = null;
    this._mutationObserver = null;

    this._curFocus = null;
    this._defaultFocus = null;
    this._nodeMap = null;
  };

  module.exports = Object.freeze({
    NAV_KEY: Object.freeze(NAV_KEY),
    create: function create(root, selector) {
      return new SimpleKeyNavigator(root, selector);
    }
  });
});
