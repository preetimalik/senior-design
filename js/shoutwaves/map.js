var map;
var geocoder;
var currentBounds;
var ne;
var sw;
var rectangle;
var pointarray, heatmap;




//HOME ICON
function HomeControl(controlDiv, map) {

    // Set CSS styles for the DIV containing the control
    // Setting padding to 5 px will offset the control
    // from the edge of the map
    controlDiv.style.padding = '0.625rem';
    controlDiv.style.paddingTop = '4.063rem'

    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.marginLeft = '0vw';
    controlUI.style.backgroundColor = 'white';
    controlUI.style.boxShadow = "0px 1px 6px 0px rgba(50, 50, 50, 0.75);"
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to set the map to Home';

    var rectUI = document.createElement('div');
    rectUI.style.marginLeft = '0vw';
    //rectUI.style.marginRight = '90vw';
    rectUI.style.backgroundColor = 'white';
    //rectUI.style.borderStyle = 'solid';
    //rectUI.style.borderWidth = '2px';
    rectUI.style.cursor = 'pointer';
    rectUI.style.textAlign = 'center';
    rectUI.style.marginTop = '10px';
    rectUI.title = 'Set Rectangle';
    controlDiv.appendChild(rectUI);
    rectUI.onclick = setRectangle_onclick;

    var rectText = document.createElement('div');
    rectText.style.fontFamily = 'Arial,sans-serif';
    rectText.style.fontSize = '12px';
    rectText.style.paddingLeft = '4px';
    rectText.style.paddingRight = '4px';
    rectText.innerHTML = '<b>Listen</b>';
    rectUI.appendChild(rectText);

    // Setup the click event listeners: simply set the map to
    // Chicago
    google.maps.event.addDomListener(controlUI, 'click', function() {
        map.setCenter(chicago)
    });

}

function update_map(lat, long){
    //alert('This functions was called from before');
    var myLatlng = new google.maps.LatLng(lat,long);
    var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'Hello World!'
    });

}

//INITIALIZE MAP
function initialize() {

    var mapOptions = {
        zoom: 12,
        disableDefaultUI: true,
        styles: [
            {featureType:'water', stylers:[{color:'#46bcec'}, {visibility:'on'}]},
            {featureType:'landscape', stylers:[{color:'#f2f2f2'}]},
            {featureType:'road',	stylers:[{saturation:-100},{lightness:45}]},
            {featureType:'road.highway',stylers:[{visibility:'simplified'}]},
            {featureType:'road.arterial',elementType:'labels.icon',stylers:[{visibility:'off'}]},
            {featureType:'administrative',elementType:'labels.text.fill',stylers:[{color:'#444444'}]},
            {featureType:'transit',	stylers:[{visibility:'off'}]},
            {featureType:'poi',stylers:[{visibility:'off'}]}]
    };
    map = new google.maps.Map(document.getElementById('map'),
        mapOptions);

    //Creates a new rectangle to be used.
    rectangle = new google.maps.Rectangle({
        strokeColor: '#4290FF',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillOpacity: 0.0,
        clickable: false,
        map: map
    });
    //SEARCHING
    var input = /** @type {HTMLInputElement} */(document.getElementById('search_input'));
    var searchBox = new google.maps.places.SearchBox(/** @type {HTMLInputElement} */(input));

    google.maps.event.addListener(searchBox, 'places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
            return;
        }
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0, place; place = places[i]; i++) {
            bounds.extend(place.geometry.location);
        }

        //map.fitBounds(bounds);

        map.panTo(bounds.getCenter());
        //map.setZoom(12);
        $('#search_input').blur().val('');
        $('#search_bt').trigger( "click" );

    });

    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        searchBox.setBounds(bounds);
    });



    //Right CLICK MENU
    google.maps.event.addListener(map, "rightclick", function(event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        shoutHere(lat,lng);
    });

     new LongPress(map, 1000);
    google.maps.event.addListener(map, 'longpress', function(event) {
          var lat = event.latLng.lat();
        var lng = event.latLng.lng();
       shoutHere(lat,lng);
    });

//Called when the user wants to shout through map right-click
    function shoutHere(lat,Lng) {
        var shout_modal= $('#shoutModal');
        shout_modal.attr('Lat',lat);
        shout_modal.attr('Lng',Lng);
        shout_modal.foundation('reveal', 'open');
    }

    google.maps.event.addListener(map,'bounds_changed',function(){
        try {
            currentBounds = map.getBounds();
            ne = currentBounds.getNorthEast();
            sw = currentBounds.getSouthWest();
        } catch (err){
            alert (err);
        }

    });

    //set location
    if(typeof shout_loc != 'undefined') {
        console.log(shout_loc+'shout loc');
        map.setCenter(shout_loc);
        var marker= new google.maps.Marker({
            position: shout_loc,
            map:map

        })

    }
    else {
        console.log('explore');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = new google.maps.LatLng(position.coords.latitude,
                    position.coords.longitude);

//                    var infowindow = new google.maps.InfoWindow({
//                        map: map,
//                        position: pos,
//                        content: 'Location found using HTML5.'
//                    });

                map.setCenter(pos);
                //console.log(pos);
            }, function () {
                handleNoGeolocation(true);
            });
        } else {
            // Browser doesn't support Geolocation
            handleNoGeolocation(false);
        }
    }

    var homeControlDiv = document.createElement('div');
    var homeControl = new HomeControl(homeControlDiv, map);

    homeControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(homeControlDiv);
}

function handleNoGeolocation(errorFlag) {
    if (errorFlag) {
        var content = 'Error: The Geolocation service failed.';
    } else {
        var content = 'Error: Your browser doesn\'t support geolocation.';
    }

    var options = {
        map: map,
        position: new google.maps.LatLng(60, 105),
        content: content
    };

    var infowindow = new google.maps.InfoWindow(options);

    map.setCenter(options.position);
}

//Called when the user clicks on the rectangle button
function setRectangle_onclick(){
    //rectangleView.setMap(null);mCSB_2_container_wrapper
    var shout_area =$('#shout_area');
    var tempBounds = new google.maps.LatLngBounds(
        sw,
        ne
    );
    //alert(sw.lat()+ne);
    rectangle.setBounds(tempBounds);
    $.ajax('/explore/',{
        type: 'GET',
        data:{
            sw_lat: sw.lat(),
            sw_lng: sw.lng(),
            ne_lat: ne.lat(),
            ne_lng: ne.lng()
        },
        success: function(data){
            if(isM1Screen()){
                shout_area.css("width", "100vw");
            }
//            shout_area.find(".mCSB_container").find('.new_shout').prepend(data); //load new content inside .mCSB_container
//            shout_area.mCustomScrollbar("update"); //update scrollbar according to newly loaded content
//            shout_area.find(".comments-div").mCustomScrollbar("scrollTo","top",{scrollInertia:500});

            shout_area.html($(data.shout_html)).html();
            var wh_map = ($(window).height() / parseFloat($("body").css("font-size")))- 3.463 ;
            shout_area.css("height", wh_map+"rem")
            $("#shout_area").mCustomScrollbar({theme:"minimal-dark"});
            $(".comments-div").mCustomScrollbar({theme:"minimal-dark"});
            if(shout_area.hasClass("hide-shout-div"))
                toggleShoutDiv();

            add_to_heatmap(data.shouts)
        },
        error: function( req, status, err ) {
            console.log( 'something went wrong', status, err );
        }
    });


}
function add_to_heatmap(json_points){
    var loc_array =[];
    $.each(json_points, function(i, shout) {
        loc_array.push(new google.maps.LatLng(shout.lat, shout.lng))
    });
    var pointArray = new google.maps.MVCArray(loc_array);

    heatmap = new google.maps.visualization.HeatmapLayer({
        data: pointArray
    });

    heatmap.setData(pointArray);
    heatmap.setMap(map);

}

function LongPress(map, length) {
    this.length_ = length;
    var me = this;
    me.map_ = map;
    me.timeoutId_ = null;
    google.maps.event.addListener(map, 'mousedown', function(e) {
        me.onMouseDown_(e);
    });
    google.maps.event.addListener(map, 'mouseup', function(e) {
        me.onMouseUp_(e);
    });
    google.maps.event.addListener(map, 'drag', function(e) {
        me.onMapDrag_(e);
    });
};
LongPress.prototype.onMouseUp_ = function(e) {
    clearTimeout(this.timeoutId_);
};
LongPress.prototype.onMouseDown_ = function(e) {
    clearTimeout(this.timeoutId_);
    var map = this.map_;
    var event = e;
    this.timeoutId_ = setTimeout(function() {
        google.maps.event.trigger(map, 'longpress', event);
    }, this.length_);
};
LongPress.prototype.onMapDrag_ = function(e) {
    clearTimeout(this.timeoutId_);

};

google.maps.event.addDomListener(window, 'load', initialize);

