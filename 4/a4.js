function setup() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    let slider1 = document.getElementById('slider1');
    slider1.value = 4000;
    
    let stack = [mat3.create()];    // array as stack for save and restore emulation
    let start;                      // mark the start of time
    let elapsed;                    // time elapsed
    let cycle = slider1.value;               // define length of a animation cycle

    // random(num)
    function jiggle(num, directional) {
        if (directional) return Math.random()*num;
        if (Math.random() > 0.5) return Math.random()*num;
        else return -Math.random()*num;
    }

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
    function moveTo(x, y) {
        let pt = vec2.create();
        vec2.transformMat3(pt, [x, y], stack[0]);
        ctx.moveTo(pt[0], pt[1]);
    }
    
    // function to draw to a pt in ctx using glmatrix
    function lineTo(x, y) {
        let pt = vec2.create();
        vec2.transformMat3(pt, [x, y], stack[0]);
        ctx.lineTo(pt[0], pt[1]);
    }

    // arc wrapper (start/end slightly differ from original)
    function circle(x, y, radius, start, end) {
        for (let a = start; a < end; ++a)
            lineTo(x+radius*Math.cos(radian(a)), y+radius*Math.sin(radian(a)));
    }
    
    // fillRect wrapper w/ color
    function fillrect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        moveTo(x, y);
        lineTo(x+w, y);
        lineTo(x+w, y+h);
        lineTo(x, y+h);
        ctx.closePath();
        ctx.fill();
    }

    function draw(timestamp) {
        canvas.width = canvas.width;
        cycle = slider1.value;
        sparkle = 5;
        
        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        elapsed = timestamp - start;




        // window.requestAnimationFrame(draw);  FIXME: animation recursion
    }

    slider1.addEventListener("input", draw);

    draw(100);  //FIXME: animation perhaps?
    // window.requestAnimationFrame(draw);
}
window.onload=setup();
