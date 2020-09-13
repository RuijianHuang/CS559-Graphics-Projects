window.onload = function () {
    'use strict';
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext('2d');

    var slider0 = document.getElementById('slider0');
    var slider1 = document.getElementById('slider1');
    var slider2 = document.getElementById('slider2');
    var slider3 = document.getElementById('slider3');
    var slider4 = document.getElementById('slider4');
    var slider5 = document.getElementById('slider5');
    slider0.value = 400;        // sizing
    slider1.value = 10;         // line width
    slider2.value = 330;        // rotation angle
    slider3.value = 4;          // RGB: R
    slider4.value = 9;          // RGB: G
    slider5.value = 4;          // RGB: B

    // global configs
    var shapeWidth;
    var shapeHeight;
    var footWidth;
    var x_off;
    var y_off;
    var lastSize = slider0.value;

    var shapeLineWidth = 5;
    var strokeColor = '#000';

    function drawShape(color) {
        ctx.beginPath();
        ctx.lineWidth = shapeLineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = color;

        ctx.moveTo(x_off, y_off+shapeHeight);
        ctx.lineTo(x_off, y_off+shapeHeight/3);
        ctx.arc(x_off+shapeWidth/2, y_off+shapeWidth/2, shapeWidth/2, 1*Math.PI, 0.5*Math.PI);

        ctx.lineTo(x_off+shapeWidth, y_off+shapeHeight);
        ctx.lineTo(x_off+shapeWidth-footWidth*1.414, y_off+shapeHeight);
        ctx.lineTo(x_off+footWidth, y_off+shapeHeight-(shapeWidth-footWidth*(2.414)));
        ctx.lineTo(x_off+footWidth, y_off+shapeHeight);

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    function drawCircle(color, radius, toFill, x, y) {
        ctx.beginPath();
        ctx.lineWidth = shapeLineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = color;

        ctx.moveTo(x_off+x+radius, y_off+y);
        ctx.arc(x_off+x, y_off+y, radius, 0, 2*Math.PI);

        ctx.closePath();
        if (toFill) ctx.fill();
        ctx.stroke();
    }

    function draw() {
        canvas.width = canvas.width;
        ctx.save();

        // slider0: sizing
        shapeHeight = parseInt(slider0.value);
        shapeWidth = shapeHeight * 2/3;
        footWidth = shapeWidth/4;
        x_off = canvas.width/2 - shapeWidth/2;
        y_off = canvas.height/2 - shapeHeight/2;
        slider1.max = shapeWidth * 0.45;

        // slider1: line width (proportional to sizing if not manually changed)
        if (shapeHeight != lastSize) {
            shapeLineWidth = (shapeLineWidth/lastSize) * shapeHeight;
            lastSize = shapeHeight;
            slider1.value = shapeLineWidth;
        } else {
            shapeLineWidth = slider1.value;
        }

        // slider2: rotation
        ctx.translate(x_off+shapeWidth/2, y_off+shapeHeight/2);
        ctx.rotate(slider2.value * Math.PI / 180);
        ctx.translate(-(x_off+shapeWidth/2), -(y_off+shapeHeight/2));

        // slider3-5: color of fill
        var colorString = "#"
        colorString += (slider3.value).toString(16);
        colorString += (slider4.value).toString(16);
        colorString += (slider5.value).toString(16);
        
        drawShape(colorString);
        drawCircle('#FFF', (shapeWidth/2)*0.4, true, shapeWidth/2, shapeWidth/2);
        drawCircle('#444', (shapeHeight/2)*1.5, false, shapeWidth/2, shapeHeight/2); // FIXME
        ctx.restore();
        
    }

    slider0.addEventListener('input', draw);
    slider1.addEventListener('input', draw);
    slider2.addEventListener('input', draw);
    slider3.addEventListener('input', draw);
    slider4.addEventListener('input', draw);
    slider5.addEventListener('input', draw);
    draw();
}
