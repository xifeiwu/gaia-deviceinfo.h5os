/**
*   h5-tabs-view
*   <h5-tabs-view>
*     <TAGNAME data-tabtitle ="title"></TAGNAME>
*     <TAGNAME data-tabtitle ="title"></TAGNAME>
*     <TAGNAME data-tabtitle ="title"></TAGNAME>
*     <TAGNAME data-tabtitle ="title"></TAGNAME>
*   </h5-tabs-view>
*   Methods
*     tabview.open();
*     tabview.nextStep();
*     tabview.backStep();
*
*/

(function(win) {
  'use strict';

  const template = `
    <h5-tabs class="title"></h5-tabs>
    <div class="container">
      <content></content>
    </div>
    <style>

      h5-tabs-view {
        display: block;
      }

      .container {
        width: 100%;
        height: calc(100% - 58px);
      }

      .container.single {
        height: calc(100% - 50px);
      }

    </style>
  `;
  // Extend from the HTMLElement prototype
  var proto = Object.create(HTMLElement.prototype);
  // Register and return the constructor
  proto.createdCallback = function() {
    // init
    this._init();

    // setup ShadowRoot
    this._setupShadowRoot();
    this.tabs = this.shadowRoot.querySelector('.title');
    this.container = this.shadowRoot.querySelector('.container');

    // open it
    this.open();
  };

  proto._init = function () {
    this.childElements = [];
    this.tabs = {};

    // default close
    this.setAttribute('hidden', 'true');
  };

  proto._setupShadowRoot = function () {
    this.createShadowRoot().innerHTML = this.template();

    return this.shadowRoot;
  };

  proto.template = function () {
    return template;
  };

  proto._bindAll = function () {
    if (this.childElements < 2) {
      return;
    }
    var eles = this.tabs.eles;
    eles.back.addEventListener('click', this);
    eles.forward.addEventListener('click', this);
  };

  proto._detachedAll = function () {
    if (this.childElements < 2) {
      return;
    }
    var eles = this.tabs.eles;
    eles.back.removeEventListener('click', this);
    eles.forward.removeEventListener('click', this);
  };

  proto.open = function () {
    if (!this.hasChildNodes()) {
      return;
    }

    this._initAllChildElements();

    if (this.childElements.length === 0) {
      return;
    }

    this.setupStyle();
    this.showChild(0);
    this.removeAttribute('hidden');

    // bind event
    this._bindAll();
  };

  proto.setupStyle = function (index) {
    if (this.childElements.length > 2) {
      return;
    }

    this.classList.add('single');
    this.container.classList.add('single');
  }

  proto.showChild = function (index) {
    // make sure only one child should be shown.
    this._hideAllChildElements();

    index = parseInt(index, 10);
    this.childElements[index].style.display = '';
  };

  proto.addElement = function (element) {
    if (typeof element === 'undefined') {
      console.warn('incorrect element');
      return;
    }
    this._add(element);
  };

  proto._add = function (element) {
    var item = this._getElementInfo(element);
    this.tabs.addItem(item);
    this.appendChild(element);
    this.childElements.push(element);
    this.showChild(this.tabs.cursorIndex);
  };

  proto.removeElement = function (index) {
    var item = this.childElements[index];
    if (item) {
      this._remove(index);
    }
  };

  proto._remove = function (index) {
    var item = this.childElements[index];
    if (item) {
      this.tabs.removeItem(index);
      this.removeChild(item);
      this.childElements.splice(index, 1);
      this.showChild(this.tabs.cursorIndex);
    }
  };

  proto._initAllChildElements = function () {
    var children = this.childNodes;
    var tabItems = {items:[]};
    var item = {};
    var child;
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        item = this._getElementInfo(child);
        this.childElements.push(child);
        tabItems.items.push(item);
      }
    }
    this._enableTabs(tabItems);
  };

  proto._getElementInfo = function (element) {
    var item = {};
    item.textRaw = element.dataset.tabtitle ? element.dataset.tabtitle : element.tagName;
    if (element.dataset.tabl10n) {
      item.l10nId = element.dataset.tabl10n;
    }
     return item;
  };

  proto._hideAllChildElements = function () {
    var children = this.childElements;
    for (var i = 0; i < children.length; i++) {
      children[i].style.display = 'none';
    }
  };

  proto._enableTabs = function (tabItems) {
    if (tabItems.items.length < 1) {
      return;
    }
    this.tabs.open(tabItems);
  };

  proto.handleEvent = function (e) {
    var eles = this.tabs.eles;
    switch(e.target) {
      case eles.back:
      case eles.forward:
        this.showChild(this.tabs.cursorIndex);
        break;
    }
  };

  proto.nextStep = function () {
    this.tabs.nextStep();
    this.showChild(this.tabs.cursorIndex);
  };

  proto.backStep = function () {
    this.tabs.backStep();
    this.showChild(this.tabs.cursorIndex);
  };

  win.H5TabsView = 
            document.registerElement('h5-tabs-view', { prototype: proto });
})(window);
