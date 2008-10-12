/*
    Copyright 2008, 
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.

*/
    
/**
 * @fileoverview The geometry object Circle is defined in this file. Circle stores all
 * style and functional properties that are required to draw and move a circle on
 * a board.
 * @author graphjs
 * @version 0.1
 */

/**
 * Constructs a new Circle object.
 * @class This is the Cirlce class. 
 * It is derived from @see GeometryElement.
 * It stores all properties required
 * to move, draw a circle.
 * @constructor
 * @param {String,Board} board The board the new circle is drawn on.
 * @param {String} method Can be 
 * <ul><li> <b>'twoPoints'</b> which means the circle is defined by its midpoint and a point on the circle.</li>
//  * <li><b>'pointRadius'</b> which means the circle is defined by its midpoint and its radius in user units</li>
 * <li><b>'pointLine'</b> which means the circle is defined by its midpoint and its radius given by the distance from the startpoint and the endpoint of the line</li>
 * <li><b>'pointCircle'</b> which means the circle is defined by its midpoint and its radius given by the radius of another circle</li></ul>
 * The parameters p1, p2 and radius must be set according to this method parameter.
 * @param {Point} p1 Midpoint of the circle.
 * @param {Point/Line/Circle} p2 Can be
 *<ul><li>a point on the circle if method is 'twoPoints'</li>
 <li>a line if the method is 'pointLine'</li>
 <li>a circle if the method is 'pointCircle'</li></ul>
 * @param {float} radius Only used when method is set to 'pointRadius'. Must be a given radius in user units.
 * @param {String} id Unique identifier for this object. If null or an empty string is given,
 * an unique id will be generated by Board
 * @param {String} name Not necessarily unique name. If null or an
 * empty string is given, an unique name will be generated.
 * @see Board#generateName
 */            

JXG.Circle = function (board, method, par1, par2, id, name) { 
    /* Call the constructor of GeometryElement */
    this.constructor();
    this.init(board, id, name);

    /**
     * Sets type of GeometryElement, value is OBJECT_TYPE_CIRCLE.
     * @final
     * @type int
     */
    this.type = JXG.OBJECT_TYPE_CIRCLE;
    this.elementClass = JXG.OBJECT_CLASS_CIRCLE;                

    /**
     * Stores the given method.
     * Can be 
     * <ul><li><b>'twoPoints'</b> which means the circle is defined by its midpoint and a point on the circle.</li>
     * <li><b>'pointRadius'</b> which means the circle is defined by its midpoint and its radius given in user units or as term</li>
     * <li><b>'pointLine'</b> which means the circle is defined by its midpoint and its radius given by the distance from the startpoint and the endpoint of the line</li>
     * <li><b>'pointCircle'</b> which means the circle is defined by its midpoint and its radius given by the radius of another circle</li></ul>
     * @type string
     * @see #midpoint
     * @see #point2
     * @see #radius
     * @see #line
     * @see #circle
     */
    this.method = method;
    
    /**
     * The circles midpoint.
     * @type Point
     */    
    this.midpoint = JXG.GetReferenceFromParameter(this.board, par1); 
    this.midpoint.addChild(this);
    
    this.visProp['fillColor'] = 'none';
    this.visProp['highlightFillColor'] = 'none';
    this.visProp['visible'] = true;
    
    /** Point on the circle
     * only set if method is 'twoPoints'
     * @type Point
     * @see #method
     */
    this.point2 = null;
    
    /** Radius of the circle
     * only set if method is 'pointRadius'
     * @type Point
     * @see #method     
     */    
    this.radius = 0;
    
    /** Line defining the radius of the circle given by the distance from the startpoint and the endpoint of the line
     * only set if method is 'pointLine'
     * @type Line
     * @see #method     
     */    
    this.line = null;
    
    /** Circle defining the radius of the circle given by the radius of the other circle
     * only set if method is 'pointLine'
     * @type Circle
     * @see #method     
     */     
    this.circle = null;
    
    if(method == 'twoPoints') {
        this.point2 = JXG.GetReferenceFromParameter(board,par2);
        this.point2.addChild(this);
        this.radius = this.getRadius(); 
        this.id = this.board.addCircle(this);           
    }
    else if(method == 'pointRadius') {
        this.generateTerm(par2);  // Converts GEONExT syntax into JavaScript syntax
        this.updateRadius();                        // First evaluation of the graph
        this.id = this.board.addCircle(this);
        this.notifyParents(par2);      
    }
    else if(method == 'pointLine') {
        // dann ist p2 die Id eines Objekts vom Typ Line!
        this.line = JXG.GetReferenceFromParameter(board,par2);
        this.radius = this.line.point1.coords.distance(JXG.COORDS_BY_USER, this.line.point2.coords);
        this.line.addChild(this);
        this.id = this.board.addCircle(this);        
    }
    else if(method == 'pointCircle') {
        // dann ist p2 die Id eines Objekts vom Typ Circle!
        this.circle = JXG.GetReferenceFromParameter(board,par2);
        this.radius = this.circle.getRadius();
        this.circle.addChild(this);
        this.id = this.board.addCircle(this);        
    }    
};
JXG.Circle.prototype = new JXG.GeometryElement;

/**
 * Checks whether (x,y) is near the circle.
 * @param {int} x Coordinate in x direction, screen coordinates.
 * @param {int} y Coordinate in y direction, screen coordinates.
 * @return {bool} True if (x,y) is near the circle, False otherwise.
 */
JXG.Circle.prototype.hasPoint = function (x, y) {
    var genauigkeit = 5/(this.board.unitX*this.board.zoomX); // uebergangsweise = 5px
    
    var checkPoint = new JXG.Coords(JXG.COORDS_BY_SCREEN, [x,y], this.board);
    var r = this.getRadius();
    
    var dist = Math.sqrt(Math.pow(this.midpoint.coords.usrCoords[1]-checkPoint.usrCoords[1],2) + 
                         Math.pow(this.midpoint.coords.usrCoords[2]-checkPoint.usrCoords[2],2));
   
    return (Math.abs(dist-r) < genauigkeit);
};


/**
 * Uses the boards renderer to update the arrow.
 */
JXG.Circle.prototype.update = function () {
    if(this.traced) {
        this.cloneToBackground(true);
    }
    
    if (this.needsUpdate) {
        if(this.method == 'pointLine') {
            this.radius = this.line.point1.coords.distance(JXG.COORDS_BY_USER, this.line.point2.coords); 
        }
        else if(this.method == 'pointCircle') {
            this.radius = this.circle.getRadius();
        }
        else if(this.method == 'pointRadius') {
            this.radius = this.updateRadius();
        }
        if (!this.board.geonextCompatibilityMode) {
            this.updateStdform();
        }
    }
};

JXG.Circle.prototype.updateStdform = function () {
    this.stdform[3] = 0.5;
    this.stdform[4] = this.getRadius();
    this.stdform[1] = -this.midpoint.coords.usrCoords[1];
    this.stdform[2] = -this.midpoint.coords.usrCoords[2];
    this.normalize();
};

/**
 * Uses the boards renderer to update the arrow.
 */
JXG.Circle.prototype.updateRenderer = function () {
/*
    if (this.needsUpdate) {
        this.board.renderer.updateCircle(this);
        this.needsUpdate = false;
    }
*/
    if (this.needsUpdate && this.visProp['visible']) {
        var wasReal = this.isReal;
        this.isReal = (isNaN(this.midpoint.coords.usrCoords[1]+this.midpoint.coords.usrCoords[2]+this.getRadius()))?false:true;
        if (this.isReal) {
            if (wasReal!=this.isReal) { 
                this.board.renderer.show(this); 
                //if(this.label.show) this.board.renderer.show(this.label); 
            }
            this.board.renderer.updateCircle(this);
        } else {
            if (wasReal!=this.isReal) { 
                this.board.renderer.hide(this); 
                //if(this.label.show) this.board.renderer.hide(this.label); 
            }
        }
        this.needsUpdate = false;
    }
};

JXG.Circle.prototype.generateTerm = function (term) {
    if (typeof term=='string') {
         var elements = this.board.elementsByName;
         // Convert GEONExT syntax into  JavaScript syntax
         var newTerm = this.board.algebra.geonext2JS(term+'');
         this.updateRadius = new Function('return ' + newTerm + ';');
    } else if (typeof term=='number') {
        this.updateRadius = function() { return term; };
    } else { // function
        this.updateRadius = term;
    }
}    

JXG.Circle.prototype.notifyParents = function (contentStr) {
    var res = null;
    var elements = this.board.elementsByName;

    this.board.algebra.findDependencies(this,contentStr+'');
}

/**
 * Calculates the radius of the circle, independent from the used method.
 * @type float
 * @return The radius of the line
 */
JXG.Circle.prototype.getRadius = function() {
    if(this.method == 'twoPoints') {
        return(Math.sqrt(Math.pow(this.midpoint.coords.usrCoords[1]-this.point2.coords.usrCoords[1],2) + Math.pow(this.midpoint.coords.usrCoords[2]-this.point2.coords.usrCoords[2],2)));
    }
    else if(this.method == 'pointLine' || this.method == 'pointCircle') {
        return this.radius;
    }
    else if(this.method == 'pointRadius') {
        return this.updateRadius();
    }
}

/**
 * return TextAnchor
 */
JXG.Circle.prototype.getTextAnchor = function() {
    return this.midpoint.coords;
};

/**
 * Copy the element to the background.
 */
JXG.Circle.prototype.cloneToBackground = function(addToTrace) {
    var copy = {};
    copy.id = this.id + 'T' + this.numTraces;
    this.numTraces++;
    copy.midpoint = {};
    copy.midpoint.coords = this.midpoint.coords;
    var r = this.getRadius();
    copy.getRadius = function() { return r; };
    copy.board = {};
    copy.board.unitX = this.board.unitX;
    copy.board.unitY = this.board.unitY;
    copy.board.zoomX = this.board.zoomX;
    copy.board.zoomY = this.board.zoomY;

    copy.visProp = this.visProp;
    
    this.board.renderer.drawCircle(copy);
    this.traces[copy.id] = $(copy.id);

    delete copy;
};

JXG.Circle.prototype.addTransform = function (transform) {
    var list;
    if (JXG.IsArray(transform)) {
        list = transform;
    } else {
        list = [transform];
    }
    for (var i=0;i<list.length;i++) {
        this.midpoint.transformations.push(list[i]);
        if (this.method == 'twoPoints') {
            this.point2.transformations.push(list[i]);
        }
    }
};

JXG.Circle.prototype.setPosition = function (method, x, y) {
    //if(this.group.length != 0) {
    // AW: Do we need this for lines?
    //} else {
    var t = this.board.createElement('transform',[x,y],{type:'translate'});
    this.addTransform(t);
        //this.update();
    //}
};

JXG.createCircle = function(board, parentArr, atts) {
    var el;
    if( (parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT) && (parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT) ) {
        // Point/Point
        el = new JXG.Circle(board, 'twoPoints', parentArr[0], parentArr[1], atts['id'], atts['name']);

    } else if( ( JXG.IsNumber(parentArr[0]) || JXG.IsFunction(parentArr[0]) || JXG.IsString(parentArr[0])) && (parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT) ) {
        // Number/Point
        el = new JXG.Circle(board, 'pointRadius', parentArr[1], parentArr[0], atts['id'], atts['name']);
    } else if( ( JXG.IsNumber(parentArr[1]) || JXG.IsFunction(parentArr[1]) || JXG.IsString(parentArr[1])) && (parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT) ) {
        // Point/Number
        el = new JXG.Circle(board, 'pointRadius', parentArr[0], parentArr[1], atts['id'], atts['name']);
    } else if( (parentArr[0].type == JXG.OBJECT_TYPE_CIRCLE) && (parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT) ) {
        // Circle/Point
        el = new JXG.Circle(board, 'pointCircle', parentArr[1], parentArr[0], atts['id'], atts['name']);
    } else if( (parentArr[1].type == JXG.OBJECT_TYPE_CIRCLE) && (parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT)) {
        // Point/Circle
        el = new JXG.Circle(board, 'pointCircle', parentArr[0], parentArr[1], atts['id'], atts['name']);
    } else if( (parentArr[0].type == JXG.OBJECT_TYPE_LINE) && (parentArr[1].elementClass == JXG.OBJECT_CLASS_POINT)) {
        // Circle/Point
        el = new JXG.Circle(board, 'pointLine', parentArr[1], parentArr[0], atts['id'], atts['name']);
    } else if( (parentArr[1].type == JXG.OBJECT_TYPE_LINE) && (parentArr[0].elementClass == JXG.OBJECT_CLASS_POINT)) {
        // Point/Circle
        el = new JXG.Circle(board, 'pointLine', parentArr[0], parentArr[1], atts['id'], atts['name']);
    } else
        throw ("Can't create circle with parent types '" + (typeof parentArr[0]) + "' and '" + (typeof parentArr[1]) + "'.");
    
    return el;
};

JXG.JSXGraph.registerElement('circle', JXG.createCircle);
