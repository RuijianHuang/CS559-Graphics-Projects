function setup() {
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext('2d');
    let slider1 = document.getElementById('slider1');
    slider1.value = 4000;
    
    let stack = [mat3.create()];    // array as stack for save and restore emulation
    let start;                      // mark the start of time
    let elapsed;                    // time elapsed
    let cycle = slider1.value;               // define length of a animation cycle

    // config values [from original canvas]
    let head_level = 200;           
    let scary_ball_level = 275;
    let ground_level = head_level + 100;
    let sparkle = 7;

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
        let proportion = get_proportion();
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

    function scary_ball(color, radius, ball_motion) {
        ctx.fillStyle = color;

        // ball body
        ctx.beginPath();
        let x, y;
        circle(0, 0, radius, 270, 360+90);
        for (let a = 90, i = 0; a <= 270; a += 180/6, ++i) {
            if (i % 2 == 0) x = radius*Math.cos(radian(a));
            else x = radius*Math.cos(radian(a))-radius*0.4;
            y = radius*Math.sin(radian(a));
            lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // trail
        ctx.beginPath();
        for (let a = 30; a <= 330; a += 180/3) {
            x = radius*Math.cos(radian(a))-radius*0.4-jiggle(ball_motion/3, true)-20;
            y = radius*Math.sin(radian(a));
            ctx.lineWidth = 0;
            fillrect(x, y, 5, 5, color);
        }
    }

    function blast(color, radius, j) {
        let x, y;
        for (let a = 270; a <= 270+180; a+=180/8) {
            x = radius*Math.cos(radian(a));
            y = radius*Math.sin(radian(a));
            for (let i = 0; i < 2; ++i)
                fillrect(x+jiggle(j/2, true), y+jiggle(j/2, false), sparkle, sparkle, color[i]);
                // fillrect(x, y, sparkle, sparkle, color[i]);
        }
    }

    function main_scene(side) {
        save();         // save for side scaling

        // window of flight for both balls and blasting
        let win_of_flight = [4/25*canvas.width, 23/50*canvas.width];
        let stick_color;
        let ball_color;

        // differences between left and right
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
        
        // drawing stick man
        save();
        let hori_stick_pos = 1/20 * canvas.width;
        let T_to_left_sticker_pos = mat3.create();
        mat3.fromTranslation(T_to_left_sticker_pos, [hori_stick_pos, head_level]);
        mult(T_to_left_sticker_pos);
        stick_man(stick_color, 5);
        restore();
        

        // drawing scary ball
        if (get_proportion() < 0.5) {
            let ball_motion = win_of_flight[0] + get_proportion()*2*(win_of_flight[1]-win_of_flight[0]);

            save();
            let T_to_scary_ball = mat3.create();
            mat3.fromTranslation(T_to_scary_ball, [ball_motion, scary_ball_level]);
            mat3.scale(T_to_scary_ball, T_to_scary_ball, [1, 0.7]);
            mult(T_to_scary_ball);
            scary_ball(ball_color[0], 50, ball_motion);
            scary_ball(ball_color[1], 30, ball_motion);
            restore();
        } 


        // draw blasting effect
        else if (get_proportion() > 0.5 && 
            (sparkle = sparkle*(1-(get_proportion()-0.5))) > 3) {

            let max_blast_radius = 1000*(get_proportion()-0.5);
            let step = max_blast_radius/3;
            let blast_motion = win_of_flight[1]+get_proportion()*(win_of_flight[1]-win_of_flight[0])-130;

            save();
            let T_to_blast = mat3.create();
            mat3.fromTranslation(T_to_blast, [blast_motion, scary_ball_level]);
            mult(T_to_blast);
            if ((side == 'left' && get_proportion() < 0.73) || side == 'right') {
                for (let r = 1; r <= max_blast_radius; r+=step)
                    blast(ball_color, r, step);
            }
            restore();
        }

        restore();      // restore from side scaling
    }

    function background(color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        fillrect(0, ground_level, canvas.width, canvas.height-300, color);
        // fillrect(0, 0, canvas.width, ground_level, 'blue');
    }

    function draw(timestamp) {
        canvas.width = canvas.width;
        cycle = slider1.value;
        sparkle = 5;
        
        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        elapsed = timestamp - start;

        // let the drawing begin
        // some background
        background('#446444');

        // symmatrical main scenes
        main_scene('left');
        main_scene('right');

        window.requestAnimationFrame(draw);
    }


    slider1.addEventListener("input", draw);
    window.requestAnimationFrame(draw);
}
window.onload=setup();
