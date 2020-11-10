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
    
    // camera definition
    let viewAngle;
    let locCamera = vec3.create();
    let distCamera = 500.0;
    let T_look_at = mat4.create();

    function lookAtUpdate() {
        locCamera[0] = distCamera * Math.sin(radian(viewAngle));
        locCamera[1] = 150;
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

    // initialization of a set of Hermite points
    function hermiteInit(distance, maxFloor) {
        // helper to insert a point into an array in hermite cubic formatting
        let pushHermitePoint = function(p, d) 
        { let last = pls[pls.length-1]; pls.push([last[2], last[3], p, d]); }

        let prop = viewAngle/360;
        let edgeX = distance/2-floorRadiusRange[1];
        let centerX = prop>0.5 ? (prop-0.5)/0.5*edgeX : -(0.5-prop)*edgeX*2;

        pls = [];
        pls[0] = [[-edgeX, maxFloor, 0], [3, -1, 0],
                  [centerX, maxFloor-1, 0], [10, 0, 0]];
        pushHermitePoint([edgeX, maxFloor, 0], [3, 1, 0]);
    }

    function hermiteCubic(Basis, P,t){
        let b = Basis(t);
        let result=vec3.create();
        vec3.scale(result,P[0],b[0]);
        vec3.scaleAndAdd(result,result,P[1],b[1]);
        vec3.scaleAndAdd(result,result,P[2],b[2]);
        vec3.scaleAndAdd(result,result,P[3],b[3]);
        return result;
    }
   
    function hermiteBasis(t) 
    { return [2*t*t*t-3*t*t+1, t*t*t-2*t*t+t, -2*t*t*t+3*t*t, t*t*t-t*t ]; }

	function hermiteDerivative(t) 
    { return [ 6*t*t-6*t, 3*t*t-4*t+1, -6*t*t+6*t, 3*t*t-2*t ]; }

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

        P ? moveTo(curve(hermiteBasis, P, t0)) : moveTo(curve(t0));
        for(let i = 0; i <= granularity; ++i) {
            let p = (granularity - i)/granularity;
            let t = p*t0 + (i/granularity)*t1;
            let coor = P ? curve(hermiteBasis, P, t) : curve(t); 
            lineTo(coor);
        }
        ctx.stroke();
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

    function drawBuilding(maxFloor, midFloor, buildingSide, strokeColor, roofColor) {
        let floorRadius;
        let rad;
        let startAngle = 90, startRadian = radian(startAngle);
        let angleJump = 360/30;
        let x; let y; let z;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        
        var isInvisible = function(angle) {
            let compareAngle = Math.abs(angle-startAngle);
            let va = viewAngle % 360;

            if (90 <= va && va < 270)
                return va+90 < compareAngle || compareAngle < (va+270)%360;
            else
                return (va+90)%360 < compareAngle && compareAngle < (va+270)%360;
        }
        var bottomToMiddle = function(angle, fillColor) {
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
        var middleToTop = function(angle, fillColor) {
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
        var roofBarrier = function(color, barrierHeight, buildingSide) {
            ctx.beginPath();
            moveTo([floorRadius*Math.cos(startRadian), y+barrierHeight, floorRadius*Math.sin(startRadian)]);
            for (let angle = startAngle; angle >= startAngle-360; angle -= angleJump) {
                rad = radian(angle); 
                x = floorRadius*Math.cos(rad); z = floorRadius*Math.sin(rad);
                moveTo([x, maxFloor+barrierHeight, z]); lineTo([x, maxFloor, z]);
                if (buildingSide == "left" && angle>0 && angle-angleJump<0) continue;
                if (buildingSide == "right" && angle>-180 && angle-angleJump<-180) continue;
                moveTo([x, maxFloor+barrierHeight, z]);
                angle -= angleJump; rad = radian(angle); 
                x = floorRadius*Math.cos(rad); z = floorRadius*Math.sin(rad);
                lineTo([x, maxFloor+barrierHeight, z]);
                angle += angleJump;
            }
            ctx.strokeStyle = color; ctx.stroke();
        }

        // color the body first     // TODO: color tuning?
        let startColor = "#0033";
        for (let angle = startAngle; angle >= startAngle-360; angle -= angleJump) {
            if (isInvisible(angle)) continue;
            let c_off = parseInt(Math.abs(angle)/360*256);
            if (c_off>256/2) c_off=256/2-(c_off-256/2);
            let c = c_off.toString(16)
            c = (c.length<2?"0"+c:c);
            c = startColor + c;
            bottomToMiddle(angle, c);
            middleToTop(angle, c);
        }

        // then draw some contours of floors
        for (let floor = maxFloor; floor >= 0; floor--) {
            y = maxFloor-floor;
            floorRadius = getFloorRadius(floor, maxFloor, midFloor);

            ctx.beginPath();
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
        roofBarrier("#666", 0.3, buildingSide);
    }

    // multiple building manipulation in hierarchy
    function positionBuildingsAndRope(distance) {
        let maxFloor = 14, midFloor = 3;
        let strokeColor = "#000", roofColor = "#84735a", ropeColor = "#666";

        var leftBuilding = function() {
            save();
            let T_to_left_building =mat4.create();
            mat4.fromTranslation(T_to_left_building, [-distance/2, 0, 0]);
            mult(T_to_left_building);
            drawBuilding(maxFloor, midFloor, "left", strokeColor, roofColor);
            restore();
        }
        var rightBuilding = function() {
            save();
            let T_to_right_building =mat4.create();
            mat4.fromTranslation(T_to_right_building, [distance/2, 0, 0]);
            mult(T_to_right_building);
            drawBuilding(maxFloor, midFloor, "right", strokeColor, roofColor);
            restore();
        }
        var drawRope = function() {
            for (let i = 0; i < pls.length; ++i)
                drawCurve(0, 1, 200, hermiteCubic, stack[0], ropeColor, pls[i], 3);
        }

        hermiteInit(distance, maxFloor);
        if (viewAngle%360 > 180) {
            rightBuilding(); drawRope(); leftBuilding();
        } else {
            leftBuilding(); drawRope(); rightBuilding();
        }
    }

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
    
    function draw(timestamp) {
        canvas.width = canvas.width;
        
        // capture changes and update related variables
        sliderUpdate();
        
        // calculate time elapsed for animation
        timestamp = Date.now();
        if (start === undefined) start = timestamp;
        elapsed = timestamp - start;

        // camera transformation
        save();                                             // main coordinate system
        let T_viewport = mat4.create();
        let scale = 40;
        mat4.fromTranslation(T_viewport, [canvas.width/2, canvas.width/2, 0]);
        mat4.scale(T_viewport, T_viewport, [scale, -scale, -scale]);
        mult(T_viewport);
        mult(T_look_at)

        // reference grid 
        // if (sliders[3].value == 1) drawGrid("white");
        drawGrid("white", 30); // TODO: slider control?
        
        // draw 2 buildings and a rope hanging around
        positionBuildingsAndRope(25);
        

        restore();                                          // main coordinate system
    }
    sliderInit();      // put all sliders into array 'sliders' and update last value;
    draw(100);
}
window.onload=setup();
