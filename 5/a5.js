function setup() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');

    // input related
    let sliderCount = 1;
    let sliders = [];
    let sliderVals = [];

    // animation timing related TODO?
    let start;                      // mark the start of time
    let elapsed;                    // time elapsed
    let cycle = 100000;                      // define length of an animation cycle

    // global variables
    let stack = [mat4.create()];    // array as stack for save and restore emulation
    let pls;                        // array containing all points describing the hermite curve
    let tObj;                       // record where the obj is through parameter t  FIXME
    let ridiculousness;             // adjustment of points relative positions
    let numPeople;                  // #people on the ride  FIXME
    
    // camera definition
    let viewAngle;
    let locCamera = vec3.create();
    let distCamera = 500.0;
    let T_look_at = mat4.create();

    function lookAtUpdate() {
        locCamera[0] = distCamera * Math.sin(radian(viewAngle));
        locCamera[1] = 100;
        locCamera[2] = distCamera * Math.cos(radian(viewAngle));
        mat4.lookAt(T_look_at, locCamera, [0, 0, 0], [0, 1, 0]);
    }

    // current time elapsed proportional to a cycle
    function getProportionInTime() { return elapsed%cycle/cycle; }

    // radian getter
    function radian(angle) { return angle*Math.PI/180; } 

    // pseudo canvas save
    function save() { stack.unshift(mat4.clone(stack[0])); }

    // pseudo canvas restore
    function restore() { stack.shift(); }

    // mat4.mutiply wrapper
    function mult(T) { return mat4.multiply(stack[0], stack[0], T); }
    
    // function to move pen in ctx using glmatrix
    function moveTo(loc) 
    { let pt = vec3.create(); vec3.transformMat4(pt, loc, stack[0]); ctx.moveTo(pt[0], pt[1]); }
    
    // function to draw to a pt in ctx using glmatrix
    function lineTo(loc) 
    { let pt = vec3.create(); vec3.transformMat4(pt, loc, stack[0]); ctx.lineTo(pt[0], pt[1]); }

    // arc wrapper (start/end slightly differ from original)     FIXME?
    function circle_xy(x, y, radius, start, end) 
    { for (let a = start; a < end; ++a) lineTo(x+radius*Math.cos(radian(a)), y+radius*Math.sin(radian(a))); }
    
    // fillRect wrapper w/ color    FIXME?
    function fillrect(x, y, w, h, color) {
        ctx.fillStyle = color; ctx.beginPath();
        moveTo(x, y); lineTo(x+w, y); lineTo(x+w, y+h); lineTo(x, y+h);
        ctx.closePath(); ctx.fill();
    }

    // helper axes 
    function drawGrid(color, size) {
        // maximum range in x, y, z axes
        let x = [-size, size]; let x_step = size/3;
        let y = [-size, size]; let y_step = size/3;
        let z = [-size, size]; let z_step = size/3;

        ctx.strokeStyle = color;
        ctx.lineWidth=2;
        ctx.beginPath();
        moveTo([x[0], 0, 0]); lineTo([x[1], 0, 0]); 
        moveTo([0, y[0], 0]); lineTo([0, y[1], 0]);
        moveTo([0, 0, z[0]]); lineTo([0, 0, z[1]]);
        ctx.stroke();

        ctx.strokeStyle = "#222";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let zz = z[0]; zz <= z[1]; zz += z_step) {
            for (let yy = y[0]; yy <= y[1]; yy += y_step)
            { moveTo([x[0], yy, zz]); lineTo([x[1], yy, zz]); }
            for (let xx = x[0]; xx <= x[1]; xx += x_step)
            { moveTo([xx, y[0], zz]); lineTo([xx, y[1], zz]); }
        }
        for (let yy = y[0]; yy <= y[1]; yy += y_step) {
            for (let xx = x[0]; xx <= x[1]; xx += x_step)
            { moveTo([xx, yy, z[0]]); lineTo([xx, yy, z[1]]); }
        }
        ctx.stroke();
    }
    
    // tiny cart to ride FIXME?
    // function roller(fillColor, strokeColor) {
    //     save();

    //     let cLen = 30; let cHei = 10; let dHei = 1;
    //     let headR = 4; let dStart = 2; let wheelR = 3;
    //     ctx.strokeStyle = strokeColor; ctx.beginPath();

    //     // transformation to let the center of cart stay on curve
    //     let T_to_roller_center = mat3.create();
    //     mat3.fromTranslation(T_to_roller_center, [-cLen/2, 0]);
    //     mult(T_to_roller_center);

    //     // cart
    //     fillrect(0, 0, cLen, cHei, fillColor);

    //     // body parts
    //     moveTo(cLen/2, cHei); lineTo(cLen/2, cHei+headR);   // neck
    //     moveTo(cLen/2, cHei); lineTo(cLen/2+8, cHei+5);
    //     moveTo(cLen/2, cHei); lineTo(cLen/2-8, cHei+5);
    //     ctx.stroke();
    //     ctx.closePath();
    //     // decorations
    //     fillrect(dStart, cHei/2-dHei, cLen-dStart-2, dHei*2, "#0a0");

    //     // head
    //     ctx.beginPath(); ctx.lineWidth = 3; ctx.fillStyle = "#333";
    //     circle(cLen/2, cHei+headR*2, headR, 0, 360);
    //     ctx.closePath(); ctx.stroke(); ctx.fill();

    //     // wheels
    //     ctx.beginPath(); ctx.fillStyle = "#080";
    //     circle(wheelR, 0, wheelR, 0, 360);
    //     ctx.closePath; ctx.stroke(); ctx.fill();
    //     ctx.beginPath(); ctx.fillStyle = "#080";
    //     circle(cLen-wheelR, 0, wheelR, 0, 360);
    //     ctx.closePath; ctx.stroke(); ctx.fill();

    //     restore();
    // }

    // function positionRoller(tObj) {
    //     save();

    //     // position
    //     let T_to_obj = mat3.create();
    //     mat3.fromTranslation(T_to_obj, composite(tObj, hermiteBasis));
    //     mat3.scale(T_to_obj, T_to_obj, [1/50, 1/50]);

    //     // rotation
    //     let T_to_obj_rot = mat3.create();
    //     let tan = composite(tObj, hermiteDerivative)
    //     let angle = Math.atan2(tan[1], tan[0]);
    //     mat3.rotate(T_to_obj_rot, T_to_obj_rot, angle);

    //     // apply transformation
    //     mult(T_to_obj); mult(T_to_obj_rot);
    //     roller("tan", "#ddd");

    //     restore();
    // }

    // update variables affected by sliders
    function sliderUpdate() {
        for(let i = 0; i < sliderCount; ++i)
            if (sliderVals[i] != sliders[i].value) {
                sliderVals[i] = (sliders[i].value); 
                if (i == 0) {
                    viewAngle = parseInt(sliders[0].value);
                    lookAtUpdate();
                }
            }
    }

    function sliderInit() {
        for(let i = 0; i < sliderCount; ++i) {
            sliders[i] = (document.getElementById('slider'+i)); 
            sliders[i].addEventListener("input", draw);
        }
        sliders[0].value = 0;                         // FIXME: manually adjustable viewAngle for now
        sliderUpdate();
    }
    
    let floorRadiusRange = [3/3, 10/3];
    function getFloorRadius(floor, maxFloor, midFloor) { 
        let r; 
        let min=floorRadiusRange[0]; 
        let range=floorRadiusRange[1]-floorRadiusRange[0];
        if (floor >= midFloor) r = min + range*(floor-midFloor)/(maxFloor-midFloor);
        else r = min + range*(midFloor-floor)/(maxFloor-(maxFloor-midFloor));
        return r;
    }

    function drawBuilding(maxFloor, midFloor, strokeColor, fillColor, roofColor) {
        let floorRadius;
        let rad;
        let startAngle = 90; 
        let angleJump = 360/30;
        let x; let y; let z;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        
        var isInvisible = function(angle) {
            let compareAngle = Math.abs(angle-startAngle);
            return compareAngle < viewAngle-90 | (compareAngle > viewAngle+90 && compareAngle < viewAngle+270);
        }
        
        var bottomToMiddle = function(angle) {
            ctx.beginPath();
            rad=radian(angle);
            x = floorRadiusRange[1]*Math.cos(rad);  // from the pt at floor 0, at this angle
            z = floorRadiusRange[1]*Math.sin(rad);
            moveTo([x, 0, z]);
            x = floorRadiusRange[0]*Math.cos(rad);  // to the pt at midFloor,  at this angle
            z = floorRadiusRange[0]*Math.sin(rad);
            lineTo([x, maxFloor-midFloor, z]);
            rad=radian(angle+angleJump);
            x = floorRadiusRange[0]*Math.cos(rad);  // to the pt at midFloor,  at the next angle
            z = floorRadiusRange[0]*Math.sin(rad);
            lineTo([x, maxFloor-midFloor, z]);
            x = floorRadiusRange[1]*Math.cos(rad);  // to the pt at floor 0,   at next angle
            z = floorRadiusRange[1]*Math.sin(rad);
            lineTo([x, 0, z]);
            ctx.closePath();
            ctx.stroke(); ctx.fillStyle = fillColor; ctx.fill();
        }
        
        var middleToTop = function(angle) {
            rad=radian(angle);
            x = floorRadiusRange[0]*Math.cos(rad);  // from the pt at midFloor, at this angle
            z = floorRadiusRange[0]*Math.sin(rad);
            moveTo([x, maxFloor-midFloor, z]);
            x = floorRadiusRange[1]*Math.cos(rad);  // to the pt at maxFloor,  at this angle
            z = floorRadiusRange[1]*Math.sin(rad);
            lineTo([x, maxFloor, z]);
            rad=radian(angle+angleJump);
            x = floorRadiusRange[1]*Math.cos(rad);  // to the pt at maxFloor,  at the next angle
            z = floorRadiusRange[1]*Math.sin(rad);
            lineTo([x, maxFloor, z]);
            x = floorRadiusRange[0]*Math.cos(rad);  // to the pt at midFloor,  at next angle
            z = floorRadiusRange[0]*Math.sin(rad);
            lineTo([x, maxFloor-midFloor, z]);
            ctx.closePath();
            ctx.stroke(); ctx.fillStyle = fillColor; ctx.fill();
            
        }

        var helipad = function(color) {
            let r = 2.5; moveTo([r, maxFloor, 0]);
            for (let angle=0; angle<=360; angle+=angleJump)
            { lineTo([r*Math.cos(radian(angle)), maxFloor, r*Math.sin(radian(angle))]); }
            ctx.closePath(); ctx.strokeStyle = color; ctx.stroke();

            save();
            let T_h_resize = mat4.create();
            mat4.scale(T_h_resize, T_h_resize, [0.35, 1, 0.2]);
            mult(T_h_resize);
            ctx.beginPath(); 
            ctx.beginPath();
            moveTo([-3, maxFloor, 1]);  lineTo([3, maxFloor, 1]);
            lineTo([3, maxFloor, 7]);   lineTo([5, maxFloor, 7]);
            lineTo([5, maxFloor, -7]);  lineTo([3, maxFloor, -7]);
            lineTo([3, maxFloor, -1]);  lineTo([-3, maxFloor, -1]);
            lineTo([-3, maxFloor, -7]); lineTo([-5, maxFloor, -7]);
            lineTo([-5, maxFloor, 7]);  lineTo([-3, maxFloor, 7]);
            ctx.closePath();
            ctx.fillStyle = color; ctx.fill();
            restore();
        }

        // color the body first
        for (let angle = startAngle; angle >= startAngle-360; angle -= angleJump) {
            if (isInvisible(angle)) continue;
            bottomToMiddle(angle);
            middleToTop(angle);
        }

        // then draw some contours of floors
        for (let floor = maxFloor; floor >= 0; floor--) {
            y = maxFloor-floor;
            floorRadius = getFloorRadius(floor, maxFloor, midFloor);

            ctx.beginPath();
            let startRadian = radian(startAngle);
            moveTo([floorRadius*Math.cos(startRadian), y, floorRadius*Math.sin(startRadian)]);
            for (let angle = startAngle; angle >= startAngle-360; angle -= angleJump) {
                rad = radian(angle)
                x = floorRadius*Math.cos(rad);
                z = floorRadius*Math.sin(rad);
                if (floor == 0) {
                    lineTo([x, y, z]);
                } else {
                    if (isInvisible(angle)) moveTo([x, y, z]);
                    else lineTo([x, y, z]);
                }
            }
            ctx.stroke();

            // top floor decoration
            if (floor == 0) { 
                ctx.fillStyle = roofColor; ctx.fill(); ctx.closePath(); 
                helipad("#000");        // additional ring and a "H"
            }
        }
    }

    // multiple building manipulation in hierarchy
    function positionBuildings(distance) {
        let maxFloor = 14, midFloor = 3;
        let strokeColor = "#262", bodyColor = "#000", roofColor = "#84735a";

        save();
        let T_to_left_building =mat4.create();
        mat4.fromTranslation(T_to_left_building, [-distance/2, 0, 0]);
        mult(T_to_left_building);
        drawBuilding(maxFloor, midFloor, strokeColor, bodyColor, roofColor);
        restore();

        save();
        let T_to_right_building =mat4.create();
        mat4.fromTranslation(T_to_right_building, [distance/2, 0, 0]);
        mult(T_to_right_building);
        drawBuilding(maxFloor, midFloor, strokeColor, bodyColor, roofColor);
        restore();
    }

    // hermite related 
    // initialization of a set of Hermite points
    function hermiteInit() {

        // helper to insert a point into an array in hermite cubic formatting
        let pushHermitePoint = function(p, d) 
        { let last = pls[pls.length-1]; pls.push([last[2], last[3], p, d]); }

        pls = [];
        // pls[0] = [[0, 0, 0],   [-1, 1, 0],
        //           [0.8, 1, 0],   [2.5, -0.7, 0]];
        // pushHermitePoint([10, -0, 0], [-20, 0, 0]);
        // pushHermitePoint([0, 0, 0], [-1, 1]);
        pls[0] = [[-15/2+10/3, 14, 0], [3, -1, 0],
                  [0, 10, 0], [8, 0, 0]];
        pushHermitePoint([-15/2-10/3, 14, 0], [3, 1, 0]);
    }

    function hermiteBasis(t) 
    { return [2*t*t*t-3*t*t+1, t*t*t-2*t*t+t, -2*t*t*t+3*t*t, t*t*t-t*t ]; }

	function hermiteDerivative(t) 
    { return [ 6*t*t-6*t, 3*t*t-4*t+1, -6*t*t+6*t, 3*t*t-2*t ]; }

    function hermiteCubic(Basis, P,t){
        let b = Basis(t);
        let result=vec2.create();
        vec2.scale(result,P[0],b[0]);
        vec2.scaleAndAdd(result,result,P[1],b[1]);
        vec2.scaleAndAdd(result,result,P[2],b[2]);
        vec2.scaleAndAdd(result,result,P[3],b[3]);
        return result;
    }
   
    // switch to different points in defined hermite curve at different t
    function composite(t, B) {
        for(let i = 0; i < pls.length; ++i) {
            if (i <= t && t < i+1)
                return hermiteCubic(B, pls[i], t<1 ? t : t%i);
            else if (t == pls.length) 
                return hermiteCubic(B, pls[pls.length-1], 1);
        }
    }

    function drawCurve(t0, t1, granularity, curve, T, color, P, thickness) {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();

        P ? moveTo(curve(hermiteBasis, P, t0), T) : moveTo(curve(t0), T);     // P == null -> not hermite
        for(let i = 0; i <= granularity; ++i) {
            let p = (granularity - i)/granularity;
            let t = p*t0 + (i/granularity)*t1;
            let coor = P ? curve(hermiteBasis, P, t) : curve(t); 
            lineTo(coor[0], coor[1]);
        }
        ctx.stroke();
    }

    // function shiftP(x, y) {
    //     for (let i = 1; i < pls.length; ++i) {
    //         pls[i][0][0] += x;
    //         pls[i][3][0] += x;
    //         pls[i][0][1] += y;
    //         pls[i][3][1] += y;
    //     }
    // }

    function draw(timestamp) {
        canvas.width = canvas.width;
        
        // capture changes and update related variables
        sliderUpdate();
        
        // calculate time elapsed for animation
        timestamp = Date.now();
        if (start === undefined) start = timestamp;
        elapsed = timestamp - start;

        // curve drawing
        save();                                             // main coordinate system
        let T_to_curve = mat4.create();
        let scale = 40;
        mat4.fromTranslation(T_to_curve, [canvas.width/2, canvas.width/2, 0]);
        mat4.scale(T_to_curve, T_to_curve, [scale, -scale, -scale]);
        mult(T_to_curve); mult(T_look_at);
        
        // reference grid 
        // if (sliders[3].value == 1) drawGrid("white");
        drawGrid("white", 30); // TODO: slider control?
        positionBuildings(25);
        
        // FIXME
        hermiteInit();
        for (let i = 0; i < pls.length; ++i)
            drawCurve(0, 1, 200, hermiteCubic, stack[0], "white", pls[i], 2);

        // curve drawing one by one
        // let shift = 0.04;
        // for(let track = 0; track < 1; ++track) {
        //     if (track == 1) shiftP(shift, shift);
        //     for(let i = 0; i < pls.length; ++i)
        //         drawCurve(0, 1, 200, hermiteCubic, T_to_curve, "white", pls[i], 2);
        //     if (track == 1) shiftP(-shift, -shift);
        // }

        // roller coaster
        // let t_diff = 2.5;
        // shiftP(shift/2, shift/2);
        // tObj = getProportionInTime() * pls.length;

        // for (let i in [...Array(numPeople).keys()]) {
        // for (let i = 0; i < numPeople; ++i)
        //     positionRoller((tObj+i*t_diff)%pls.length);
        // shiftP(-shift/2, -shift/2);

        restore();                                          // main coordinate system
    }
    sliderInit();      // put all sliders into array 'sliders' and update last value;
    draw(100);
}
window.onload=setup();
