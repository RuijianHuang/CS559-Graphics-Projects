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
    let distCamera = 400.0;
    let T_look_at = mat4.create();
    
    function lookAtUpdate() {
        locCamera[0] = distCamera * Math.sin(viewAngle);
        locCamera[1] = 100;
        locCamera[2] = distCamera * Math.cos(viewAngle);
        mat4.lookAt(T_look_at, locCamera, [0, 0, 0], [0, 1, 0]);
    }

    // helper to insert a point into an array in hermite cubic formatting
    function pushHermitePoint(p, d) 
    { let last = pls[pls.length-1]; pls.push([last[2], last[3], p, d]); }

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
    function circle(x, y, radius, start, end) 
    { for (let a = start; a < end; ++a) lineTo(x+radius*Math.cos(radian(a)), y+radius*Math.sin(radian(a))); }
    
    // fillRect wrapper w/ color    FIXME?
    function fillrect(x, y, w, h, color) {
        ctx.fillStyle = color; ctx.beginPath();
        moveTo(x, y); lineTo(x+w, y); lineTo(x+w, y+h); lineTo(x, y+h);
        ctx.closePath(); ctx.fill();
    }

    // helper axes 
    function drawGrid(color) {
        // maximum range in x, y, z axes
        let x = [-10, 20]; let x_step = 5;
        let y = [-10, 20]; let y_step = 5;
        let z = [-5, 10];   let z_step = 3;

        ctx.strokeStyle = color;
        ctx.lineWidth=2;
        ctx.beginPath();
        moveTo([x[0], 0, 0]); lineTo([x[1], 0, 0]); 
        moveTo([0, y[0], 0]); lineTo([0, y[1], 0]);
        moveTo([0, 0, z[0]]); lineTo([0, 0, z[1]]);
        ctx.stroke();

        ctx.strokeStyle = "#666";
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
                    viewAngle = radian(sliders[0].value);
                    lookAtUpdate();
                }
                // if (i == 1) { numPeople = sliders[i].value; }
                // if (i == 2) { ridiculousness = sliders[2].value/10000; hermiteInit();}
            }
    }

    function sliderInit() {
        for(let i = 0; i < sliderCount; ++i) {
            sliders[i] = (document.getElementById('slider'+i)); 
            sliders[i].addEventListener("input", draw);
        }
        sliders[0].value = 0;                         // FIXME: manually adjustable viewAngle for now
        // sliders[1].value = sliders[1].min;  // numPeople
        // sliders[2].value = sliders[2].middle;  // normal curve to begin with
        // sliders[3].value = 0;               // hide grid [use in draw()]
        sliderUpdate();
    }
    
    // hermite related 
    // initialization of a set of Hermite points
    function hermiteInit() {
        pls = [];
        pls[0] = [[0, 0],   [-1, 1],
                  [0.8, 1],   [2.5, -0.7]];

        let magnifier;
        let bender;
        for(let i = 0; i < 8; ++i) {
            let j = i + 2;
            magnifier = (j<=4 ? j : 10-j) * ridiculousness + 1;
            bender = i * ridiculousness + 1;
            pushHermitePoint([j, ridiculousness*magnifier*Math.pow(-1, j-1)], [1.5*magnifier*bender, magnifier]);
        }
        
        pushHermitePoint([9.5, 0], [3, 4]);         // connecting point

        for(let i = 0; i < 5; ++i) {
            let j = i + 10;
            magnifier = i * ridiculousness-1;
            pushHermitePoint([j+0.5, 3+magnifier],   [-magnifier*magnifier*0.8-1.5, 0]);      // upper
            pushHermitePoint([j+1, 0-magnifier],     [magnifier*magnifier*0.8+2, 0]);         // lower
        }
        
        pushHermitePoint([10, -0], [-20, 0]);
        pushHermitePoint([0, 0], [-1, 1]);
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

    function shiftP(x, y) {
        for (let i = 1; i < pls.length; ++i) {
            pls[i][0][0] += x;
            pls[i][3][0] += x;
            pls[i][0][1] += y;
            pls[i][3][1] += y;
        }
    }

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
        let scale = 30;
        mat4.fromTranslation(T_to_curve, [400, 450, 0]);
        mat4.scale(T_to_curve, T_to_curve, [scale, -scale, -scale]);
        mult(T_look_at);
        mult(T_to_curve);
        
        // reference grid TODO: possbly a 3D grid?
        // if (sliders[3].value == 1) drawGrid("white");
        drawGrid("white");

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
