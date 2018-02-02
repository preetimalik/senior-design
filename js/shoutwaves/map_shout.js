var map;
var geocoder;
var currentBounds;
var ne;
var sw;
var rectangle;
var pointarray, heatmap;



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
        zoom: 15,
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



    google.maps.event.addListener(map, "rightclick", function(event) {
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
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = new google.maps.LatLng(position.coords.latitude,
                    position.coords.longitude);
                map.setCenter(pos);
            }, function () {
                handleNoGeolocation(true);
            });
        } else {
            // Browser doesn't support Geolocation
            handleNoGeolocation(false);
        }
    }

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

