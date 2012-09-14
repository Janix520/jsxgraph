
JXG.extend(JXG, {

    /**
     * Generates a deep copy of an array,
     * removes the duplicate entries and returns it.
     * @param arr Array
     */
    uniqueArray: function(arr) {

        var i, j, isArray, ret = [];

        if (arr.length === 0) {
            return new Array();
        }

        isArray = GUI.isArray(arr[0]);

        for (i=0; i<arr.length; i++) {
            for (j=i+1; j<arr.length; j++) {

                if (isArray && JXG.cmpArrays(arr[i], arr[j])) {
                    arr[i] = [];
                } else if (!isArray && arr[i] === arr[j]) {
                    arr[i] = "";
                }
            }
        }

        j = 0;

        for (i=0; i<arr.length; i++) {
            if (!isArray && arr[i] !== "") {
                ret[j] = arr[i];
                j++;
            } else if (isArray && arr[i].length !== 0) {
                ret[j] = (arr[i].slice(0));
                j++;
            }
        }

        return ret;
    },

    /**
     * Checks if an array contains an element, which equals to val
     */

    isInArray: function(arr, val) {

        for (var i=0; i<arr.length; i++)
            if (arr[i] == val)
                return true;

        return false;
    },

    GENTYPE_ABC: 1, // unused
    GENTYPE_AXIS: 2,
    GENTYPE_MID: 3,
    GENTYPE_REFLECTION: 4,
    GENTYPE_MIRRORPOINT: 5,
    GENTYPE_TANGENT: 6,
    GENTYPE_PARALLEL: 7,
    GENTYPE_BISECTORLINES: 8,
    GENTYPE_PERPENDICULAR_BISECTOR: 9,
    GENTYPE_BISECTOR: 10,
    GENTYPE_NORMAL: 11,
    GENTYPE_POINT: 12,
    GENTYPE_GLIDER: 13,
    GENTYPE_INTERSECTION: 14,
    GENTYPE_CIRCLE: 15,
    GENTYPE_CIRCLE2POINTS: 16,
    GENTYPE_LINE: 17,
    GENTYPE_TRIANGLE: 18,
    GENTYPE_QUADRILATERAL: 19,
    GENTYPE_TEXT: 20,
    GENTYPE_POLYGON: 21,
    GENTYPE_REGULARPOLYGON: 22,
    GENTYPE_SECTOR: 23,
    GENTYPE_ANGLE: 24,
    GENTYPE_PLOT: 25,
    GENTYPE_SLIDER: 26,
    GENTYPE_XYZ: 27, // unused ...
    GENTYPE_JCODE: 28,
    GENTYPE_MOVEMENT: 29,

    // 30 ... 32 // unused ...

    GENTYPE_GRID: 33, // obsolete

    // 34 ... 39 // unused ...

    GENTYPE_DELETE: 41,
    GENTYPE_COPY: 42,
    GENTYPE_MIRROR: 43,
    GENTYPE_ROTATE: 44,
    GENTYPE_TRANSLATE: 45,
    GENTYPE_TRANSFORM: 46,

    // 47 ... 50 // unused ...

/*
     Important:
     ==========

     For being able to differentiate between the (GUI-specific) CTX and
     (CORE-specific) non-CTX steps, the non-CTX steps must not be changed
     to values > 50 !!!
*/

    GENTYPE_CTX_TYPE_G: 51,
    GENTYPE_CTX_TYPE_P: 52,
    GENTYPE_CTX_TRACE: 53,
    GENTYPE_CTX_VISIBILITY: 54,
    GENTYPE_CTX_CCVISIBILITY: 55,
    GENTYPE_CTX_MPVISIBILITY: 56,
    GENTYPE_CTX_WITHLABEL: 57,
    GENTYPE_CTX_SETLABEL: 58,
    GENTYPE_CTX_SETFIXED: 59,
    GENTYPE_CTX_STROKEWIDTH: 60,
    GENTYPE_CTX_LABELSIZE: 61,
    GENTYPE_CTX_SIZE: 62,
    GENTYPE_CTX_FACE: 63,
    GENTYPE_CTX_STRAIGHT: 64,
    GENTYPE_CTX_ARROW: 65,
    GENTYPE_CTX_COLOR: 66,
    GENTYPE_CTX_RADIUS: 67,
    GENTYPE_CTX_COORDS: 68,
    GENTYPE_CTX_TEXT: 69,
    GENTYPE_CTX_ANGLERADIUS: 70,
    GENTYPE_CTX_DOTVISIBILITY: 71,
    GENTYPE_CTX_FILLOPACITY: 72,
});

JXG.SketchReader = {

    // configure the generator below
    generator: {
        toFixed: 0,
        freeLine: false,
        useGlider: false,
        useSymbols: false
    },

    generateJCode: function (step, board, step_log) {

        // step has to be an objectliteral of the form: { type, args, src_ids, dest_sub_ids, dest_id }

        var options, assign, attrid, obj, type;

        var	i, j, k, sub_id, str, str1, str2, objects, pid1, pid2, xstart, ystart, el, bo, arr,
            xy, sxy, sxyc, step2, copy_log = [];

        var set_str = '', reset_str = '', ctx_set_str = '', ctx_reset_str = '';

        options = JXG.SketchReader.generator;

        objects = board.objects;

        // print number -- helper to prepare numbers
        // for printing, e.g. trim them with toFixed()

        var pn = function (v) {
            if (options.toFixed > 0)
                v = v.toFixed(options.toFixed);
            return v;
        };

        var getObject = function(v) {
            var o;

            if (options.useSymbols) {
                if (board.jc.sstack[0][v]) {
                    o = board.jc.sstack[0][v];
                } else {
                    o = objects[v];
                }
            } else {
                o = objects[v];
            }

            return o;
        };

        /* SKETCHBIN begin */

        assign = '';
        attrid = 'id: \'' + step.dest_id + '\', ';

        if (JXG.exists(board) && options.useSymbols && step.type !== JXG.GENTYPE_TRANSLATE) {
            attrid = '';
            assign = step.dest_id + ' = ';

            for (i = 0; i < step.src_ids.length; i++) {
                str = board.jc.findSymbol(getObject(step.src_ids[i]), 0); // Das Board wird hier immer benötigt!!!

                if (str.length > 0) {
                    step.src_ids[i] = str[0];
                }
            }
        }

        /* SKETCHBIN end */

        if (step.type > 50 && withCtxSetters == false)
            return;

        switch (step.type) {

            case JXG.GENTYPE_JCODE:
                set_str = step.args.code;
                break;

            case JXG.GENTYPE_AXIS:
                set_str = step.args.name[0] + ' = point(' + pn(step.args.coords[0].usrCoords[1]) + ', ';
                set_str += pn(step.args.coords[0].usrCoords[2]) +') <<id: \'' + step.dest_sub_ids[0] + '\', name: \'';
                set_str += step.args.name[0] + '\', fixed: true, priv: true, visible: false>>; ' + step.args.name[1];
                set_str += ' = point(' + pn(step.args.coords[1].usrCoords[1]) + ', ';
                set_str += pn(step.args.coords[1].usrCoords[2]) +') <<id: \'' + step.dest_sub_ids[1] + '\', name: \'';
                set_str += step.args.name[1] + '\', fixed: true, priv: true, visible: false>>; ' + step.args.name[2];
                set_str += ' = point(' + pn(step.args.coords[2].usrCoords[1]) + ', ';
                set_str += pn(step.args.coords[2].usrCoords[2]) +') <<id: \'' + step.dest_sub_ids[2] + '\', name: \'';
                set_str += step.args.name[2] + '\', fixed: true, priv: true, visible: false>>; ';

                set_str += step.args.name[3] + ' = axis(' + step.args.name[0] + ', ' + step.args.name[1] + ') ';
                set_str += '<<id: \'' + step.dest_sub_ids[3] + '\', name: \'' + step.args.name[3] + '\', ticks: ';
                set_str += '<<minorHeight:0, majorHeight:10, ticksDistance: ' + JXG.Options.axisScaleX;
                set_str += ', drawLabels: true>>>>; ';
                set_str += step.args.name[4] + ' = axis(' + step.args.name[0] + ', ' + step.args.name[2] + ') ';
                set_str += '<<id: \'' + step.dest_sub_ids[4] + '\', name: \'' + step.args.name[4] + '\', ticks: ';
                set_str += '<<minorHeight:0, majorHeight:10, ticksDistance: ' + JXG.Options.axisScaleY;
                set_str += ', drawLabels: true, drawZero: false>>>>; ';

                set_str += step.dest_sub_ids[3] + '.visible = false; ';
                set_str += step.dest_sub_ids[4] + '.visible = false; ';

                set_str += 'delete jxgBoard1_infobox; ';

                reset_str = 'delete ' + step.dest_sub_ids[4] + '; delete ' + step.dest_sub_ids[3];
                reset_str += '; delete ' + step.dest_sub_ids[2] + '; ';
                reset_str += 'delete '+ step.dest_sub_ids[1] + '; delete ' + step.dest_sub_ids[0] + '; ';

                break;

            case JXG.GENTYPE_MID:
                set_str = assign + 'midpoint(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<' + attrid;
                set_str += 'fillColor: \'' + step.args.fillColor + '\'>>; ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_REFLECTION:
                set_str = assign + 'reflection(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<' + attrid;
                set_str += 'fillColor: \'' + step.args.fillColor + '\'>>; ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_MIRRORPOINT:
                set_str = assign + 'mirrorpoint(' + step.src_ids[1] + ', ' + step.src_ids[0] + ') <<' + attrid;
                set_str += 'fillColor: \'' + step.args.fillColor + '\'>>; ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_TANGENT:
                if (step.args.create_point === true) {
                    sub_id = step.dest_sub_ids[2];
                    set_str = 'point(' + pn(step.args.usrCoords[1]) + ',' + pn(step.args.usrCoords[2]) + ') <<id: \'';
                    set_str += sub_id + '\', fillColor: \'' + step.args.fillColor + '\'>>; ' + sub_id + '.glide(';
                    set_str += step.src_ids[0] + '); ';
                    reset_str = 'delete ' + sub_id + '; ';
                } else
                    sub_id = step.src_ids[0];

                set_str += assign + 'tangent(' + sub_id + ') <<' + attrid + 'point1: <<name: \'' + step.dest_sub_ids[0];
                set_str += '\', id: \'' + step.dest_sub_ids[0] + '\'>>, point2: <<name: \'' + step.dest_sub_ids[1];
                set_str += '\', id: \'' + step.dest_sub_ids[1] + '\'>> >>; ';
                reset_str = 'delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[1] + '; ' + reset_str;
                break;

            case JXG.GENTYPE_PARALLEL:
                if (step.args.create_point === true) {
                    sub_id =  step.dest_sub_ids[1];
                    set_str = 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]) + ') <<id: \'';
                    set_str += sub_id + '\', name: \'\', visible: false, priv: true>>; ';
                    reset_str = 'delete ' + sub_id + '; ';
                } else
                    sub_id = step.src_ids[1];

                set_str += assign + 'parallel(' + step.src_ids[0] + ', ' + sub_id + ') <<' + attrid + 'point: <<id: \'';
                set_str += step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0] + '\'>> >>; ';
                reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                break;

            case JXG.GENTYPE_BISECTORLINES:
                set_str = 'bisectorlines(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<line1: <<id: \'';
                set_str = set_str + step.dest_sub_ids[2] + '\', point1: <<id: \'' + step.dest_sub_ids[1];
                set_str += '\', name: \'' + step.dest_sub_ids[1] + '\'>>, point2: <<id: \'' + step.dest_sub_ids[0];
                set_str += '\', name: \'' + step.dest_sub_ids[0] + '\'>>>>, line2: <<id: \'' + step.dest_sub_ids[5];
                set_str += '\', point1: <<id: \'' + step.dest_sub_ids[4] + '\', name: \'' + step.dest_sub_ids[4];
                set_str += '\'>>, point2: <<id: \'' + step.dest_sub_ids[3] + '\', name: \'' + step.dest_sub_ids[3];
                set_str += '\'>>>>>>; ';
                reset_str = 'delete ' + step.dest_sub_ids[5] + '; delete ' + step.dest_sub_ids[4] + '; delete ';
                reset_str += step.dest_sub_ids[3] + '; delete ' + step.dest_sub_ids[2] + '; delete ';
                reset_str += step.dest_sub_ids[1] + '; delete ' + step.dest_sub_ids[0] + '; ';
                break;

            case JXG.GENTYPE_PERPENDICULAR_BISECTOR:
                if (step.args.create_line === true) {
                    sub_id = step.dest_sub_ids[2];
                    set_str = 'line(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<id: \'' + sub_id;
                    set_str += '\', visible: true>>; ';
                    reset_str = 'delete ' + sub_id + '; ';
                } else
                    sub_id = step.src_ids[2];

                set_str += 'midpoint(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<id: \'' + step.dest_sub_ids[0];
                set_str += '\', fillColor: \'' + step.args.fillColor + '\'>>; ';
                set_str += assign + 'normal(' + step.dest_sub_ids[0] + ', ' + sub_id + ') <<' + attrid;
                set_str += ' point: <<id: \'' + step.dest_sub_ids[1] + '\', name: \'' + step.dest_sub_ids[1];
                set_str += '\'>> >>; ';
                reset_str = 'delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[1] + '; ' + reset_str;
                break;

            case JXG.GENTYPE_BISECTOR:
                set_str = assign + 'bisector(' + step.src_ids[1] + ', ' + step.src_ids[2] + ', ' + step.src_ids[0];
                set_str += ') <<' + attrid + 'point: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'';
                set_str += step.dest_sub_ids[0] + '\'>>>>; ';
                reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ';
                break;

            case JXG.GENTYPE_NORMAL:
                if (step.args.create_point === true) {
                    sub_id = step.dest_sub_ids[1];
                    set_str = 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                    set_str += ') <<id: \'' + sub_id + '\', name: \'\', visible: false, priv: true>>; ';
                    reset_str = 'delete ' + sub_id + '; ';
                } else
                    sub_id = step.src_ids[1];

                set_str += assign + 'normal(' + sub_id + ', ' + step.src_ids[0] + ') <<' + attrid;
                set_str += 'point: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0];
                set_str += '\'>> >>; ';
                reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ' + reset_str;
                break;

            case JXG.GENTYPE_POINT:
                set_str = assign + 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                set_str += ')' + ( options.useSymbols ? '' : ' <<id: \'' + step.dest_id + '\'>>') + ';';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_GLIDER:
                if (options.useGlider) {
                    set_str = assign + 'glider(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                    set_str += ', ' + step.src_ids[0] + ')';
                    set_str += ( options.useSymbols ? '' : '<<id: \'' + step.dest_id + '\'>>') + ';';
                } else {
                    set_str = assign + 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                    set_str += ') <<' + attrid + ' fillColor: \'' + step.args.fillColor + '\'>>; ' + step.dest_id;
                    set_str += '.glide(' + step.src_ids[0] + '); ';
                }
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_INTERSECTION:
                set_str = assign + 'intersection(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.args.choice;
                set_str += ') <<' + attrid + ' fillColor: \'' + step.args.fillColor + '\'>>; ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_CIRCLE:
                reset_str = 'delete ' + step.dest_sub_ids[0] + '; ';

                if (step.args.create_point === true || step.args.create_midpoint === true) {

                    if (step.args.create_point === true) {
                        set_str = 'point(' + pn(step.args.usrCoords[1]) + ', ' + pn(step.args.usrCoords[2]);
                        set_str += ') <<id: \'' + step.dest_sub_ids[0] + '\', priv: false>>; ';
                    } else {
                        set_str = 'midpoint(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<id: \'';
                        set_str += step.dest_sub_ids[0] + '\', name: \'\', visible: false>>; ';
                    }

                    set_str += assign + 'circle(' + step.dest_sub_ids[0] + ', ' + step.src_ids[0] + ') <<' + attrid;
                    set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                } else if (step.args.create_by_radius === true) {
                    set_str = 'point(' + pn(step.args.x) + ', ' + pn(step.args.y) + ') <<id: \'' + step.dest_sub_ids[0];
                    set_str += '\', name: \'\', withLabel: true, visible: true, priv: false>>; ';
                    set_str += step.dest_sub_ids[0] + '.visible = false; ';
                    set_str += assign + 'circle(\'' + step.dest_sub_ids[0] + '\', ' + pn(step.args.r) + ') <<' + attrid;
                    set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ';
                } else {
                    set_str = assign + 'circle(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.src_ids[2];
                    set_str += ') <<center: <<id: \'' + step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0];
                    set_str += '\'>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + ' >>; ';
                    reset_str = 'delete ' + step.dest_id + '; ' + reset_str;
                }

                break;

            case JXG.GENTYPE_CIRCLE2POINTS:
                if (step.args.create_two_points === true) {
                    set_str = 'point(' + pn(step.args.x1) + ', ' + pn(step.args.y1) + ') <<id: \''+ step.dest_sub_ids[0];
                    set_str += '\'>>; ';
                    set_str += 'point(' + pn(step.args.x2) + ', ' + pn(step.args.y2) + ') <<id: \'';
                    set_str += step.dest_sub_ids[1] + '\'>>; ';
                    set_str += assign + 'circle(' + step.dest_sub_ids[0] + ', ' + step.dest_sub_ids[1] + ') <<' + attrid;
                    set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[1] + '; delete ';
                    reset_str += step.dest_sub_ids[0] + '; ';
                } else if (step.args.create_point === true) {
                    set_str = 'point(' + pn(step.args.x) + ', ' + pn(step.args.y) + ') <<id: \''+ step.dest_sub_ids[0];
                    set_str += '\'>>; ';
                    set_str += assign + 'circle(' + step.dest_sub_ids[0] + ', ' + step.src_ids[0] + ') <<' + attrid;
                    set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[0] + '; ';
                } else if (step.args.create_by_radius === true) {
                    set_str = assign + 'circle(' + step.src_ids[0] + ', ' + step.args.r + ') <<' + attrid;
                    set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                } else {
                    set_str = assign + 'circle(' + step.src_ids[0] + ', ' + step.src_ids[1] + ') <<' + attrid;
                    set_str += ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                    reset_str = 'delete ' + step.dest_id + '; ';
                }

                break;

            case JXG.GENTYPE_LINE:
                k = 0;
                j = 0;

                if (step.args.create_point1 ) {
                    pid1 = step.dest_sub_ids[k++];
                    str1 = [];
                    for (i = 0; i < step.args.p1.length; i++)
                        str1[i] = pn(step.args.p1[i]);

                    set_str = 'point(' + str1.join(', ') + ') <<id: \'' + pid1 + '\', name: \'\', visible: false, ';
                    set_str += 'priv: true>>; ';
                    reset_str = 'delete ' + pid1 + '; ';
                } else
                    pid1 = step.src_ids[j++];

                if (step.args.create_point2) {
                    pid2 = step.dest_sub_ids[k++];
                    str1 = [];
                    for (i = 0; i < step.args.p2.length; i++)
                        str1[i] = pn(step.args.p2[i]);

                    set_str += 'point(' + str1.join(', ') + ') <<id: \'' + pid2 + '\', name: \'\', visible: false, ';
                    set_str += 'priv: true>>; ';
                    reset_str = 'delete ' + pid2 + '; ' + reset_str;
                } else
                    pid2 = step.src_ids[j++];

                str = 'line';
                str1 = '';

                // the line's parents
                str2 = pid1 + ', ' + pid2;

                // if we want a truly free line
                if (step.args.create_point1 && step.args.create_point2 && options.freeLine) {
                    // forget the points
                    set_str = '';
                    reset_str = '';

                    // use the stdform instead
                    if (step.args.p1.length === 2)
                        step.args.p1.unshift(1);

                    if (step.args.p2.length === 2)
                        step.args.p2.unshift(1);

                    str2 = JXG.Math.crossProduct(step.args.p1, step.args.p2);
                    for (i = 0; i < str2.length; i++)
                        str2[i] = pn(str2[i]);

                    str2 = str2.join(', ');
                }

                if (!step.args.first && !step.args.last)
                    str = 'segment';
                else {
                    if (!step.args.first)
                        str1 = 'straightFirst: ' + step.args.first;

                    if (!step.args.last)
                        str1 = 'straightLast: ' + step.args.last;

                    if (str1.length > 0 && !options.useSymbols)
                        str1 += ', ';
                }

                // this is a corner case, we have to get rid of the ',' at the end
                // simple solution: rebuild attrid
                if (!options.useSymbols)
                    attrid = ' id: \'' + step.dest_id + '\' ';

                set_str += assign + str + '(' + str2 + ')';
                set_str += (str1.length + attrid.length > 0 ? ' <<' + str1 + attrid + '>>' : '') + ';';
                reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                break;

            case JXG.GENTYPE_TRIANGLE:
                for (i=0; i<step.args.create_point.length; i++)
                    if (step.args.create_point[i] === true) {
                        set_str += 'point(' + pn(step.args.coords[i].usrCoords[1]) + ', ';
                        set_str += pn(step.args.coords[i].usrCoords[2]) + ') <<id: \'' + step.dest_sub_ids[i];
                        set_str += '\'>>; ';
                    }

                for (i=0; i<step.dest_sub_ids.length; i++)
                    if (step.dest_sub_ids[i] !== 0)
                        reset_str = 'delete ' + step.dest_sub_ids[i] + '; ' + reset_str;

                reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                set_str += assign + 'polygon(';

                for (i=0; i<step.src_ids.length; i++) {
                    set_str += step.src_ids[i];
                    if (i < step.src_ids.length-1)
                        set_str += ', ';
                }

                for (i=0; i<3; i++) {
                    if (step.dest_sub_ids[i] !== 0) {
                        if (step.src_ids.length > 0 || i > 0)
                            set_str += ', ';
                        set_str += step.dest_sub_ids[i];
                    }
                }

                set_str += ') <<borders: <<ids: [ \'' + step.dest_sub_ids[3] + '\', \'' + step.dest_sub_ids[4];
                set_str += '\', \'' + step.dest_sub_ids[5] + '\' ]>>, ' + attrid + ' fillOpacity: ';
                set_str += JXG.Options.opacityLevel + ', hasInnerPoints:true, scalable:true>>; ';
                break;

            case JXG.GENTYPE_QUADRILATERAL:
                for (i=0; i<step.args.create_point.length; i++)
                    if (step.args.create_point[i] === true) {
                        set_str += 'point(' + pn(step.args.coords[i].usrCoords[1]) + ', ';
                        set_str += pn(step.args.coords[i].usrCoords[2]) + ') <<id: \'' + step.dest_sub_ids[i];
                        set_str += '\'>>; ';
                    }

                for (i=0; i<step.dest_sub_ids.length; i++)
                    if (step.dest_sub_ids[i] !== 0)
                        reset_str = 'delete ' + step.dest_sub_ids[i] + '; ' + reset_str;

                reset_str = 'delete ' + step.dest_id + '; ' + reset_str;

                set_str += assign + 'polygon(';

                for (i=0; i<step.src_ids.length; i++) {
                    set_str += step.src_ids[i];
                    if (i < step.src_ids.length-1)
                        set_str += ', ';
                }

                set_str += ') <<borders: <<ids: [ \'' + step.dest_sub_ids[4] + '\', \'' + step.dest_sub_ids[5];
                set_str += '\', \'';
                set_str += step.dest_sub_ids[6] + '\', \'' + step.dest_sub_ids[7] + '\' ]>>, ' + attrid;
                set_str += ' fillOpacity: ';
                set_str += JXG.Options.opacityLevel + ', hasInnerPoints:true, scalable:true>>; ';
                break;

            case JXG.GENTYPE_TEXT:
                set_str = assign + 'text(' + pn(step.args.x) + ', ' + pn(step.args.y) + ', ' + step.args.str + ') <<';
                set_str += attrid + ' name: \'' + step.dest_id + '\'>>; ' + step.dest_id + '.setText(' + step.args.str;
                set_str += '); ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_POLYGON:
                set_str = assign + 'polygon(';

                for (i=0; i<step.src_ids.length; i++) {
                    set_str += step.src_ids[i];
                    if (i != step.src_ids.length-1)
                        set_str += ', ';
                }

                set_str += ') <<borders: <<ids: [ \'';

                for (i=0; i<step.dest_sub_ids.length; i++) {
                    set_str += step.dest_sub_ids[i];
                    if (i < step.dest_sub_ids.length-1)
                        set_str += '\', \'';
                }

                set_str += '\' ]>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + ' >>; ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_REGULARPOLYGON:
                set_str = assign + 'regularpolygon(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ';
                set_str += step.args.corners + ') <<borders: <<ids: [ ';

                for (i=0; i<step.args.corners; i++) {
                    set_str += '\'' + step.dest_sub_ids[i] + '\'';
                    if (i != step.args.corners-1)
                        set_str += ', ';
                    reset_str = 'delete ' + step.dest_sub_ids[i] + '; ' + reset_str;
                }

                set_str += ' ]>>, vertices: <<ids: [ ';

                for (i=0; i<step.args.corners-2; i++) {
                    set_str += '\'' + step.dest_sub_ids[i + parseInt(step.args.corners)] + '\'';
                    if (i != step.args.corners-3)
                        set_str += ', ';
                    reset_str = 'delete ' + step.dest_sub_ids[i + parseInt(step.args.corners)] + '; ' + reset_str;
                }

                set_str += ' ]>>, ' + attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + ' >>; ';
                reset_str = 'delete ' + step.dest_id + '; ' + reset_str;
                break;

            case JXG.GENTYPE_SECTOR:
                set_str = assign + 'sector(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.src_ids[2];
                set_str += ') <<';
                set_str += attrid + ' name: \'' + step.dest_id + '\', fillOpacity: ' + JXG.Options.opacityLevel;
                set_str += '>>; ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_ANGLE:
                set_str = assign + 'angle(' + step.src_ids[0] + ', ' + step.src_ids[1] + ', ' + step.src_ids[2];
                set_str += ') <<radiuspoint: << id: \'' + step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0];
                set_str += '\'>>, pointsquare: <<id: \'' + step.dest_sub_ids[1] + '\', name: \'' + step.dest_sub_ids[1];
                set_str += '\'>>, dot: <<id: \'' + step.dest_sub_ids[2] + '\', name: \'' + step.dest_sub_ids[2];
                set_str += '\'>>, ';
                set_str += attrid + ' fillOpacity: ' + JXG.Options.opacityLevel + '>>; ';
                reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[2] + '; delete ';
                reset_str += step.dest_sub_ids[1];
                reset_str += '; delete ' + step.dest_sub_ids[0] + '; ';
                break;

            case JXG.GENTYPE_PLOT:
                set_str = assign + step.args.plot_type + '(' + step.args.func + ') <<';

                if (step.args.isPolar)
                    set_str += 'curveType: \'polar\', ';

                set_str += attrid + ' name:\'' + step.dest_id + '\'>>; ';
                reset_str = 'delete ' + step.dest_id + '; ';
                break;

            case JXG.GENTYPE_SLIDER:
                set_str = assign + 'slider([' + pn(step.args.x1) + ', ' + pn(step.args.y1) + '], [' + pn(step.args.x2);
                set_str += ', ' + pn(step.args.y2) + '], [' + pn(step.args.start) + ', ' + pn(step.args.ini) + ', ';
                set_str += pn(step.args.end) + ']) <<' + attrid + ' name: \'' + step.dest_id + '\', baseline: <<id: \'';
                set_str += step.dest_sub_ids[0] + '\', name: \'' + step.dest_sub_ids[0] + '\'>>, highline: <<id: \'';
                set_str += step.dest_sub_ids[1] + '\', name: \'' + step.dest_sub_ids[1] + '\'>>, point1: <<id: \'';
                set_str += step.dest_sub_ids[2] + '\', name: \'' + step.dest_sub_ids[2] + '\'>>, point2: <<id: \'';
                set_str += step.dest_sub_ids[3] + '\', name: \'' + step.dest_sub_ids[3] + '\'>>, label: <<id: \'';
                set_str += step.dest_sub_ids[4] + '\', name: \'' + step.dest_sub_ids[4] + '\'>>>>; ';

                reset_str = 'delete ' + step.dest_id + '; delete ' + step.dest_sub_ids[4] + '; delete ';
                reset_str += step.dest_sub_ids[3] + '; delete ' + step.dest_sub_ids[2] + '; delete ';
                reset_str += step.dest_sub_ids[1] + '; delete ';
                reset_str += step.dest_sub_ids[0] + '; ';
                break;

            case JXG.GENTYPE_DELETE:

                arr = [];
                ctx_set_str = [];
                ctx_reset_str = [];

                for (i=0; i<step.args.steps.length; i++) {

                    console.log(step.args.steps[i]);

                    if (step_log[step.args.steps[i]].type > 50)
                        arr = GUI.generateJCode(step_log[step.args.steps[i]], board, step_log);
                    else
                        arr = JXG.SketchReader.generateJCode(step_log[step.args.steps[i]], board, step_log);

                    if (arr[2].trim() !== '')
                        set_str = arr[2] + set_str;
                    if (JXG.isFunction(arr[3]))
                        ctx_set_str.unshift(arr[3]);
                    if (arr[0].trim() !== '')
                        reset_str += arr[0];
                    if (JXG.isFunction(arr[1]))
                        ctx_reset_str.push(arr[1]);
                }

                break;

            case JXG.GENTYPE_COPY:

                copy_log = [];

                // Adapt the steps to the new IDs

                for (el in step.args.steps) {

                    if (step.args.steps.hasOwnProperty(el)) {
                        step2 = JXG.deepCopy(step_log[step.args.steps[el]]);

                        if (step2.type == JXG.GENTYPE_COPY) {

                            for (i=0; i<step2.args.map.length; i++)
                                for (j=0; j<step.args.map.length; j++)
                                    if (step2.args.map[i].copy == step.args.map[j].orig)
                                        step2.args.map[i].copy = step.args.map[j].copy;

                            step2 = JXG.SketchReader.replaceStepDestIds(step2, step2.args.map);
                        } else
                            step2 = JXG.SketchReader.replaceStepDestIds(step2, step.args.map);

                        copy_log.push(step2);
                    }
                }

                for (i=0; i<copy_log.length; i++) {

                    if (copy_log[i].type > 50)
                        arr = GUI.generateJCode(copy_log[i], board, step_log);
                    else
                        arr = JXG.SketchReader.generateJCode(copy_log[i], board, step_log);

                    if (arr[0].trim() !== '')
                        set_str += arr[0];
                    if (JXG.isFunction(arr[1]))
                        ctx_set_str.push(arr[1]);
                    if (arr[2].trim() !== '')
                        reset_str = arr[2] + reset_str;
                    if (JXG.isFunction(arr[3]))
                        ctx_reset_str.unshift(arr[3]);
                }

                // Apply the offset-translation to the free points of the copy

                if (step.args.dep_copy) {

                    for (i=0; i<step.args.map.length; i++) {
                        if (getObject(step.args.map[i].orig).elementClass == JXG.OBJECT_CLASS_POINT) {
                            set_str += step.args.map[i].copy;
                            set_str += '.X = function() { return (' + step.args.map[i].orig + '.X() - ';
                            set_str += pn(step.args.x) + '); }; ';
                            set_str += step.args.map[i].copy;
                            set_str += '.Y = function() { return (' + step.args.map[i].orig + '.Y() - ';
                            set_str += pn(step.args.y) + '); }; ';
                        }
                    }

                } else {

                    for (i=0; i<step.args.free_points.length; i++) {
                        xstart = getObject(step.args.free_points[i].orig).coords.usrCoords[1];
                        ystart = getObject(step.args.free_points[i].orig).coords.usrCoords[2];

                        set_str += step.args.free_points[i].copy + '.X = function() { return ';
                        set_str += pn(xstart - step.args.x) + '; }; ';
                        set_str += step.args.free_points[i].copy + '.Y = function() { return ';
                        set_str += pn(ystart - step.args.y) + '; }; ';
                        set_str += step.args.free_points[i].copy + '.free(); ';
                    }
                }

                for (j=0; j<step.args.map.length; j++) {
                    el = getObject(step.args.map[j].orig);

                    // Check if a radius-defined circle should be copied
                    if (el.type == JXG.OBJECT_TYPE_CIRCLE && el.point2 == null) {
                        // Make the radius of the circle copy depend on the original circle's radius
                        set_str += step.args.map[j].copy + '.setRadius(function () { return ';
                        set_str += step.args.map[j].orig + '.radius(); }); ';
                    }
                }

                break;

            case JXG.GENTYPE_TRANSLATE:

                xstart = getObject(step.src_ids[0]).coords.usrCoords[1];
                ystart = getObject(step.src_ids[0]).coords.usrCoords[2];

                set_str = 'point(' + pn(xstart - step.args.x) + ', ' + pn(ystart - step.args.y) + ') <<id: \'';
                set_str += step.dest_sub_ids[0] + '\'>>; ';
                set_str += 'circle(' + step.dest_sub_ids[0] + ', 1) <<id: \'' + step.dest_sub_ids[1];
                set_str += '\', fillOpacity: ' + JXG.Options.opacityLevel + ', visible: true>>; ' ;

                if (step.args.fids.length == 1)
                    step.args.func = step.args.fids[0] + '.radius()';
                else
                    step.args.func = 'dist(' + step.args.fids[0] + ', ' + step.args.fids[1] + ')';

                set_str += step.dest_sub_ids[1] + '.setRadius(function() { return ' + step.args.func + '; }); ' ;

                if (step.args.migrate != 0)
                    set_str += '$board.migratePoint(' + step.dest_sub_ids[0] + ', ' + step.args.migrate + '); ';
                else
                    reset_str += 'delete ' + step.dest_sub_ids[0] + '; ';

                reset_str = 'delete ' + step.dest_sub_ids[1] + '; ' + reset_str;

                break;

            case JXG.GENTYPE_TRANSFORM:

                set_str = step.dest_sub_ids[0] + ' = transform(' + step.args.tmat + ') <<type: \'generic\'>>; ';
                set_str += 'point(' + step.src_ids[0] + ', ' + step.dest_sub_ids[0] + ') <<id: \'' + step.dest_id;
                set_str += '\', visible: true>>; ';

                reset_str = 'delete ' + step.dest_id + '; ';
                reset_str += 'delete ' + step.dest_sub_ids[0] + '; ';

                break;

            case JXG.GENTYPE_MOVEMENT:

                if (step.args.obj_type == JXG.OBJECT_TYPE_LINE) {

                    set_str = step.src_ids[0] + '.move([' + pn(step.args.coords[0].usrCoords[0]) + ', ';
                    set_str += pn(step.args.coords[0].usrCoords[1]) + ', ' + pn(step.args.coords[0].usrCoords[2]) + ']); ';
                    reset_str = step.src_ids[0] + '.move([' + step.args.zstart[0] + ', ' + step.args.xstart[0] + ', ';
                    reset_str += step.args.ystart[0] + ']); ';

                    set_str += step.src_ids[1] + '.move([' + pn(step.args.coords[1].usrCoords[0]) + ', ';
                    set_str += pn(step.args.coords[1].usrCoords[1]) + ', ' + pn(step.args.coords[1].usrCoords[2]) + ']); ';
                    reset_str += step.src_ids[1] + '.move([' + step.args.zstart[1] + ', ' + step.args.xstart[1] + ', ';
                    reset_str += step.args.ystart[1] + ']); ';

                } else if (step.args.obj_type == JXG.OBJECT_TYPE_CIRCLE) {
                    set_str = step.src_ids[0] + '.move([' + pn(step.args.coords[0].usrCoords[1]) + ', ';
                    set_str += pn(step.args.coords[0].usrCoords[2]) + ']); ';
                    reset_str = step.src_ids[0] + '.move([' + step.args.xstart + ', ' + step.args.ystart + ']); ';

                    if (step.args.has_point2) {
                        set_str += step.src_ids[1] + '.move([' + pn(step.args.coords[1].usrCoords[1]) + ', ';
                        set_str += pn(step.args.coords[1].usrCoords[2]) + ']); ';
                        reset_str += step.src_ids[1] + '.move([' + step.args.old_p2x + ', ' + step.args.old_p2y;
                        reset_str += ']); ';
                    }

                } else if (step.args.obj_type == JXG.OBJECT_TYPE_GLIDER) {
                    set_str = step.src_ids[0] + '.setPosition(' + pn(step.args.position) + '); ';
                    reset_str = step.src_ids[0] + '.setPosition(' + step.args.xstart + '); ';

                } else if (step.args.obj_type == JXG.OBJECT_TYPE_POLYGON) {

                    set_str = reset_str = "";
                    console.log(step.src_ids.length);

                    for (i=0; i<step.src_ids.length; i++) {
                        set_str += step.src_ids[i] + '.move([' + pn(step.args.coords[i].usrCoords[1]) + ', ';
                        set_str += pn(step.args.coords[i].usrCoords[2]) + ']); ';
                        reset_str += step.src_ids[i] + '.move([' + step.args.xstart[i] + ', ' + step.args.ystart[i];
                        reset_str += ']); ';
                    }
                } else {
                    set_str = step.src_ids[0] + '.move([' + pn(step.args.coords[0].usrCoords[1]) + ', ';
                    set_str += pn(step.args.coords[0].usrCoords[2]) + ']); ';
                    reset_str = step.src_ids[0] + '.move([' + step.args.xstart + ', ' + step.args.ystart + ']); ';
                }

                break;

            default:
                return;
        }

        return [ set_str, ctx_set_str, reset_str, ctx_reset_str ];
    },

    replaceStepDestIds: function (step, id_map) {

        var i, j, copy_ids = [];

        for (i=0; i<id_map.length; i++) {
            copy_ids.push(id_map[i].copy);

            if (step.dest_id == id_map[i].orig)
                step.dest_id = id_map[i].copy;

            for (j=0; j<step.dest_sub_ids.length; j++)
                if (step.dest_sub_ids[j] == id_map[i].orig)
                    step.dest_sub_ids[j] = id_map[i].copy;

            for (j=0; j<step.src_ids.length; j++)
                if (step.src_ids[j] == id_map[i].orig)
                    step.src_ids[j] = id_map[i].copy;
        }

        for (j=0; j<step.dest_sub_ids.length; j++)
            if (!JXG.isInArray(copy_ids, step.dest_sub_ids[j]))
                step.dest_sub_ids[j] = GUI.id();


        step.src_ids = JXG.uniqueArray(step.src_ids);
        step.dest_sub_ids = JXG.uniqueArray(step.dest_sub_ids);

        return step;
    }

};