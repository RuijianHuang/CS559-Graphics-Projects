function setup() {
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext('2d');
    var slider1 = document.getElementById('slider1');
    slider1.value = 0;
    
    let start;      // mark the start of time

    function draw(timestamp) {

        canvas.width = canvas.width;
        
        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        const elapsed = timestamp - start;

        // array as stack for save and restore emulation
        var stack = [mat3.create()];

        // config values
        let head_level = 200;         // from original canvas
        let scary_ball_level = 250;
        let ground_level;

        // pseudo canvas save
        function save() { stack.unshift(mat3.clone(stack[0])); }

        // pseudo canvas restore
        function restore() { stack.shift(); }

        // mat3.mutiply wrapper
        function mult(T) { return mat3.multiply(stack[0], stack[0], T); }

        // radian getter
        function radian(angle) { return angle*Math.PI/180; } 

        // arc wrapper (start/end slightly differ from original)
        function circle(x, y, radius, start, end) {
            for (let a = start; a < end; ++a)
                lineTo(x+radius*Math.cos(radian(a)), y+radius*Math.sin(radian(a)));
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
            save();    // save
            let T_to_center = mat3.create();
            mat3.fromTranslation(T_to_center, [0, head_size+torso_size]);
            mult(T_to_center);

            // rotate torso for upper body
            save();    // save
            let T_rotate_center = mat3.create();
            mat3.rotate(T_rotate_center, T_rotate_center, radian(10));
            mult(T_rotate_center);
            upper_body(head_size, torso_size);
            restore();                          // restore

            lower_body(leg_size);
            restore();                          // restore
        }

        function scary_ball(color, radius) {
            ctx.fillStyle = color;
            ctx.beginPath();
            circle(0, 0, radius, 270, 360+90);

            let x, y;
            for (let a = 90, i = 0; a <= 270; a += 180/6, ++i) {
                if (i % 2 == 0) x = radius*Math.cos(radian(a));
                else x = radius*Math.cos(radian(a))-radius*0.4;
                y = radius*Math.sin(radian(a));
                lineTo(x, y);
            }
            // ctx.stroke();
            ctx.closePath();
            ctx.fill();
        }

        function main_scene(side) {
            save();         // save for side scaling
            var T_side = mat3.create();
            if (side == 'left') {
                mat3.scale(T_side, T_side, [1, 1]);
            } else if (side == 'right') {
                mat3.fromTranslation(T_side, [canvas.width, 0]);
                mat3.scale(T_side, T_side, [-1, 1])
            }
            mult(T_side);

            // drawing left stick man
            save();
            var T_to_left_sticker_pos = mat3.create();
            mat3.fromTranslation(T_to_left_sticker_pos, [100, head_level]);
            mult(T_to_left_sticker_pos);
            stick_man('#EEE', 5);
            restore();
            
            // drawing scary balls
            save();
            var T_to_scary_ball = mat3.create();
            mat3.fromTranslation(T_to_scary_ball, [400, scary_ball_level]);
            mat3.scale(T_to_scary_ball, T_to_scary_ball, [1, 0.6]);
            mult(T_to_scary_ball);
            scary_ball('#FF0500', 50);
            scary_ball('#FFA500', 30);
            restore();

            restore();      // restore from side scaling
        }
        // let the drawing begin
        // some background

        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 10;
        moveTo(0, ground_level);
        lineTo(canvas.width, ground_level);
        ctx.stroke();

        // symmatrical main scenes
        main_scene('left');
        main_scene('right');

        // TODO: window.requestAnimationFrame(draw);
    }


    slider1.addEventListener("input", draw);
    draw(100); // FIXME
    // TODO: window.requestAnimationFrame(draw);
}
window.onload=setup();
