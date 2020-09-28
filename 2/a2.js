'use strict';
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

// slider initializations
var slider0 = document.getElementById('slider0');
     

// elapsed time calculation
let start;

function get_proportion () {
    return (slider0.value-slider0.min)/(slider0.max-slider0.min);
}

function calc_ball_coordinates(elapsed) {
    var bounce_x = 1530;
    var cycle = slider0.value;
    var half_cycle = cycle/2;
    var x_off = elapsed % cycle;
    var dx;

    var max_osci = 10;
    var min_osci = 2;
    var osci_val = get_proportion() * (max_osci-min_osci) + min_osci

    // calculate dx based on timestamp and canvas size (hard-coded for now)
    if (x_off < cycle/2)
        dx = x_off / half_cycle * bounce_x;
    else
        dx = (half_cycle - (x_off - half_cycle)) / half_cycle * bounce_x

    // calc dy based on dx
    var tra_w = canvas.width*8/10;
    var tra_h = (canvas.height*8/10)*osci_val/10;
    var a = tra_h/Math.pow(tra_w/2, 2);
    var dy = a*Math.pow((dx-tra_w/2), 2) - 500*osci_val/10;

    var ret = {'x':dx, 'y':dy};
    return ret;
}

function draw_ball(color1, color2) {
    ctx.beginPath();
    ctx.fillStyle = color1;
    ctx.arc(100, 100, 100, 0, 1*Math.PI);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.fillStyle = color2;
    ctx.arc(100, 100, 100, 1*Math.PI, 2*Math.PI);
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
    if (start == undefined) start = timestamp;
    const elapsed = timestamp - start;
    if (elapsed == 6000) start = timestamp;

    // coordinates of ball based on time elapsed
    var coor = calc_ball_coordinates(elapsed);
    var dx = coor['x'];
    var dy = coor['y'];

    // trajectory/ rotation transformation
    ctx.save();
    ctx.translate(100, 500);
    ctx.translate(dx, dy)

    ctx.scale(0.5, 0.5);

    ctx.translate(100, 100);
    ctx.rotate(dx * Math.PI/180);
    ctx.translate(-100, -100);

    draw_ball('blue', 'black');
    ctx.restore();

    var sp = get_proportion();

    // left cannon
    ctx.save();
    ctx.translate(5, canvas.height*6/10);

    // slider0 adjustment
    ctx.rotate((20-25*sp)*Math.PI/180);
    ctx.translate(50*sp, -150+150*sp);

    ctx.translate(100, 200);
    ctx.rotate(45*Math.PI/180);
    ctx.translate(-100, -200);
    ctx.scale(1.5, 1);

    draw_cannon('#444');
    ctx.restore();

    // right cannon
    ctx.save();
    ctx.translate(canvas.width-50, canvas.height*6/10);

    // slider0 adjustment
    ctx.scale(-1, 1);
    ctx.rotate((20-25*sp)*Math.PI/180);
    ctx.translate(50*sp, -150+150*sp);

    ctx.translate(100, 200);
    ctx.rotate(45*Math.PI/180);
    ctx.translate(-100, -200);
    ctx.scale(1.5, 1);

    draw_cannon('#444');
    ctx.restore();


    requestAnimationFrame(draw);
}

slider0.value = slider0.middle;
slider0.addEventListener('input', null)

window.requestAnimationFrame(draw)
 
// let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
// let update = async timestamp => {
//     await sleep(10);
//     requestAnimationFrame(draw);
// }

// window.requestAnimationFrame(update);
