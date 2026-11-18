package com.pawtrip.server.packing;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip_packing_item")
public class TripPackingItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "checklist_id", nullable = false)
	private Long checklistId;

	@Enumerated(EnumType.STRING)
	@Column(name = "category", nullable = false)
	private PackingCategory category;

	@Column(name = "name", nullable = false)
	private String name;

	@Column(name = "quantity", nullable = false)
	private int quantity;

	@Column(name = "checked", nullable = false)
	private boolean checked;

	@Enumerated(EnumType.STRING)
	@Column(name = "source", nullable = false)
	private PackingSource source;

	@Column(name = "template_key")
	private String templateKey;

	@Enumerated(EnumType.STRING)
	@Column(name = "state", nullable = false)
	private PackingItemState state;

	@Column(name = "quantity_overridden", nullable = false)
	private boolean quantityOverridden;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	@Column(name = "created_at", nullable = false)
	private String createdAt;

	@Column(name = "updated_at", nullable = false)
	private String updatedAt;

	protected TripPackingItem() {
	}

	private TripPackingItem(Long checklistId, PackingCategory category, String name, int quantity,
			PackingSource source, String templateKey, int sortOrder) {
		this.checklistId = checklistId;
		this.category = category;
		this.name = name;
		this.quantity = quantity;
		this.source = source;
		this.templateKey = templateKey;
		this.state = PackingItemState.ACTIVE;
		this.sortOrder = sortOrder;
		String now = Instant.now().toString();
		this.createdAt = now;
		this.updatedAt = now;
	}

	public static TripPackingItem templateItem(Long checklistId, PackingCategory category, String name, int quantity,
			String templateKey, int sortOrder) {
		return new TripPackingItem(checklistId, category, name, quantity, PackingSource.TEMPLATE, templateKey,
				sortOrder);
	}

	public static TripPackingItem customItem(Long checklistId, PackingCategory category, String name, int quantity,
			int sortOrder) {
		return new TripPackingItem(checklistId, category, name, quantity, PackingSource.CUSTOM, null, sortOrder);
	}

	public boolean applyTemplate(String name, PackingCategory category, int quantity, int sortOrder) {
		boolean changed = false;
		if (!this.name.equals(name)) {
			this.name = name;
			changed = true;
		}
		if (this.category != category) {
			this.category = category;
			changed = true;
		}
		if (this.sortOrder != sortOrder) {
			this.sortOrder = sortOrder;
			changed = true;
		}
		if (!this.quantityOverridden && this.quantity != quantity) {
			this.quantity = quantity;
			changed = true;
		}
		if (changed) {
			touch();
		}
		return changed;
	}

	public void reactivate(String name, PackingCategory category, int quantity, int sortOrder) {
		this.state = PackingItemState.ACTIVE;
		this.checked = false;
		this.name = name;
		this.category = category;
		this.sortOrder = sortOrder;
		if (!this.quantityOverridden) {
			this.quantity = quantity;
		}
		touch();
	}

	public void hide() {
		this.state = PackingItemState.HIDDEN;
		touch();
	}

	public void markDeleted() {
		this.state = PackingItemState.DELETED;
		touch();
	}

	public void updateCustom(String name, PackingCategory category, Integer quantity, Boolean checked) {
		if (name != null) {
			this.name = name;
		}
		if (category != null) {
			this.category = category;
		}
		if (quantity != null) {
			this.quantity = quantity;
		}
		if (checked != null) {
			this.checked = checked;
		}
		touch();
	}

	public void updateTemplate(Integer quantity, Boolean checked) {
		if (quantity != null) {
			this.quantity = quantity;
			this.quantityOverridden = true;
		}
		if (checked != null) {
			this.checked = checked;
		}
		touch();
	}

	private void touch() {
		this.updatedAt = Instant.now().toString();
	}

	public Long getId() {
		return this.id;
	}

	public Long getChecklistId() {
		return this.checklistId;
	}

	public PackingCategory getCategory() {
		return this.category;
	}

	public String getName() {
		return this.name;
	}

	public int getQuantity() {
		return this.quantity;
	}

	public boolean isChecked() {
		return this.checked;
	}

	public PackingSource getSource() {
		return this.source;
	}

	public String getTemplateKey() {
		return this.templateKey;
	}

	public PackingItemState getState() {
		return this.state;
	}

	public boolean isQuantityOverridden() {
		return this.quantityOverridden;
	}

	public int getSortOrder() {
		return this.sortOrder;
	}

	public String getCreatedAt() {
		return this.createdAt;
	}

	public String getUpdatedAt() {
		return this.updatedAt;
	}

}
