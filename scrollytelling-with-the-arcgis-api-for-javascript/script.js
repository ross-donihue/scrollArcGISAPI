require([
  "esri/Camera",
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/Layer",
  "esri/layers/GeoJSONLayer",
  "esri/geometry/geometryEngine",
  "esri/core/watchUtils",
  "animations/layers/LineLayerAnimation",
  "animations/support/interpolate"
], function(
  Camera,
  Map,
  SceneView,
  Layer,
  GeoJSONLayer,
  geometryEngine,
  watchUtils,
  LineLayerAnimation,
  interpolate
) {
  // Overview camera
  var cameraA = new Camera({
    position: {
      spatialReference: { latestWkid: 3857, wkid: 102100 },
      x: -7909937.703683352,
      y: 5214411.41498922,
      z: 5662.71134893503
    },
    heading: 0,
    tilt: 0
  });
  var datetimeA = new Date("Fri Jun 21 2019 19:00:00 GMT+0200");

  var cameraB = new Camera({
    position: {
      spatialReference: { latestWkid: 3857, wkid: 102100 },
      x: -7912108.151415734,
      y: 5213899.50879747,
      z: 725.303618597798
    },
    heading: 74.23167582579066,
    tilt: 43.404465157723436
  });
  var datetimeB = new Date("Sat Jun 22 2019 00:45:00 GMT+0200");

  var map = new Map({
    basemap: "topo",
    ground: "world-elevation"
  });

  // Add Boston route
  var route = new GeoJSONLayer({
    url: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/2969649/boston-route.geojson",
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-line",
        width: 5,
        color: "orange"
      }
    }
  });

  var animation = new LineLayerAnimation({
    sourceLayer: route
  });

  animation.whenAnimatedLayer().then(function(animatedLayer) {
    map.add(animatedLayer);
  });

  var routeObjectId = null;
  route.queryObjectIds().then(function(objectIds) {
    routeObjectId = objectIds[0];
  });
  
  // Add 3D buildings and trees of Boston
  Layer.fromPortalItem({
    portalItem: {
      id: "2d913b3b8caf4f3d87be84ff19d77ac7"
    }
  }).then(function(layer) {
    map.add(layer);
  });

  Layer.fromPortalItem({
    portalItem: {
      id: "e1c77e6d3809412f8755faaf810520df"
    }
  }).then(function(layer) {
    map.add(layer);
  });

  var view = new SceneView({
    container: "viewDiv",
    map: map,
    ui: {
      components: ["attribution"]
    },
    camera: cameraA,
    environment: {
      lighting: {
        date: datetimeA,
        directShadowsEnabled: true
      }
    }
  });

  // SCROLL ANIMATION

  var scrollTopOffset = 0;

  function getScrollProgress(element) {
    var elemRect = element.getBoundingClientRect();

    // return window.pageYOffset || document.documentElement.scrollTop;

    var top = elemRect.top + scrollTopOffset;
    var windowHeight =
      window.innerHeight || document.documentElement.clientHeight;

    var progress = Math.min(Math.max(windowHeight - top, 0), elemRect.height);

    return progress / elemRect.height;
  }

  function render() {
    var camera = interpolate(
      cameraA,
      cameraB,
      getScrollProgress(cameraSection)
    );
    view.goTo(camera, { animate: false });

    if (routeObjectId) {
      animation.seek(getScrollProgress(pathSection), routeObjectId);
    }

    view.environment.lighting.date = interpolate(
      datetimeA,
      datetimeB,
      getScrollProgress(daylightSection)
    );
  }

  var apparentScrollTop = 0;
  var animating = false;

  function animationLoop() {
    var previousScrollTop = apparentScrollTop;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    apparentScrollTop =
      Math.round(interpolate(apparentScrollTop, scrollTop, 0.2) * 100) / 100;

    // Make sure animation loop does not run forever
    if (previousScrollTop === apparentScrollTop) {
      apparentScrollTop = scrollTop;
    }

    scrollTopOffset = Math.round(scrollTop - apparentScrollTop);

    animating = true;

    // udpate view
    render();

    if (scrollTopOffset) {
      requestAnimationFrame(animationLoop);
    } else {
      console.log("Pause animation");
      animating = false;
    }
  }

  window.onscroll = function(e) {
    if (!animating) {
      console.log("Start animation");
      animationLoop();
    }
  };
});