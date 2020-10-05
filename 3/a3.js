function setup() {
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext('2d');
    var slider1 = document.getElementById('slider1');
    slider1.value = 0;
    
    let start;      // mark the start of time

    function transform(t) { ctx.setTransform(t[0], t[1], t[3], t[4], t[6], t[7]); }
    
    function get_radian(angle) { return angle*Math.PI/180; } 

    function draw(timestamp) {
        canvas.width = canvas.width;
        
        // calculate time elapsed for animation
        if (start === undefined) start = timestamp;
        const elapsed = timestamp - start;
        
        
        var stack = [mat3.create()];
        
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

        function sticker(color, linewith) {
            ctx.beginPath();
            ctx.strokeStyle = color;;
            ctx.lineWidth = linewith;

            let radius = 50
            for (let i = 0; i < 360; ++i) {
                let r = get_radian(i);
                lineTo(radius*Math.cos(r), radius*Math.sin(r));
            }
            ctx.closePath();
            ctx.stroke();
        }

        var tx_test = mat3.create();
        mat3.fromTranslation(tx_test, [400, 100]);
        mat3.rotate(tx_test, tx_test, 90*Math.PI/180);
        mat3.multiply(stack[0], stack[0], tx_test);
        sticker('#FFF', 5);

        // TODO: window.requestAnimationFrame(draw);
    }




    slider1.addEventListener("input", draw);
    draw(100); // FIXME
    // TODO: window.requestAnimationFrame(draw);
}
window.onload=setup();
