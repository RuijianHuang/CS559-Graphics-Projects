function setup() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');

    // input related
    let sliderCount = 3;
    let sliders = [];
    let sliderVals = [];
    // animation timing related
    let start;                      // mark the start of time
    let elapsed;                    // time elapsed
    let cycle = 100000;                      // define length of an animation cycle
    // global variables
    let stack = [mat3.create()];    // array as stack for save and restore emulation
    let pls;                        // array containing all points describing the hermite curve
    let tObj;                       // record where the obj is through parameter t
    let ridiculousness;             // adjustment of points relative positions
    let numPeople;                  // #people on the ride

    // helper to insert a point into an array in hermite cubic formatting
    function pushHermitePoint(p, d) 
    { let last = pls[pls.length-1]; pls.push([last[2], last[3], p, d]); }

    // current time elapsed proportional to a cycle
    function getProportionInTime() { return elapsed%cycle/cycle; }

    // radian getter
    function radian(angle) { return angle*Math.PI/180; } 

    // pseudo canvas save
    function save() { stack.unshift(mat3.clone(stack[0])); }

    // pseudo canvas restore
    function restore() { stack.shift(); }

    // mat3.mutiply wrapper
    function mult(T) { return mat3.multiply(stack[0], stack[0], T); }
    
    // function to move pen in ctx using glmatrix
    function moveTo(x, y) 
    { let pt = vec2.create(); vec2.transformMat3(pt, [x, y], stack[0]); ctx.moveTo(pt[0], pt[1]); }
    
    // function to draw to a pt in ctx using glmatrix
    function lineTo(x, y) 
    { let pt = vec2.create(); vec2.transformMat3(pt, [x, y], stack[0]); ctx.lineTo(pt[0], pt[1]); }

    // arc wrapper (start/end slightly differ from original)
    function circle(x, y, radius, start, end) 
    { for (let a = start; a < end; ++a) lineTo(x+radius*Math.cos(radian(a)), y+radius*Math.sin(radian(a))); }
    
    // fillRect wrapper w/ color
    function fillrect(x, y, w, h, color) {
        ctx.fillStyle = color; ctx.beginPath();
        moveTo(x, y); lineTo(x+w, y); lineTo(x+w, y+h); lineTo(x, y+h);
        ctx.closePath(); ctx.fill();
    }

    // helper axes 
    function drawGrid(color) {
        ctx.strokeStyle = color;
        ctx.lineWidth=2;
        ctx.beginPath();
        moveTo(30, 0); lineTo(0, 0); lineTo(0, 30);
        ctx.stroke();
        
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -10; i <= 50; ++i) {
            moveTo(-10, i); lineTo(30, i);
            moveTo(i, -10); lineTo(i, 30);
        }
        ctx.stroke();
    }
    
    // tiny cart to ride
    function roller(fillColor, strokeColor) {
        save();

        let cLen = 30; let cHei = 10; let dHei = 1; 
        let headR = 4; let dStart = 2; let wheelR = 3;
        ctx.strokeStyle = strokeColor; ctx.beginPath();

        // transformation to let the center of cart stay on curve
        let T_to_roller_center = mat3.create();
        mat3.fromTranslation(T_to_roller_center, [-cLen/2, 0]);
        mult(T_to_roller_center);

        // cart
        fillrect(0, 0, cLen, cHei, fillColor);

        // body parts
        moveTo(cLen/2, cHei); lineTo(cLen/2, cHei+headR);   // neck
        moveTo(cLen/2, cHei); lineTo(cLen/2+8, cHei+5);
        moveTo(cLen/2, cHei); lineTo(cLen/2-8, cHei+5);
        ctx.stroke();
        ctx.closePath();
        // decorations
        fillrect(dStart, cHei/2-dHei, cLen-dStart-2, dHei*2, "#0a0");

        // head
        ctx.beginPath(); ctx.lineWidth = 3; ctx.fillStyle = "#333";
        circle(cLen/2, cHei+headR*2, headR, 0, 360);
        ctx.closePath(); ctx.stroke(); ctx.fill();

        // wheels
        ctx.beginPath(); ctx.fillStyle = "#080";
        circle(wheelR, 0, wheelR, 0, 360);
        ctx.closePath; ctx.stroke(); ctx.fill();
        ctx.beginPath(); ctx.fillStyle = "#080";
        circle(cLen-wheelR, 0, wheelR, 0, 360);
        ctx.closePath; ctx.stroke(); ctx.fill();

        restore();
    }

    function positionRoller(tObj) {
        save();

        // position
        let T_to_obj = mat3.create();
        mat3.fromTranslation(T_to_obj, composite(tObj, hermiteBasis));
        mat3.scale(T_to_obj, T_to_obj, [1/50, 1/50]);
        
        // rotation
        let T_to_obj_rot = mat3.create();
        let tan = composite(tObj, hermiteDerivative)
        let angle = Math.atan2(tan[1], tan[0]);
        mat3.rotate(T_to_obj_rot, T_to_obj_rot, angle);

        // apply transformation
        mult(T_to_obj); mult(T_to_obj_rot);
        roller("tan", "#ddd");
        
        restore();
    }

    // update variables affected by sliders
    function sliderUpdate() {
        for(let i = 1; i <= sliderCount; ++i)
            if (sliderVals[i] != sliders[i].value) {
                sliderVals[i] = (sliders[i].value); 
                if (i == 1) { numPeople = sliders[i].value; }
                if (i == 2) { ridiculousness = sliders[2].value/10000; hermiteInit();}
            }
    } 

    function sliderInit() {
        for(let i = 1; i <= sliderCount; ++i) {
            sliders[i] = (document.getElementById('slider'+i)); 
            sliders[i].addEventListener("input", draw);
        }
        sliders[1].value = sliders[1].min;  // numPeople
        sliders[2].value = sliders[2].middle;  // normal curve to begin with
        sliders[3].value = 0;               // hide grid [use in draw()]
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
        
        // untuned loops in a circle
        /*
         * let radius = 3;
         * let start = 270;
         * for(let angle = start; angle < 360+start; angle += 360/15) {
         *     let center = 10 + 5;
         *     let x = radius * Math.cos(radian(angle)) + center;
         *     let y = radius * Math.sin(radian(angle));
         *     let i = (angle-start)/(360);
         *     pushHermitePoint([x+1, y+1.5],   [0, 1.5]);       // right
         *     pushHermitePoint([x+0.5, y+3],   [-1.3, 0]);      // upper
         *     pushHermitePoint([x, y+1.5],     [0, -1.5]);      // left
         *     pushHermitePoint([x+1, y+0],     [2, 0]);         // lower
         *     pushHermitePoint([x+1, y+1.5],   [0, 1.5]);       // connecting vector
         * }
         */
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
        let T_to_curve = mat3.create();
        mat3.fromTranslation(T_to_curve, [100, 450]);
        mat3.scale(T_to_curve, T_to_curve, [55, -55]);
        mult(T_to_curve);
        
        // reference grid
        if (sliders[3].value == 1) drawGrid("white");

        // stands
        ctx.strokeStyle = "#5A6266";
        ctx.closePath(); ctx.beginPath(); ctx.lineWidth=5;
        moveTo(9.5, 0); lineTo(9.5-3, -4.3);
        moveTo(9.5, 0); lineTo(9.5+3, -4.3);
        ctx.stroke(); ctx.lineWidth=2;
        
        // curve drawing one by one FIXME: more than one track really takes toll on CPU/GPU
        let shift = 0.04;
        for(let track = 0; track < 1; ++track) {
            if (track == 1) shiftP(shift, shift);
            for(let i = 0; i < pls.length; ++i)
                drawCurve(0, 1, 200, hermiteCubic, T_to_curve, "white", pls[i], 2);
            if (track == 1) shiftP(-shift, -shift);
        }

        // roller coaster
        let t_diff = 2.5;
        shiftP(shift/2, shift/2);
        tObj = getProportionInTime() * pls.length;
        // for (let i in [...Array(numPeople).keys()]) {
        for (let i = 0; i < numPeople; ++i) 
            positionRoller((tObj+i*t_diff)%pls.length);
        shiftP(-shift/2, -shift/2);

        restore();                                          // main coordinate system

        window.requestAnimationFrame(draw);
    }
    sliderInit();      // put all sliders into array 'sliders' and update last value;
    window.requestAnimationFrame(draw);
}
window.onload=setup();
