/**
 * Created by Mehran on 3/15/2015.
 */


$(function() {
    // set background image
    var BLUR_RADIUS = 150;
    var canvas = document.querySelector('[data-canvas]');
    var canvasContext = canvas.getContext('2d');
    var image = new Image();
    image.src = document.querySelector('[data-canvas-image]').src;
    var drawBlur = function() {
        var w = canvas.width;
        var h = canvas.height;
        canvasContext.drawImage(image, 0, 0, w, h);
        stackBlurCanvasRGBA('profileBackground', 0, 0, w, h, BLUR_RADIUS);
    };
    image.onload = function() {
        drawBlur();
    }
    // make color palette
    var colorThief = new ColorThief();
    var bg_rgba = "rgba("+colorThief.getColor(image) +", 1)";
    var wall = $('.shout-div');
    //wall.css('background-color', bg_rgba)

});