/*
  timeslider.js: adds a time slider to any Leaflet map made with GeoJSON data.

  How to use it:
  1. Put this file in the same folder as your index.html (the map folder).
  2. In index.html, add this line directly UNDER the line that loads Leaflet,
     and ABOVE your own script:
        <script src="timeslider.js"></script>
  3. In your data, give each place a Date (a year, like 1880 or 1880s).
     Optional: add an End column with the year the place stopped existing.

  Places with no Date stay on the map all the time.
*/
(function () {
  if (!window.L || !L.Map || !L.Map.addInitHook) { return; }

  function yearOf(v) {
    var m = String(v === null || v === undefined ? "" : v).match(/(1[6-9]\d\d|20\d\d)/);
    return m ? parseInt(m[1], 10) : null;
  }

  L.Map.addInitHook(function () {
    var map = this, items = [], timer = null, ui = null;

    // Remember every GeoJSON feature that has a Date, as it is added to the map.
    map.on("layeradd", function (e) {
      var layer = e.layer, f = layer && layer.feature;
      if (!f || !f.properties || layer._tsSeen) { return; }
      var start = yearOf(f.properties.Date), end = yearOf(f.properties.End);
      if (!start && !end) { return; }
      layer._tsSeen = true;
      items.push({ layer: layer, start: start, end: end });
      clearTimeout(timer);
      timer = setTimeout(build, 300);
    });

    function build() {
      var years = [];
      items.forEach(function (it) { if (it.start) { years.push(it.start); } if (it.end) { years.push(it.end); } });
      if (!years.length) { return; }
      var min = Math.min.apply(null, years), max = Math.max.apply(null, years);

      if (!ui) {
        ui = document.createElement("div");
        ui.style.cssText = "position:absolute;left:50%;bottom:20px;transform:translateX(-50%);z-index:1000;background:#fff;" +
          "padding:10px 14px;border-radius:12px;box-shadow:0 3px 14px rgba(0,0,0,0.45);width:min(520px,calc(100% - 28px));" +
          "font-family:system-ui,sans-serif;font-size:14px;";
        ui.innerHTML =
          '<div style="display:flex;align-items:center;gap:10px;">' +
          '<input type="range" id="ts-range" aria-label="Year" style="flex:1;">' +
          '<span id="ts-year" style="font-weight:700;font-size:17px;min-width:3.2em;text-align:right;">All</span></div>' +
          '<label style="display:block;margin-top:4px;"><input type="checkbox" id="ts-all" checked> Show everything (move the slider to see a single year)</label>' +
          '<div style="display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:2px;"><span id="ts-min"></span><span id="ts-max"></span></div>';
        map.getContainer().appendChild(ui);
        if (L.DomEvent) { L.DomEvent.disableClickPropagation(ui); }
        ui.querySelector("#ts-range").addEventListener("input", function () {
          ui.querySelector("#ts-all").checked = false; apply();
        });
        ui.querySelector("#ts-all").addEventListener("change", apply);
      }
      var range = ui.querySelector("#ts-range");
      range.min = min; range.max = max; range.step = 1;
      if (!range.value || +range.value < min || +range.value > max) { range.value = max; }
      ui.querySelector("#ts-min").textContent = min;
      ui.querySelector("#ts-max").textContent = max;
      apply();
    }

    function apply() {
      var showAll = ui.querySelector("#ts-all").checked, y = parseInt(ui.querySelector("#ts-range").value, 10);
      ui.querySelector("#ts-year").textContent = showAll ? "All" : y;
      items.forEach(function (it) {
        var visible = showAll || ((!it.start || it.start <= y) && (!it.end || y <= it.end));
        if (visible && !map.hasLayer(it.layer)) { map.addLayer(it.layer); }
        if (!visible && map.hasLayer(it.layer)) { map.removeLayer(it.layer); }
      });
    }
  });
})();
