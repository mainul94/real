import frappe


@frappe.whitelist()
def get_buildings():
    return frappe.get_list('Real Item', fields=['name', 'notes', 'flat_details', 'gps_coordinates'],limit_page_length=0)
