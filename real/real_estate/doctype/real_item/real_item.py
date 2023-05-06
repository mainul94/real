# Copyright (c) 2023, Mainul Islam and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

class RealItem(Document):
	def on_update(self):
		self.update_lookbook()
	
	def update_lookbook(self):
		pass
