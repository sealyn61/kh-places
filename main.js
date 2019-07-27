var map, windowSize, mapMaxZoom,
    visitedMLBparks = 0, plannedMLBparks = 0,
    visitedMNparks = 0, plannedMNparks = 0;

map = L.map("map", {
  center: [46.41, -93.19],
  zoom: 6,
  minZoom: 2,
  maxZoom: 19
});

windowSize = $(window).width();
mapMaxZoom = map.getMaxZoom();

if (windowSize > 600) {
  collapseLegend = false;
} else {
  collapseLegend = true;
}

var esriServiceUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
var esriAttribution = 'Tiles &copy; Esri';

var esriTopo = L.tileLayer(esriServiceUrl + 'World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
	minZoom: 2,
  maxZoom: 15,
  attribution: esriAttribution
}).addTo(map);

var esriSatellite = L.tileLayer(esriServiceUrl + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', {
   minZoom: 15,
   maxZoom: mapMaxZoom,
   attribution: esriAttribution
}).addTo(map);

var esriRoadsReference = L.tileLayer(esriServiceUrl + 'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
  minZoom: 15,
  maxZoom: mapMaxZoom,
  attribution: esriAttribution
}).addTo(map);

var esriReference = L.tileLayer(esriServiceUrl + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
  minZoom: 15,
  maxZoom: mapMaxZoom,
  attribution: esriAttribution
}).addTo(map);

function setPopupContent (feature, layer) {
  if (feature.properties.teamName) {
    var popupContent = "<b style='font-size:20px;'>" + feature.properties.ballparkName + "</b><br/>";
        popupContent += feature.properties.teamName + "<br/>";
  } else {
    var popupContent = "<b style='font-size:20px;'>" + feature.properties.name + "</b><br/>";
  }
  if (feature.properties.comments) {
    popupContent += feature.properties.comments + "<br/><br/>";
  }
  if (feature.properties.visited) {
    popupContent += "<b>Last visited:</b> " + feature.properties.visited + "<br/>";
    if (feature.properties.ballparkName) {
      if (feature.properties.visited != 'N/A' && feature.properties.visited != 'Planned' && feature.properties.visited != 'Kitty only' && feature.properties.visited != 'Eric only') {
        visitedMLBparks = visitedMLBparks + 1;
      } else if (feature.properties.visited === 'Planned') {
        plannedMLBparks = plannedMLBparks + 1;
      }
    } else if (feature.properties.name) {
      if (feature.properties.visited != 'N/A' && feature.properties.visited != 'Planned') {
        visitedMNparks = visitedMNparks + 1;
      } else if (feature.properties.visited === 'Planned') {
        plannedMNparks = plannedMNparks + 1;
      }
    }
  }
  if (feature.properties.camping) {
    popupContent += "<b>Camping:</b> " + feature.properties.camping + "<br/>";
  }
  if (feature.properties.activities) {
    popupContent += "<b>Activities:</b> " + feature.properties.activities + "<br/>";
  }
  if (feature.properties.notes) {
    popupContent += "<b>Notes:</b> " + feature.properties.notes + "<br/>";
  }
  if (feature.properties.photo) {
    popupContent += "<div class='center'>";
    if (feature.properties.photoType == "portrait") {
      popupContent += "<img class='popupPortrait' src='photos/" + feature.properties.photo + "'></img>";
    } else if (feature.properties.photoType == "ballpark") {
      popupContent += "<img class='ballparkPhoto' src='photos/" + feature.properties.photo + "'></img>";
    } else {
      popupContent += "<img class='popupPhoto' src='photos/" + feature.properties.photo + "'></img>";
    }
    popupContent += "</div>";
  }
	layer.bindPopup(popupContent);
}

function updateAttributeWindow (hover) {
  var attributeInfo = hover.target.feature.properties;
  attributeWindow.update(attributeInfo);
}

var mnParks = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: setColor(feature.properties.visited),
      color: '#FFF',
      fillOpacity: 0.8
    });
  },
  onEachFeature: setPopupContent
});
$.getJSON("places/parks.json", function (data) {
	mnParks.addData(data).addTo(map);
});

var mlbBallparks = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 5,
      fillColor: setColor(feature.properties.visited),
      color: '#FFF',
      fillOpacity: 0.8
    });
  },
  onEachFeature: setPopupContent
});
$.getJSON("places/ballparks.json", function (data) {
	mlbBallparks.addData(data);
});

function setColor (value) {
  switch (value) {
    case 'N/A':                             return '#8E0152';
    case 'Planned':                         return '#DE77AE';
    case 'Kitty only': case 'Eric only':    return '#A1D76A';
    default:                                return '#276419';
  }
}

var overlayMaps = {
    "<b>State Parks</b><span><br/><span id='visited' class='legendSymbol'></span> Visited<br/><span id='planned' class='legendSymbol'></span>  Planned<br/><span id='remaining' class='legendSymbol'></span>  Remaining</span>": mnParks,
    "<b>Ballparks</b><span><br/><span id='visited' class='legendSymbol'></span>  Visited<br/><span id='planned' class='legendSymbol'></span>  Planned<br/><span id='remaining' class='legendSymbol'></span>  Remaining<br/><span id='mlbSolo' class='legendSymbol'></span> Solo visit</span>": mlbBallparks,
};

L.control.layers(null, overlayMaps, {
  collapsed: collapseLegend
}).addTo(map);

//Zoom to the respective layer if checking it on in the legend
//If another layer is active, emit a click to remove it from the map view.
map.on('overlayadd', function (layer) {
  var toggleItem;
  if (layer.name.indexOf("State Parks") >= 0) {
    var activeLayer = mnParks;
    var getMNParksPercent = ((visitedMNparks/83) * 100).toFixed(0);
    attributeWindow._div.innerHTML = '<h2>State Parks</h2>' +
    "<p><b>Planned:</b> " + plannedMNparks + "<br />" +
    "<b>Visited:</b> " + visitedMNparks + " of " + mnParks.getLayers().length + " (" + getMNParksPercent + "%)</p>";
    toggleItem = $(".leaflet-control-layers-selector")[1];
  } else {
    var activeLayer = mlbBallparks;
    var getMLBParksPercent = ((visitedMLBparks/30) * 100).toFixed(1);
    attributeWindow._div.innerHTML = '<h2>Ballparks</h2>' +
    "<p><b>Planned:</b> " + plannedMLBparks + "<br />" +
    "<b>Visited:</b> " + visitedMLBparks + " of " + mlbBallparks.getLayers().length + " (" + getMLBParksPercent + "%)</p>";
    toggleItem = $(".leaflet-control-layers-selector")[0];
  }
  map.fitBounds(activeLayer.getBounds());
  if (toggleItem.checked) { $(toggleItem).trigger('click'); }
});

var attributeWindow = L.control({position: 'bottomleft'});

attributeWindow.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'attributeWindow');
    return this._div;
};

attributeWindow.addTo(map);
