function setup() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    let slider1 = document.getElementById('slider1');
    slider1.value = 0;
    
    // global variables
    let stack = [mat3.create()];    // array as stack for save and restore emulation
    let start;                      // mark the start of time
    let elapsed;                    // time elapsed
    let t_obj;                      // record where the obj is
    let slider_granularity = 1000;

    // helper to insert a point into an array in hermite cubic formatting
    function pushHermitePoint(p, d) 
    { let last = pls[pls.length-1]; pls.push([last[2], last[3], p, d]); }

    // current time elapsed proportional to a cycle
    function get_proportion() { return elapsed%cycle/cycle; }

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

    // helper axes FIXME
    function drawAxes(color) {
        ctx.strokeStyle = color;
        ctx.lineWidth=2;
        ctx.beginPath();
        moveTo(30, 0); lineTo(0, 0); lineTo(0, 30);
        ctx.stroke();
        
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -5; i <= 20; ++i) {
            moveTo(-10, i); lineTo(30, i);
            moveTo(i, -10); lineTo(i, 30);
        }
        ctx.stroke();
    }


    // hermite related 
    // initialization of a set of Hermite points
    let pls =      [[[0, 0],   [2.5, 0],
                     [1, 1],   [2, 0]]];

    for(let i = 2; i <= 10; ++i) {
        let magnifier = (i <=4 ? i : 10-i) * 6/10;
        pushHermitePoint([i, magnifier*Math.pow(-1, i-1)], [2, 0]);
    }

    // for(let i = 0; i < 3; ++i) {            // ease of adding points
    //     let j = i + 4;
    //     pushHermitePoint([j+1, 1.5],   [0, 1.5]);
    //     pushHermitePoint([j+0.5, 3],   [-1, 0]);
    //     pushHermitePoint([j, 1.5],     [0, -1.5]);
    //     pushHermitePoint([j+1, 0],     [1.8, 0]);
    // }
    slider1.max = pls.length*slider_granularity;    // tune slider1.max s.t. it can be used on all Hermite points

    function hermiteBasis(t) 
    { return [2*t*t*t-3*t*t+1, t*t*t-2*t*t+t, -2*t*t*t+3*t*t, t*t*t-t*t ]; }

	function hermiteDerivative(t) 
    { return [ 6*t*t-6*t, 3*t*t-4*t+1, -6*t*t+6*t, 3*t*t-2*t ]; }

    function hermite_cubic(Basis, P,t){
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
                return hermite_cubic(B, pls[i], t<1 ? t : t%i);
            else if (t == pls.length) 
                return hermite_cubic(B, pls[pls.length-1], 1);
        }
    }

    function drawCurve(t0, t1, granularity, curve, T, color, P) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
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

    function draw(timestamp) {
        canvas.width = canvas.width;
        t_obj = slider1.value/slider_granularity;

        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        elapsed = timestamp - start;

        // curve drawing
        save();
        let T_to_curve = mat3.create();
        mat3.fromTranslation(T_to_curve, [100, 600]);
        mat3.scale(T_to_curve, T_to_curve, [50, -50]);
        mult(T_to_curve);
        drawAxes("white"); // FIXME
        for(let i = 0; i < pls.length; ++i)
            drawCurve(0, 1, 200, hermite_cubic, T_to_curve, "#bbb", pls[i]);

        // object drawing
        save();

        // position
        let T_to_obj = mat3.create();
        mat3.fromTranslation(T_to_obj, composite(t_obj, hermiteBasis));
        
        // rotation
        let T_to_obj_rot = mat3.create();
        let tan = composite(t_obj, hermiteDerivative)
        let angle = Math.atan2(tan[1], tan[0]);
        mat3.rotate(T_to_obj_rot, T_to_obj_rot, angle);

        // apply transformation
        mult(T_to_obj);
        mult(T_to_obj_rot);

        fillrect(-1/10, -1/10, 1/5, 1/5, "tan");        // TODO: replace obj

        restore();
        restore();

        // window.requestAnimationFrame(draw); TODO
    }

    
    slider1.addEventListener("input", draw);
    draw(100);
    // window.requestAnimationFrame(draw);  TODO
}
window.onload=setup();




// FIXME: unused functions
// function Cspiral_tangent(t) {
//     var R = Rslope * t + Rstart;
//     var Rprime = Rslope;
//     var x = Rprime * Math.cos(2.0 * Math.PI * t)
//             - R * 2.0 * Math.PI * Math.sin(2.0 * Math.PI * t);
//     var y = Rprime * Math.sin(2.0 * Math.PI * t)
//             + R * 2.0 * Math.PI * Math.cos(2.0 * Math.PI * t);
//     return [x,y];
// }

// function curve0(t) {    // normal parabola
//     let x = t;
//     let y = t*t;
//     return [x, y];
// }

// function curve1(t) {    // C1 continuity at t=1 to curve0
//     let x = t;
//     let y = -t*t + 4*t -2;
//     return [x, y];
// }

// function spiral(t) {
//     let r = 0.3;
//     var x = t/3 + r*Math.cos(2*Math.PI*t);
//     var y = r*Math.sin(2*Math.PI*t);
//     return [x,y];
// }

