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
    slider0.value = 350;        // sizing
    slider1.value = 15;         // line width
    slider2.value = 0;        // rotation angle
    slider3.value = 0;          // RGB: R
    slider4.value = 4;          // RGB: G
    slider5.value = 7;          // RGB: B

    // global configs
    var shapeWidth;
    var shapeHeight;
    var footWidth;
    var x_off;
    var y_off;
    var lastSize = slider0.value;

    var outerPeakNo = 40;
    var shapeLineWidth = 5;
    var strokeColor = '#000';

    function drawOuter(color) {
        var radian;
        var sRadius = shapeHeight/2 * 1.25;
        var bRadius = shapeHeight/2 * 1.5;
        var rawAngle = 360/outerPeakNo;
        
        var possibleAngles = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180, 360]
        var angleToDraw;
        for (var i = 0; i < possibleAngles.length; i++) {
            if (rawAngle > possibleAngles[i])
                angleToDraw = possibleAngles[i];
            else break;
        }

        ctx.beginPath();
        ctx.lineWidth = shapeLineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = color;

        // radian = angleToDraw*Math.PI/180;
        // ctx.moveTo(x_off+shapeWidth/2+Math.cos(radian)*sRadius, y_off+shapeHeight/2+(10/350)*shapeHeight+Math.sin(radian)*sRadius);
        for (var i = 0; i < 360; i += angleToDraw) {

            bRadius = sRadius + Math.random()*(shapeHeight/2 * 1.5 - sRadius - 10) + 10;
            console.log(Math.random());

            radian = (i+angleToDraw/2)*Math.PI/180;
            ctx.lineTo(x_off+shapeWidth/2+Math.cos(radian)*bRadius, y_off+shapeHeight/2+(10/350)*shapeHeight+Math.sin(radian)*bRadius);

            radian = (i+angleToDraw)*Math.PI/180;
            ctx.lineTo(x_off+shapeWidth/2+Math.cos(radian)*sRadius, y_off+shapeHeight/2+(10/350)*shapeHeight+Math.sin(radian)*sRadius);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

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
    
    function drawCircle(color, radius, x, y) {
        ctx.beginPath();
        ctx.lineWidth = shapeLineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.fillStyle = color;

        ctx.moveTo(x_off+x+radius, y_off+y);
        ctx.arc(x_off+x, y_off+y, radius, 0, 2*Math.PI);

        ctx.closePath();
        ctx.fill();
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
        y_off = canvas.height/2 - shapeHeight/2 - 10;
        slider1.max = shapeWidth * 0.45;

        // slider1: line width (proportional to sizing if not manually changed)
        if (shapeHeight != lastSize) {
            shapeLineWidth = (shapeLineWidth/lastSize) * shapeHeight;
            lastSize = shapeHeight;
            slider1.value = shapeLineWidth;
        } else {
            shapeLineWidth = slider1.value;
        }

        // slider2: rotation and #outerPeaks
        var radian = slider2.value * Math.PI/180;
        ctx.translate(x_off+shapeWidth/2, y_off+shapeHeight/2+(10/350)*shapeHeight);
        ctx.rotate(radian);
        ctx.translate(-(x_off+shapeWidth/2), -(y_off+shapeHeight/2+(10/350)*shapeHeight));
        
        outerPeakNo = parseInt(slider2.value)/10;
        if (outerPeakNo < 2) outerPeakNo = 3;

        // slider3-5: color of fills
        var patternFillColor = "#"
        var backFillColor = "#"
        
        var s3 = parseInt(slider3.value);
        var s4 = parseInt(slider4.value);
        var s5 = parseInt(slider5.value);
        patternFillColor += s3.toString(16);
        patternFillColor += s4.toString(16);
        patternFillColor += s5.toString(16);
        backFillColor += ((s3 + 8)%16).toString(16);
        backFillColor += ((s4 + 8)%16).toString(16);
        backFillColor += ((s5 + 8)%16).toString(16);

        // now update
        drawOuter(backFillColor, patternFillColor);
        drawShape(patternFillColor);
        drawCircle(backFillColor, (shapeWidth/2)*0.4, shapeWidth/2, shapeWidth/2);

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
