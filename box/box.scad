
$fn = 30;

H = 18;
W = 40;
D = 40;
label_size = 15;
rs = 1;
rt = rs;
t = 2;

hole = 8;
hole_dist = 19;

font="Liberation Sans:style=Bold";

module box(label) {
    difference () {
        union () {
            // Body
            hull() {
                translate([rs, rs, 0]) cylinder(h = H, r = rs, center = false);
                translate([rs, W - rs, 0]) cylinder(h = H, r = rs, center = false);
                translate([D - rs, rs, 0]) cylinder(h = H, r = rs, center = false);
                translate([D - rs, W - rs, 0]) cylinder(h = H, r = rs, center = false);
            }

            // Top
            hull() {
                translate([rt, rt, H]) sphere(r = rt);
                translate([rt, W - rt, H]) sphere(r = rt);
                translate([D - rt, rt, H]) sphere(r = rt);
                translate([D - rt, W - rt, H]) sphere(r = rt);
            }
        };

        // cavity
        translate([t, t, 0]) {
            cube(size = [D - 2*t, W - 2*t, H - t], center = true/false);
        };
        
        // hole
        translate([D / 2, W, H/2]) {
            rotate([90, 0, 0]) {
                translate([-hole_dist / 2, 0, 0])
                    cylinder(h = 10, d = hole, center = true);
                translate([hole_dist / 2, 0, 0])
                    cylinder(h = 10, d = hole, center = true);
            }
        }
        
        // label
        translate([D/2, W/2, H + rs - 0.8])
            linear_extrude(height = 1)
                text(label, font = font, size = label_size, halign = "center", valign = "center");

    }
}
/*

difference(){

box("A");

cube([100, 20, 100]);

}
*/



for(x = [0 : 1 : 2]) {
    for(y = [0 : 1 : 2]) {
        translate([x * (D + 10), y * (W + 10), 0]) box(chr(x*3 + y + 65));
    }
}

//box("?");

/*
translate([D / 2, W, H/2]) {
            rotate([90, 0, 0]) {
                translate([-hole_dist / 2, 0, 0])
                    cylinder(h = 10, d = 11, center = true);
                translate([hole_dist / 2, 0, 0])
                    cylinder(h = 10, d = 11, center = true);
            }
        }

*/


