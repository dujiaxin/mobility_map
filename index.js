// Converts geojson-vt data to GeoJSON
var replacer = function(key, value) {
  if (value.geometry) {
    var type;
    var rawType = value.type;
    var geometry = value.geometry;

    if (rawType === 1) {
      type = 'MultiPoint';
      if (geometry.length == 1) {
        type = 'Point';
        geometry = geometry[0];
      }
    } else if (rawType === 2) {
      type = 'MultiLineString';
      if (geometry.length == 1) {
        type = 'LineString';
        geometry = geometry[0];
      }
    } else if (rawType === 3) {
      type = 'Polygon';
      if (geometry.length > 1) {
        type = 'MultiPolygon';
        geometry = [geometry];
      }
    }

    return {
      'type': 'Feature',
      'geometry': {
        'type': type,
        'coordinates': geometry
      },
      'properties': value.tags
    };
  } else {
    return value;
  }
};

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  target: 'map',
  view: new ol.View({
    center: [0, 0],
    zoom: 2
  })
});

var url = 'data/WholeworldWithDataSimp.geojson';
fetch(url).then(function(response) {
  return response.json();
}).then(function(json) {
  var tileIndex = geojsonvt(json, {
    extent: 4096,
    debug: 1
  });
  var vectorSource = new ol.source.VectorTile({
    format: new ol.format.GeoJSON({
      // Data returned from geojson-vt is in tile pixel units
      dataProjection: new ol.proj.Projection({
        code: 'TILE_PIXELS',
        units: 'tile-pixels',
        extent: [0, 0, 4096, 4096]
      })
    }),
    tileUrlFunction: function(tileCoord) {
      var data = tileIndex.getTile(tileCoord[0], tileCoord[1], tileCoord[2]);
      var geojson = JSON.stringify({
        type: 'FeatureCollection',
        features: data ? data.features : []
      }, replacer);
      return 'data:application/json;charset=UTF-8,' + geojson;
    }
  });
  var vectorLayer = new ol.layer.VectorTile({
    source: vectorSource
  });
  map.addLayer(vectorLayer);
});