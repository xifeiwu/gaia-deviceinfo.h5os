/**
*   h5-tabs
*     <h5-tabs></h5-tabs>
*     var tabs = new h5osTabs();
*
*   options for open method:
*     {items:[{textRaw:'item1', l10nId: 'ITEM1'},
*             {textRaw:'item2', l10nId: 'ITEM2'}]}
*
*   Methods
*     tabs.open(options);
*     tabs.nextStep();
*     tabs.backStep();
*     tabs.add({textRaw: 'new item', l10nId: 'NEW ITEM'});
*     tabs.remove(index);
*
*/

;(function(define){'use strict';define(['require','exports','module'],function(require,exports,module){
  const template = `<div class="tabs-wrapper">
    <button data-icon="back" class="back action-button" type="button">
      back
    </button>
    <h1 class="title"></h1>
    <button data-icon="forward" class="forward action-button" type="button">
      forward
    </button>
  </div>
  <div class="indicator-wrapper inactive">
  </div>
  <style>
    /** Inner
   ---------------------------------------------------------*/

  .tabs-wrapper, 
  .indicator-wrapper {
    display: flex;
    min-height: 50px;
    direction: ltr;
    -moz-user-select: none;

    background: #ff9500;
  }

  .indicator-wrapper {
    display: flex;
    min-height: 8px;
    background: #ee9500;
  }

  .indicator-wrapper.inactive {
    display: none;
  }

  .indicator-wrapper span{
    flex: 1;
    display: block;
    height: 8px;
    background: #ee5900;
  }

  .indicator-wrapper span.active{
    background: #ee9500;
  }

  .action-button {
    position: relative;

    display: flex; /* 1 */
    width: 50px;
    font-size: 30px;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;

    align-items: center;
    background: none;
    cursor: pointer;
    transition: opacity 200ms 280ms;
    color:#fff;

    font-weight: 500;
    font-family: "gaia-icons";
    font-style: normal;
    text-rendering: optimizelegibility;
  }

  .action-button:active {
    transition: none;
    opacity: 0.2;
  }

  .action-button.inactive {
    display: none;
  }

  h1.title {
    flex: 1;
    margin: 0;
    padding: 0;
    overflow: hidden;

    white-space: nowrap;
    text-overflow: ellipsis;
    text-align: center;
    line-height: 50px; /* 1 */
    font-weight: 300;
    font-style: italic;
    font-size: 24px;

    color:#fff;
  }
  </style>`;

  // Extend from the HTMLElement prototype
  var proto = Object.create(HTMLElement.prototype);
  // Register and return the constructor
  proto.createdCallback = function() {
    // init
    this._init();
    // setup ShadowRoot
    this._setupShadowRoot();
  };

  proto._init = function () {
    this.items = [];
    this.cursorIndex = 0;
    this.eles = {};

    // default close
    this.setAttribute('hidden', 'true');
  };

  proto._bindAll = function () {
    if (Object.keys(this.eles).length === 0) {
      return;
    }
    this.eles.back.addEventListener('click', this);
    this.eles.forward.addEventListener('click', this);
  };

  proto._detachedAll = function () {
    if (Object.keys(this.eles).length === 0) {
      return;
    }
    this.eles.back.removeEventListener('click', this);
    this.eles.forward.removeEventListener('click', this);
  };

  proto._setupShadowRoot = function () {
    this.createShadowRoot().innerHTML = this.template();

    return this.shadowRoot;
  };

  proto.open = function (options) {
    // setup elements
    this.eles = {
      back: this.shadowRoot.querySelector('.back'),
      forward: this.shadowRoot.querySelector('.forward'),
      title: this.shadowRoot.querySelector('.title'),
      indicator: this.shadowRoot.querySelector('.indicator-wrapper')
    }

    // bind event
    this._bindAll();

    this.items = options.items;
    this._render();
  };

  proto.close = function () {
    this._detachedAll();
    this._init();
  };

  proto._render = function() {
    if (this.items.length === 0) {
      this.close();
      return;
    }
    // implement rendering here.
    this._initCursor();
    this._updateTitle();
    this._initIndicator();
    this._initButton();
    this.removeAttribute('hidden');
  };

  proto._initCursor = function() {
    var item = this.items[this.cursorIndex];
    if (typeof item !== 'undefined') {
      return;
    }

    // reset cursor
    this.cursorIndex = 0;
  };

  proto.addItem = function(item) {
    if (typeof item.textRaw === 'undefined') {
      return;
    }

    if (this.items.length === 0) {
      var options = {items:[]};
      options.items.push(item);
      this.open(options);
    } else {
      this._add(item);
    }
  };

  proto._add = function(item) {
    this.items.push(item);
    this._initIndicator();
    this._initButton();
    if (this.items.length === 2) {
      this._bindAll();
    }
  };

  proto.removeItem = function(index) {
    if (typeof this.items[index] === 'undefined') {
      console.warn('no item!!!');
      return;
    }
    this._remove(index);
  };

  proto._remove = function(index) {
    this.items.splice(index, 1);
    if (this.items.length < 2) {
      this._detachedAll();
    }
    this._render();
  };

  proto.handleEvent = function (e) {
    switch (e.type ) {
      // case 'keydown':
      //   this._handleKeyDownEvent(e);
      //   break;
      case 'click':
        this._handleClikEvent(e);
        break;
      default:
        break;
    }
  };

  proto._handleClikEvent = function(e) {
    switch (e.target) {
      case this.eles.back:
        this.backStep();
        break;
      case this.eles.forward:
        this.nextStep();
        break;
      default:
        break;
    }
  };

  proto.nextStep = function () {
    this._moveCusor(1);
  };

  proto.backStep = function () {
    this._moveCusor(-1);
  };

  proto._moveCusor = function (step) {
    this.cursorIndex =
                  (this.cursorIndex +  parseInt(step, 10)) % this.items.length;
    if ( this.cursorIndex < 0) {
      this.cursorIndex = this.cursorIndex + this.items.length;
    }
    this._updateUI();
  };

  proto._updateUI = function () {
    this._updateTitle();
    this._updateIndicator();
  };

  proto._updateTitle = function () {
    var item = this.items[this.cursorIndex];
    this.eles.title.textContent = item.textRaw;
    if (item.l10nId) {
      this.eles.title.dataset.l10nId = item.l10nId;
    }
  };

  proto._initButton = function () {
    if (this.items.length < 2) {
      this.eles.back.classList.add('inactive');
      this.eles.forward.classList.add('inactive');
    } else {
      this.eles.back.classList.remove('inactive');
      this.eles.forward.classList.remove('inactive');
    }
  };

  proto._initIndicator = function () {
    // clean up indicator first
    this.eles.indicator.innerHTML = '';

    // we don't need to generate indicator when items less than 2.
    var itemsCount = this.items.length;
    if (itemsCount < 2) {
      // inactive indicator
      this.eles.indicator.classList.add('inactive');
      return;
    }

    var docFragment = document.createDocumentFragment();
    for (var i =0; i < itemsCount; i++) {
        var span = document.createElement('span');
        docFragment.appendChild(span);
    }

    this.eles.indicator.appendChild(docFragment);

    this.eles.indicator.classList.remove('inactive');
    this._updateIndicator();
  };

  proto._updateIndicator = function () {
    var matches = this.eles.indicator.querySelectorAll('span');
    var activeSpan = this.eles.indicator.querySelector('span.active');
    if (activeSpan) {
      activeSpan.classList.remove('active');
    }
    matches[this.cursorIndex].classList.add('active');
  };

  proto.template = function () {
    return template;
  };

  /**
   * Return the current index of the selected tab.
   * @return {Number}
   */
  proto.getCursor = function() {
    return this.cursorIndex;
  };

  module.exports = 
              document.registerElement('h5-tabs', { prototype: proto });

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c,d){c=(typeof c == 'function')?c:d;var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('H5Tabs',this));
