import * as L from 'ol';

frappe.views.MapView = class MapView extends frappe.views.MapView  {
    get required_libs() {
		return [
			"assets/frappe/js/lib/leaflet/leaflet.css",
			"assets/frappe/js/lib/leaflet/leaflet.js",
		];
	}
}

