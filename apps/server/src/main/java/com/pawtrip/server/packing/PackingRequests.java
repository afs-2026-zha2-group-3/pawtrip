package com.pawtrip.server.packing;

public final class PackingRequests {

	private PackingRequests() {
	}

	public record AddItem(String name, String category, Integer quantity) {
	}

	public record UpdateItem(String name, String category, Integer quantity, Boolean checked) {

		public boolean isEmpty() {
			return this.name == null && this.category == null && this.quantity == null && this.checked == null;
		}

	}

}
