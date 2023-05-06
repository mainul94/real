import * as L from 'ol';
import {
	FullScreen,
	defaults as defaultControls, ZoomToExtent, ScaleLine, Rotate
} from 'ol/control.js';
// import Attribution from 'ol/control/Attribution.js';


frappe.ui.form.ControlGeolocation = class ControlGeolocation extends frappe.ui.form.ControlGeolocation {

	make_map() {
		this.map_area.children('#' + this.map_id).css('height', '400px')
		this.bind_leaflet_map();
		this.bind_olt_draw_control();
		// this.bind_leaflet_locate_control();
		// this.bind_leaflet_refresh_button();
	}
	bind_leaflet_map() {
		const raster = new ol.layer.Tile({
			source: new ol.source.OSM(),
		});

		this.map = new ol.Map({
			controls: defaultControls().extend([new ol.control.Attribution(), new FullScreen(), new ZoomToExtent(), new ScaleLine(), new Rotate()]),
			layers: [raster],
			target: this.map_id,
			view: new ol.View({
				center: frappe.utils.map_defaults.center,
				zoom: frappe.utils.map_defaults.zoom,
			}),
		});

		// L.tileLayer(frappe.utils.map_defaults.tiles, frappe.utils.map_defaults.options).addTo(
		// 	this.map
		// );
	}
	bind_olt_draw_control() {
		// if (this.can_write()) {
			this.make_vector_type()
			this.add_vector_layer()
		// }
	}
	make_vector_type() {
		this.vector_type = $(`<select id="vector_type">
        <option value="LineString">Length (LineString)</option>
        <option value="Polygon">Area (Polygon)</option>
        <option value="Point">Point</option>
        <option value="Circle">Circle</option>
      </select>`)
		this.vector_type.appendTo(this.map_area).on('change', () => {
			this.map.removeInteraction(this.draw);
			this.map.removeInteraction(this.snap);
			this.addInteractions();
		})
		this.reset_button = $(`<button type="button"> ${__("Reset")}</button>`)
		this.reset_button.appendTo(this.map_area).on('click', () => {
			this.source.clear()
			this.set_value('')
		})
	}
	add_vector_layer() {
		let value = this.frm.doc?.[this.df.fieldname]
		let args = {}
		if(value) {
			args['features'] = new ol.format.GeoJSON().readFeatures(JSON.parse(JSON.parse(value)))
		}
		this.source = new ol.source.Vector(args);
		this.vector = new ol.layer.Vector({
			source: this.source,
			style: function (feature) {
				// If the feature is a point, create an icon style
				if (feature.getGeometry().getType() === 'Point') {
					return new ol.style.Style({
						image: new ol.style.Icon({
							src: '/assets/real/images/home_64.png', // replace with your image path
							anchor: [0.5, 1],
							scale: 0.5
						})
					});
				}
				// If the feature is not a point, use the default style
				else {
					return new ol.style.Style({
						fill: new ol.style.Fill({
							color: 'rgba(255, 255, 255, 0.2)',
						}),
						stroke: new ol.style.Stroke({
							color: '#ffcc33',
							width: 2,
						}),
						image: new ol.style.Circle({
							radius: 7,
							fill: new ol.style.Fill({
								color: '#ffcc33',
							}),
						}),
					});
				}
			}
		});
		this.map.addLayer(this.vector)
		this.addInteractions()
		// Fit to Map
		if (value) {
			this.zoom_to_vector_center()
		}
	}
	zoom_to_vector_center() {
		// Get the current view of the map
		const view = this.map.getView();
		console.log(this.source.getExtent())
		// Set the new center point on the map's view
		// view.setCenter(ol.extent.getCenter(this.source.getExtent()));
		view.fit(this.source.getExtent(), {
			size: this.map.getSize(),
			padding: [10, 10, 10, 10],
			maxZoom: 16 // or any other maximum zoom level you desire
		  });
	}
	fit_to_display() {
		// Get the extent of the vector data in the desired projection
		const extent = this.source.getExtent();
		console.log(this.source.getProjection())
		const extent4326 = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326'); //, 'EPSG:3857', 'EPSG:4326'

		// Get the view of the map
		const view = this.map.getView();

		// Zoom the map to the extent of the vector data in the desired projection
		view.fit(extent4326, { padding: [50, 50, 50, 50], duration: 1000 });

	}
	addInteractions() {
		this.draw = new ol.interaction.Draw({
			source: this.source,
			type: this.vector_type.val() || 'LineString',
		});
		this.map.addInteraction(this.draw);
		this.snap = new ol.interaction.Snap({
			source: this.source
		});
		this.map.addInteraction(this.snap);
		this.modify = new ol.interaction.Modify({
			source: this.source
		});
		this.map.addInteraction(this.modify);
		// Add Events
		this.draw.on('drawend', ()=>{
			this.set_input_value_as_string()
		})
		this.modify.on('modifyend', ()=>{
			this.set_input_value_as_string()
		})
		// this.remove.on('removeend', ()=>{
		// 	this.set_input_value_as_string()
		// })
	}
	set_input_value_as_string(){
		setTimeout(()=>{
			const features = this.source.getFeatures();
			const geojsonFormat = new ol.format.GeoJSON();
			const geojson = geojsonFormat.writeFeatures(features);
			this.set_value(JSON.stringify(geojson));
		})
	}
	format_for_input(value) {
	}
	get required_libs() {
		window.L = L
		return [
			"assets/real/node_modules/ol/ol.css",
			"assets/real/node_modules/ol/dist/ol.js",
		];
	}
}