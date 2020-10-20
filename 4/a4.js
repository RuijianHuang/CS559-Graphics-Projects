function setup() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    let slider1 = document.getElementById('slider1');
    slider1.value = 50000;
    
    // global variables
    let stack = [mat3.create()];    // array as stack for save and restore emulation
    let start;                      // mark the start of time
    let elapsed;                    // time elapsed
    let cycle = slider1.value;      // define length of an animation cycle
    let t_obj;                      // record where the obj is through parameter t

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
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();

        // cart
        fillrect(0, 0, 20, 10, fillColor);
        
        // body parts
        moveTo(10, 10); lineTo(10, 10+4);   // neck
        moveTo(10, 10); lineTo(10+8, 10+5);
        moveTo(10, 10); lineTo(10-8, 10+5);
        ctx.stroke();
        ctx.closePath();
        
        // decorations
        fillrect(2, 4, 15, 2, "#0a0");
        
        // head
        ctx.beginPath();
        ctx.fillStyle = "#333";
        circle(10, 18, 4, 0, 360);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // wheels
        ctx.beginPath();
        ctx.fillStyle = "#080";
        circle(3, 0, 3, 0, 360);
        ctx.closePath;
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "#080";
        circle(20-3, 0, 3, 0, 360);
        ctx.closePath;
        ctx.stroke();
        ctx.fill();
        
    }


    // hermite related 
    // initialization of a set of Hermite points
    let pls = [[[0, 0],   [2.5, 0],
                [1, 1],   [2, 0]]];

    function hermiteInit() {
        for(let i = 0; i < 9; ++i) {
            let j = i + 2;
            let magnifier = (j <=4 ? j : 10-j) * 10/10;
            pushHermitePoint([j, magnifier*Math.pow(-1, j-1)], [2*i, 0]);         // TODO: Picassofication awaits
        }
        
        for(let i = 0; i < 5; ++i) {
            let j = i + 10;
            pushHermitePoint([j+1, 1.5],   [0, 1.5]);       // right
            pushHermitePoint([j+0.5, 3+i],   [-1.3, 0]);      // upper
            pushHermitePoint([j, 1.5],     [0, -1.5]);      // left
            pushHermitePoint([j+1, 0-i],     [2, 0]);         // lower
        }
        
        // let radius = 3;
        // let start = 270;
        // for(let angle = start; angle < 360+start; angle += 360/15) {
        //     let center = 10 + 5 + 5;
        //     let x = radius * Math.cos(radian(angle)) + center;
        //     let y = radius * Math.sin(radian(angle));
        //     pushHermitePoint([x+1, y+1.5],   [0, 1.5]);       // right
        //     pushHermitePoint([x+0.5, y+3],   [-1.3, 0]);      // upper
        //     pushHermitePoint([x, y+1.5],     [0, -1.5]);      // left
        //     pushHermitePoint([x+1, y+0],     [2, 0]);         // lower
        //     pushHermitePoint([x+1, y+1.5],   [0, 1.5]);       // right
        // }
    }

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
        // cycle = slider1.value;           // FIXME

        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        elapsed = timestamp - start;

        // curve drawing
        save();
        let T_to_curve = mat3.create();
        mat3.fromTranslation(T_to_curve, [100, 500]);
        mat3.scale(T_to_curve, T_to_curve, [70, -70]);
        mult(T_to_curve);
        for(let i = 0; i < pls.length; ++i)
            drawCurve(0, 1, 200, hermite_cubic, T_to_curve, "#bbb", pls[i]);

        // reference grid
        // drawGrid("white");

        // object drawing
        save();
        t_obj = get_proportion() * pls.length;
        // console.log(slider1.value, timestamp, start, elapsed, t_obj); // FIXME

        // position
        let T_to_obj = mat3.create();
        mat3.fromTranslation(T_to_obj, composite(t_obj, hermiteBasis));
        mat3.scale(T_to_obj, T_to_obj, [1/40, 1/40]);
        
        // rotation
        let T_to_obj_rot = mat3.create();
        let tan = composite(t_obj, hermiteDerivative)
        let angle = Math.atan2(tan[1], tan[0]);
        mat3.rotate(T_to_obj_rot, T_to_obj_rot, angle);

        // apply transformation
        mult(T_to_obj);
        mult(T_to_obj_rot);

        roller("tan", "#ddd");

        restore();
        restore();

        window.requestAnimationFrame(draw);
    }
    hermiteInit();
    // FIXME: input->change of timestamp->get_proportion does not work->t=NaN->DEAD
    // slider1.addEventListener("input", draw);
    window.requestAnimationFrame(draw);
}
window.onload=setup();
