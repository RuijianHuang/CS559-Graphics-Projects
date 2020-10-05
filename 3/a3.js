function setup() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    let slider1 = document.getElementById('slider1');
    slider1.value = 0;
    
    let stack = [mat3.create()];    // array as stack for save and restore emulation
    let start;                      // mark the start of time
    let elapsed;                    // time elapsed
    let cycle = 2000;               // define length of a animation cycle

    // config values [from original canvas]
    let head_level = 200;           
    let scary_ball_level = 275;
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
    
    function fillrect(x, y, w, h, color) {
        ctx.fillStyle = color;
        let pts = [vec2.create(), 
                   vec2.create(), 
                   vec2.create(), 
                   vec2.create()]
        vec2.transformMat3(pts[0], [x, y], stack[0]);
        vec2.transformMat3(pts[1], [x+w, y], stack[0]);
        vec2.transformMat3(pts[2], [x+w, y+h], stack[0]);
        vec2.transformMat3(pts[3], [x, y+h], stack[0]);
        
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.lineTo(pts[3][0], pts[3][1]);
        ctx.closePath();
        ctx.fill();
    }

    function upper_body(head_size, torso_size) {

        // predefined angle and length for arm rotation
        let armpit_from_pelvis = torso_size*4/5;
        let arm_rotation = -radian(360*(elapsed%cycle)/cycle);

        // predefined transform matrix for arm movement
        let T_to_armpit = mat3.create();
        mat3.fromTranslation(T_to_armpit, [0, -armpit_from_pelvis]);
        mat3.rotate(T_to_armpit, T_to_armpit, arm_rotation)

        // right arm
        save();
        ctx.beginPath();
        mult(T_to_armpit);
        moveTo(0, 0);
        lineTo(10, armpit_from_pelvis/2);
        lineTo(20, armpit_from_pelvis/2+armpit_from_pelvis/3);
        ctx.stroke();
        restore();

        // head and torso
        ctx.fillStyle = '#111';
        ctx.beginPath();
        moveTo(0, 0);
        circle(0, -torso_size-head_size, head_size, 90, 90+360);
        lineTo(0, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // left arm
        save();
        ctx.beginPath();
        mult(T_to_armpit);
        moveTo(0, 0);
        lineTo(-20, armpit_from_pelvis/2);
        lineTo(-10, armpit_from_pelvis/2+armpit_from_pelvis/3);
        ctx.stroke();
        restore();
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

        // calculate body rotation based on time elapsed
        let max_rotation = 50;
        let body_rotation;
        let proportion = elapsed%cycle / cycle;
        if (proportion > 0.5) proportion = 1-proportion;
        body_rotation = -5 + proportion*(max_rotation)

        // rotate torso for upper body
        save();    // save
        let T_rotate_center = mat3.create();
        mat3.rotate(T_rotate_center, T_rotate_center, radian(body_rotation));
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

        let stick_color;
        let ball_color;

        let T_side = mat3.create();
        if (side == 'left') {
            stick_color = '#EEE';
            ball_color = ['#FF0500', '#FFA500'];
        } else if (side == 'right') {
            mat3.fromTranslation(T_side, [canvas.width, 0]);
            mat3.scale(T_side, T_side, [-1, 1])
            mult(T_side);
            stick_color = '#888';
            ball_color = ['#800080', '#9400D3'];
        }
        
        let ball_motion_raw = elapsed % cycle / cycle;
        let win_of_flight = [4/25*canvas.width, 23/50*canvas.width];
        let ball_motion = win_of_flight[0] + ball_motion_raw*(win_of_flight[1]-win_of_flight[0]);
        let hori_stick_pos = 1/20 * canvas.width;

        // drawing left stick man
        save();
        let T_to_left_sticker_pos = mat3.create();
        mat3.fromTranslation(T_to_left_sticker_pos, [hori_stick_pos, head_level]);
        mult(T_to_left_sticker_pos);
        stick_man(stick_color, 5);
        restore();
        
        // drawing scary balls
        save();
        let T_to_scary_ball = mat3.create();
        mat3.fromTranslation(T_to_scary_ball, [ball_motion, scary_ball_level]);
        mat3.scale(T_to_scary_ball, T_to_scary_ball, [1, 0.7]);
        mult(T_to_scary_ball);
        scary_ball(ball_color[0], 50);
        scary_ball(ball_color[1], 30);
        restore();

        restore();      // restore from side scaling
    }

    function draw(timestamp) {
        canvas.width = canvas.width;
        
        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        elapsed = timestamp - start;

        // let the drawing begin
        // some background

        // ctx.beginPath();
        // ctx.strokeStyle = 'green';
        // ctx.lineWidth = 20;
        // moveTo(0, ground_level);
        // lineTo(400, ground_level);
        // ctx.stroke();

        // FIXME FIXME FIXME FIXME FIXME FIXME FIXME 
        console.log(stack);
        fillrect(0, ground_level, canvas.width, 20, 'green');

        // symmatrical main scenes
        main_scene('left');
        main_scene('right');

        window.requestAnimationFrame(draw);
    }


    slider1.addEventListener("input", draw);
    window.requestAnimationFrame(draw);
}
window.onload=setup();
