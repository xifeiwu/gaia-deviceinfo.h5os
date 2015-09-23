window.addEventListener("load", function() {
  console.log("Hello World!");
});

window.addEventListener('keydown', function(evt) {
  var elem = evt.target;
  // handle range input
  if ((evt.keyCode === KeyEvent.DOM_VK_UP ||
       evt.keyCode === KeyEvent.DOM_VK_DOWN) &&
      elem.tagName === 'INPUT' && elem.getAttribute('type') === 'range') {
    evt.preventDefault();
  } else if (elem.hasAttribute('disabled') &&
             evt.keyCode === KeyEvent.DOM_VK_RETURN) {
    evt.stopImmediatePropagation();
    evt.preventDefault();
  }
}, true);
