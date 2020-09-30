'use strict';
let canvas = document.getElementById('myCanvas');
let ctx = canvas.getContext('2d');

// elapsed time calculation
let start;

function calc_ball_coordinates(elapsed) {
    let bounce_x = 1530;
    let cycle = 6000;
    let half_cycle = cycle/2;
    let x_off = elapsed % cycle;
    let dx;

    let max_osci = 10;
    let min_osci = 2;
    let osci_val = 0.5 * (max_osci-min_osci) + min_osci

    // calculate dx based on timestamp and canvas size (hard-coded for now)
    if (x_off < cycle/2) dx = x_off / half_cycle * bounce_x;
    else dx = (half_cycle - (x_off - half_cycle)) / half_cycle * bounce_x

    // calc dy based on dx
    let tra_w = canvas.width*8/10;
    let tra_h = (canvas.height*8/10)*osci_val/10;
    let a = tra_h/Math.pow(tra_w/2, 2);
    let dy = a*Math.pow((dx-tra_w/2), 2) - 500*osci_val/10;

    let ret = {'x':dx, 'y':dy};
    return ret;
}

function draw_arm(color1, color2, dx) {
    let distance = 180;
    let width = 400;

    ctx.fillStyle = color1;
    ctx.fillRect(100-width/2, 100-distance, width, 20);
    ctx.fillRect(100-width/2, 100+distance, width, 20);

    ctx.fillStyle = color2;

    ctx.save();
    ctx.translate(100, 100-distance+20/2);
    ctx.rotate((-dx/2)*Math.PI/180);
    ctx.translate(-100, -(100-distance+20/2));
    ctx.fillRect(100-width/2, 100-distance, width, 20);
    ctx.restore();

    ctx.save();
    ctx.translate(100, 100+distance+20/2);
    ctx.rotate((-dx/2)*Math.PI/180);
    ctx.translate(-100, -(100+distance+20/2));
    ctx.fillRect(100-width/2, 100+distance, width, 20);
    ctx.restore();
}

function draw_ball(color1, color2) {
    ctx.beginPath();
    ctx.fillStyle = color1;
    ctx.arc(100, 100, 100, 0.2*Math.PI, 1.9*Math.PI);
    ctx.lineTo(100, 100);
    ctx.closePath();
    ctx.fill();
}


function draw_cannon(color) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 15;

    ctx.fillStyle = color; 
    
    ctx.beginPath();
    ctx.moveTo(30, 70);
    ctx.lineTo(0, 200);
    ctx.arc(100, 200, 100, 1*Math.PI, 0, true);
    ctx.lineTo(170, 70);

    ctx.scale(1, 0.2);
    ctx.translate(0, 300);
    ctx.arc(100, 70, 70, 2*Math.PI, 1*Math.PI, true);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.arc(100, 70, 70, 1*Math.PI, 2*Math.PI, true);
    ctx.stroke();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.translate(0, 35);
    ctx.arc(100, 35, 50, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
}

function draw(timestamp) {
    canvas.width = canvas.width;

    // calculate time elapsed for animation
    if (start === undefined) start = timestamp;
    const elapsed = timestamp - start;
    if (elapsed == 6000) start = timestamp;

    // coordinates of ball based on time elapsed
    let coor = calc_ball_coordinates(elapsed);
    let dx = coor['x'];
    let dy = coor['y'];

    // trajectory/ rotation transformation
    ctx.save();

    ctx.translate(100, 500);
    ctx.translate(dx, dy)

    ctx.save();
    ctx.scale(0.3, 0.3);
    ctx.translate(100, 100);
    ctx.rotate(dx * Math.PI/180);
    ctx.translate(-100, -100);
    draw_arm('tan','blue', dx);
    ctx.restore();

    ctx.save();
    ctx.scale(0.3, 0.3);
    draw_ball('yellow', 'black');
    ctx.restore();
    ctx.restore();

    // cannons
    let sp = 0.5;
    for (let i = 0; i < 2; i++) {
        let horizonal;
        let vertical;
        if (i == 1) {
            horizonal = canvas.width-50;
            vertical = -150+150*sp-40;
        } else {
            horizonal = -10;
            vertical = -150+150*sp-70;
        }
        ctx.save();
        ctx.translate(horizonal, canvas.height*6/10);

        if (i == 1) ctx.scale(-1, 1);
        ctx.rotate((20-25*sp)*Math.PI/180);
        ctx.translate(50*sp, vertical);

        ctx.translate(100, 200);
        ctx.rotate(45*Math.PI/180);
        ctx.translate(-100, -200);
        ctx.scale(1.7, 1);

        draw_cannon('#444');
        ctx.restore();
    }


    requestAnimationFrame(draw);
}


window.requestAnimationFrame(draw);
