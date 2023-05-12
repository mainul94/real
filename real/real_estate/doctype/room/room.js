// Copyright (c) 2023, Mainul Islam and contributors
// For license information, please see license.txt

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