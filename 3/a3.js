function setup() {
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext('2d');
    var slider1 = document.getElementById('slider1');
    slider1.value = 0;
    
    let start;      // mark the start of time

    // function transform(t) { ctx.setTransform(t[0], t[1], t[3], t[4], t[6], t[7]); }
    

    function draw(timestamp) {

        function mult(T) { return mat3.multiply(stack[0], stack[0], T); }

        function radian(angle) { return angle*Math.PI/180; } 

        function circle(x, y, radius, start, end) {
            for (let a = start; a < end; ++a)
                lineTo(x + radius * Math.cos(radian(a)), 
                        y + radius * Math.sin(radian(a)));
        }

        
        // function to move pen in ctx using glmatrix
        function moveTo(x, y) {
            var pt = vec2.create();
            vec2.transformMat3(pt, [x, y], stack[0]);
            ctx.moveTo(pt[0], pt[1]);
        }
        
        // function to draw to a pt in ctx using glmatrix
        function lineTo(x, y) {
            var pt = vec2.create();
            vec2.transformMat3(pt, [x, y], stack[0]);
            ctx.lineTo(pt[0], pt[1]);
        }
        
        function fillrect(x, y, w, h, color) {
            ctx.fillStyle = color;
            var pts = [vec2.create(), 
                       vec2.create(), 
                       vec2.create(), 
                       vec2.create()]
            vec2.transformMat3(pts[0], [x, y], stack[0]);
            vec2.transformMat3(pts[1], [x+w, y], stack[0]);
            vec2.transformMat3(pts[2], [x+w, y+h], stack[0]);
            vec2.transformMat3(pts[3], [x, y+h], stack[0]);
            
            ctx.moveTo(pts[0][0], pts[0][1]);
            ctx.lineTo(pts[1][0], pts[1][1]);
            ctx.lineTo(pts[2][0], pts[2][1]);
            ctx.lineTo(pts[3][0], pts[3][1]);
            ctx.closePath();
            ctx.fill();
        }

        function upper_body(head_size, torso_size) {
            ctx.beginPath();
            circle(0, -torso_size-head_size, head_size, 90, 90+360);
            lineTo(0, 0);

            let armpit = -torso_size/5*4;

            // left arm
            moveTo(0, armpit);
            lineTo(-20, armpit/2);
            lineTo(-10, armpit/5);

            // right arm
            moveTo(0, armpit);
            lineTo(10, armpit/2);
            lineTo(20, armpit/5);

            ctx.stroke();
        }
        
        function lower_body(leg_size) {
            ctx.beginPath();
            moveTo(0, 0);       // pelvis position
            lineTo(-10, leg_size);
            moveTo(0, 0);
            lineTo(10, leg_size);
            ctx.stroke();
        }

        function stick_man(color, linewidth) {
            ctx.strokeStyle = color;
            ctx.lineWidth = linewidth;
            
            let head_size = 20;
            let torso_size = head_size*4;
            let leg_size = head_size*4;

            // translate to torso
            stack.unshift(mat3.clone(stack[0]));    // save
            let T_to_center = mat3.create();
            mat3.fromTranslation(T_to_center, [0, head_size+torso_size]);
            mult(T_to_center);

            // rotate torso for upper body
            stack.unshift(mat3.clone(stack[0]));    // save
            let T_rotate_center = mat3.create();
            mat3.rotate(T_rotate_center, T_rotate_center, radian(10));
            mult(T_rotate_center);
            upper_body(head_size, torso_size);
            stack.shift();                          // restore

            lower_body(leg_size);
            stack.shift();                          // restore
        }

        canvas.width = canvas.width;
        
        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        const elapsed = timestamp - start;

        // array as stack for save and restore emulation
        var stack = [mat3.create()];


        // drawing left stick man
        stack.unshift(mat3.clone(stack[0]));
        var T_to_left_sticker_pos = mat3.create();
        mat3.fromTranslation(T_to_left_sticker_pos, [100, 200]);
        mat3.multiply(stack[0], stack[0], T_to_left_sticker_pos);
        stick_man('#EEE', 5);
        stack.shift();
        
        // drawing right stick man
        // stack.unshift(mat3.clone(stack[0]));
        // var T_to_right_sticker_pos = mat3.create();






        // TODO: window.requestAnimationFrame(draw);
    }




    slider1.addEventListener("input", draw);
    draw(100); // FIXME
    // TODO: window.requestAnimationFrame(draw);
}
window.onload=setup();
