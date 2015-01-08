;(function(undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize packages:
  sigma.utils.pkg('sigma.misc');

  /**
   * This helper will bind any DOM renderer (for instance svg)
   * to its captors, to properly dispatch the good events to the sigma instance
   * to manage clicking, hovering etc...
   *
   * It has to be called in the scope of the related renderer.
   */
  sigma.misc.bindDOMEvents = function(container) {
    var self = this,
        graph = this.graph;

    // DOMElement abstraction
    function Element(domElement) {

      // Helpers
      this.attr = function(attrName) {
        return domElement.getAttributeNS(null, attrName);
      };

      // Properties
      this.tag = domElement.tagName;
      this.class = this.attr('class');
      this.id = this.attr('id');


      // Methods
      this.isNode = function() {
        return this.class && !!~this.class.indexOf(self.settings('classPrefix') + '-node');
      };

      this.isEdge = function() {
        return this.class && !!~this.class.indexOf(self.settings('classPrefix') + '-edge');
      };

      this.isHover = function() {
        return this.class && !!~this.class.indexOf(self.settings('classPrefix') + '-hover');
      };
    }

    function findMatchingElement(domElement, testFunctions, iterationCounter) {

      if (typeof testFunctions === 'string') {
        testFunctions = [testFunctions];
      }

      if (!self.settings('traverseDom')) {
        var element = new Element(domElement);
        for (var i1 = 0; i1 < testFunctions.length; i1++) {
          if (element[testFunctions[i1]]()) {
            return element;
          }
        }
        return null;
      }

      if (!('parentNode' in domElement)) {
        return null;
      }
      if (typeof iterationCounter === 'undefined') {
        iterationCounter = 0;
      }
      if (iterationCounter > self.settings('traverseDomInterrupt')) {
        return null;
      }

      var cssClass = domElement.getAttributeNS(null, 'class');
      if (cssClass === null) {
        return findMatchingElement(domElement.parentNode, testFunctions, iterationCounter+1);
      }
      if (!!~cssClass.indexOf(self.settings('classPrefix') + '-svg')) {
        return null;
      }

      var e = new Element(domElement);

      for (var i2 = 0; i2 < testFunctions.length; i2++) {
        if (e[testFunctions[i2]]()) {
          return e;
        } else {
          return findMatchingElement(domElement.parentNode, testFunctions, iterationCounter+1);
        }
      }

      return null;
    }

    // Click
    function click(e) {
      if (!self.settings('eventsEnabled'))
        return;

      // Generic event
      self.dispatchEvent('click', e);

      // Are we on a node?
      var element = findMatchingElement(e.target, 'isNode');

      if (element !== null)
        self.dispatchEvent('clickNode', {
          node: graph.nodes(element.attr('data-node-id'))
        });
      else
        self.dispatchEvent('clickStage');

      e.preventDefault();
      e.stopPropagation();
    }

    // Double click
    function doubleClick(e) {
      if (!self.settings('eventsEnabled'))
        return;

      // Generic event
      self.dispatchEvent('doubleClick', e);

      // Are we on a node?
      var element = findMatchingElement(e.target, 'isNode');

      if (element !== null)
        self.dispatchEvent('doubleClickNode', {
          node: graph.nodes(element.attr('data-node-id'))
        });
      else
        self.dispatchEvent('doubleClickStage');

      e.preventDefault();
      e.stopPropagation();
    }

    // On over
    function onOver(e) {
      var target = e.toElement || e.target;

      if (!self.settings('eventsEnabled') || !target)
        return;

      var el = findMatchingElement(target, ['isNode', 'isEdge']);

      if (el === null) {
        return;
      }

      if (el.isNode()) {
        self.dispatchEvent('overNode', {
          node: graph.nodes(el.attr('data-node-id'))
        });
      }
      else if (el.isEdge()) {
        var edge = graph.edges(el.attr('data-edge-id'));
        self.dispatchEvent('overEdge', {
          edge: edge,
          source: graph.nodes(edge.source),
          target: graph.nodes(edge.target)
        });
      }
    }

    // On out
    function onOut(e) {
      var target = e.fromElement || e.originalTarget;

      if (!self.settings('eventsEnabled'))
        return;

      var el = findMatchingElement(target, ['isNode', 'isEdge']);

      if (el === null) {
        return;
      }

      if (el.isNode()) {
        self.dispatchEvent('outNode', {
          node: graph.nodes(el.attr('data-node-id'))
        });
      }
      else if (el.isEdge()) {
        var edge = graph.edges(el.attr('data-edge-id'));
        self.dispatchEvent('outEdge', {
          edge: edge,
          source: graph.nodes(edge.source),
          target: graph.nodes(edge.target)
        });
      }
    }

    // Registering Events:

    // Click
    container.addEventListener('click', click, false);
    sigma.utils.doubleClick(container, 'click', doubleClick);

    // Touch counterparts
    sigma.utils.doubleClick(container, 'touchstart', doubleClick);

    // Mouseover
    container.addEventListener('mouseover', onOver, true);

    // Mouseout
    container.addEventListener('mouseout', onOut, true);
  };
}).call(this);
