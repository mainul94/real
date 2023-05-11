// Copyright (c) 2023, Mainul Islam and contributors
// For license information, please see license.txt

frappe.ui.form.on('Room', {
	refresh: frm => {
		// write code here
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
	floor_plan: frm => {
		let map = frm.get_field('location').map
		if (map && frm.doc.floor_plan) {
			let imageLayer = new ol.layer.Image({
				source: new ol.source.ImageStatic({
					url: frm.doc.floor_plan,
					imageExtent: [frm.doc.minimum_x_extent, frm.doc.minimum_y_extent, frm.doc.maximum_x_extent, frm.doc.maximum_y_extent]
				})
			});
			map.addLayer(imageLayer, 0);
			console.log(imageLayer)
		}
	}
});