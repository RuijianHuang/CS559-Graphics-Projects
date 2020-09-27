'use strict';
var canvas = document.getElementById('myCanvas');
var ctx = canvas.getContext('2d');

// slider initializations
var slider0 = document.getElementById('slider0');
     

// elapsed time calculation
let start;

function calc_ball_coordinates(elapsed) {
    var bounce_x = 1550;
    var cycle = slider0.value;
    var half_cycle = cycle/2;
    var x_off = elapsed % cycle;
    var dx;

    var max_osci = 10;
    var min_osci = 2;
    var osci_val = (slider0.value-slider0.min)/(slider0.max-slider0.min) * (max_osci-min_osci) + min_osci

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

function draw(timestamp) {
    canvas.width = canvas.width;

    if (start == undefined) start = timestamp;
    const elapsed = timestamp - start;
    if (elapsed == 6000) start = timestamp;

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

    draw_ball('tan', 'black');
    ctx.restore();

    // racket: TODO

    ctx.translate(10, canvas.height*8/10);
    // ctx.translate()
    // draw_ball('white', 'black');


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
