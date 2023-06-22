// Copyright (c) 2023, Mainul Islam and contributors
// For license information, please see license.txt

const DEFAULT_TYPE_IMAGE = {
	'Function': '',
	'IP Device': ''
}


frappe.ui.form.on('Room', {
	refresh: frm => {
		frm.trigger('floor_plan')
	},
	building_location: frm => {
		const data = JSON.parse(frm.doc.building_location)
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		data.features.forEach(feature => {
			const coordinates = feature.geometry.coordinates[0];
			coordinates.forEach(coordinate => {
				const [x, y] = coordinate;
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			});
		});
		let fields = {
			"minimum_x_extent": minX,
			"maximum_x_extent": maxX,
			"minimum_y_extent": minY,
			"maximum_y_extent": maxY
		}
		for (let [field, val] of Object.entries(fields)) {
			frm.set_value(field, val)
		}
	},
	set_floor_plan: frm => {
		let map = frm.get_field('location').map;
		let extents = [frm.doc.minimum_x_extent, frm.doc.minimum_y_extent, frm.doc.maximum_x_extent, frm.doc.maximum_y_extent]
		if (map && frm.doc.floor_plan) {
			frm.imageLayerSource = new ol.source.ImageStatic({
				url: frm.doc.floor_plan,
				imageExtent: extents
			})
			if (!frm.imageLayer) {
				frm.imageLayer = new ol.layer.Image({
					source: frm.imageLayerSource,
					opacity: 1,
					zIndex: 0
				});
				map.addLayer(frm.imageLayer)
				frm.get_field('location').vector.setZIndex(1)
			}
			// set Certer View.
			map.getView().setCenter(ol.extent.getCenter(extents))
		} else if (map && !frm.doc.floor_plan && "imageLayerSource" in this.frm) {
			this.frm.imageLayerSource.clear()
		}
	},
	ol_on_render: (frm, fieldname) => {
		if (fieldname == "location") {
			frm.trigger('set_floor_plan')
			frm.trigger('set_roman_room_number')
			frm.trigger('set_elements')
		}
	},
	set_elements: frm =>{
		let map_field = frm.get_field('location');
		if (map_field) {
			// create vetor layer
			frm.element_source = new ol.source.Vector()
			frm.element_layer = new ol.layer.Vector({
				source: frm.element_source,
				style: function(feature) {
					return new ol.style.Style({
						image: new ol.style.Icon({
							src: feature.data['icon'] || DEFAULT_TYPE_IMAGE[feature.data.element_type], // replace with your image path
							anchor: [0.5, 1],
							scale: 0.5,
							size: [32, 32]
						})
					});
				},
				zIndex: 5
			})
			map_field.map.addLayer(frm.element_layer)
			// Filter input.
			let wrapper = $('<div>')
			wrapper.appendTo(map_field.map_area)
			map_field.filter_element = frappe.ui.form.make_control({
				parent: wrapper,
				df: {
					fieldname: map_field.df.fieldname+'_element_type',
					fieldtype: 'Select',
					options: [
						{'value': '', 'label': __('All')},
						{'value': 'Function', 'label': __('Function')},
						{'value': 'IP Device', 'label': __('IP Device')}
					],
					on_change: value=>{
						console.log("Hi")
						frm.trigger('filte_elements')
					}
				},
				render_input: true,
			})
		}
	},
	filte_elements: frm =>{
		// Show elements based on filters.
		console.log("Hello")
		frm.element_source.clear()
		frm.trigger('inserts_elements')
	},
	inserts_elements: frm =>{
		let map_field = frm.get_field('location');
		if (map_field) {
			filters_val = map_field.filter_element.get_value()
			let items = frm.doc?.['elements'] || []
			if (filters_val && filters_val !='All') {
				items = frm.doc?.['elements'].filter(row=>row.element_type===filters_val)
			}
			console.log(items)
			items.forEach(row=>{
				let point = (row.latitude || row.longitude)?[row.latitude, row.longitude]:ol.extent.getCenter(map_field.source.getExtent())
				frm.element_source.addFeatures([
					new ol.Feature({
						geometry: new ol.geom.Point(point),
						name: row.name,
						data: row
					})
				])
			})
		}
	},
	roman_room_number: frm => {
		frm.trigger('set_roman_room_number')
	},
	set_roman_room_number: frm => {
		let map_field = frm.get_field('location');
		if (map_field) {
			if (!frm.textLayer) {
				frm.textLayerSource = new ol.source.Vector()
				frm.textLayer = new ol.layer.Vector({
					source: frm.textLayerSource,
					zIndex: 2,
					style: function(feature) {
						return new ol.style.Style({
						  text: new ol.style.Text({
							text: feature.get('text'),
							font: '16px Arial', // Adjust the font and size as needed
							fill: new ol.style.Fill({ color: 'black' }), // Adjust the text color
							stroke: new ol.style.Stroke({ color: 'white', width: 2 }) // Adjust the text outline color and width
						  })
						});
					  }
				})
				map_field.map.addLayer(frm.textLayer)
			}
			frm.textLayerSource.clear()
			if (frm.doc.roman_room_number) {
				frm.textLayerSource.addFeature(new ol.Feature({
					geometry: new ol.geom.Point(ol.extent.getCenter(map_field.source.getExtent())),
					text: getRomanNumeral(frm.doc.roman_room_number)
				}))
			}
		}
	}
});

function getRomanNumeral(number) {
	var romanNumerals = [{
			value: 1000,
			numeral: 'M'
		},
		{
			value: 900,
			numeral: 'CM'
		},
		{
			value: 500,
			numeral: 'D'
		},
		{
			value: 400,
			numeral: 'CD'
		},
		{
			value: 100,
			numeral: 'C'
		},
		{
			value: 90,
			numeral: 'XC'
		},
		{
			value: 50,
			numeral: 'L'
		},
		{
			value: 40,
			numeral: 'XL'
		},
		{
			value: 10,
			numeral: 'X'
		},
		{
			value: 9,
			numeral: 'IX'
		},
		{
			value: 5,
			numeral: 'V'
		},
		{
			value: 4,
			numeral: 'IV'
		},
		{
			value: 1,
			numeral: 'I'
		}
	];

	var result = '';
	for (var i = 0; i < romanNumerals.length; i++) {
		while (number >= romanNumerals[i].value) {
			result += romanNumerals[i].numeral;
			number -= romanNumerals[i].value;
		}
	}
	return result;
}
frappe.ui.form.on('Room Element', {
	elements_add: (frm, cdt, cdn)=>{
		frm.trigger('filte_elements')
	}
})