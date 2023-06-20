frappe.pages['buildings'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Buildings',
		single_column: true
	});
	page.buildingMap = new BuildingView(page)
}

class BuildingView {
	constructor(page) {
		this.page = page
		this.make()
	}
	async make() {
		await frappe.require(this.required_libs());
		this.make_map()
	}
	make_map() {
		this.view_type = 'Symbol'
		this.make_view_switch()
		this.$map_wrapper = $(`<div id="buildings_map">`).appendTo(this.page.body).css('height', '600px')
		const raster = new ol.layer.Tile({
			source: new ol.source.OSM(),
		});
		this.map = new ol.Map({
			target: this.$map_wrapper.attr('id'),
			layers: [raster],
			view: new ol.View({
				center: frappe.utils.map_defaults.center,
				zoom: 0,
			})
		})
		this.symbol_layer_source = new ol.source.Vector()
		this.outline_layer_source = new ol.source.Vector()
		this.symbol_layer = new ol.layer.Vector({
			source: this.symbol_layer_source,
			style: this.symbol_layer_style()
		});
		this.outline_layer = new ol.layer.Vector({
			source: this.outline_layer_source,
			style: this.outline_layer_style()
		});
		this.render_data()
		this.set_popup()
	}
	render_data() {
		frappe.xcall('real.real_estate.page.buildings.building.get_buildings').then(res => {
			// Clear Source
			this.symbol_layer_source.clear()
			this.outline_layer_source.clear()
			if (res) {
				res.forEach(row => {
					if (row.flat_details) {
						let features = new ol.format.GeoJSON().readFeatures(row.flat_details);
						this.outline_layer_source.addFeatures(features)
						this.symbol_layer_source.addFeatures([
							new ol.Feature({
								geometry: new ol.geom.Point(ol.extent.getCenter(features[0].getGeometry().getExtent())),
								name: row.name,
								data: row
							})
						])
					}
				})
			}
			this.switch_view()
		})
	}
	symbol_layer_style() {
		return function (feature) {
			return new ol.style.Style({
				image: new ol.style.Icon({
					src: '/assets/real/images/home_64.png', // replace with your image path
					anchor: [0.5, 1],
					scale: 0.5
				})
			});
		}
	}
	outline_layer_style() {
		return function (feature) {
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
	}
	make_view_switch() {
		this.page.add_label(__("View as"))
		this.$toggle_btn = this.page.add_select(__("Toggle View"), ['Symbol', 'Outline'])
		this.page.show_form()
		this.$toggle_btn.on('change', () => {
			this.view_type = this.$toggle_btn.val()
			this.switch_view()
		})
	}
	switch_view() {
		if (this.view_type == 'Symbol') {
			this.map.removeLayer(this.outline_layer)
			this.map.addLayer(this.symbol_layer)
		} else if (this.view_type == 'Outline') {
			this.map.removeLayer(this.symbol_layer)
			this.map.addLayer(this.outline_layer)
		}
	}
	required_libs() {
		return [
			"assets/real/node_modules/ol/ol.css",
			"assets/real/node_modules/ol/dist/ol.js",
		];
	}
	set_popup() {
		// handle click event on point feature
		this.map.on('click', (event) => {
			this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
				if (feature.getGeometry().getType() === 'Point') {
					let dialog = frappe.msgprint({
						message:frappe.render_template('building_summary', feature.values_),
						title: __("Short Detail")
					})
					$(dialog.wrapper).addClass("modal-lg")
				}
			});
		});
	}
}
