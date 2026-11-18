package com.pawtrip.server.pet;

/**
 * 宠物性格键（REQ-014，design D1 词表）：单选，存储于 pet.personality。
 * 活泼好动 ENERGETIC、温和平静 CALM、胆小敏感 TIMID。
 */
public enum PetPersonality {

	ENERGETIC, CALM, TIMID

}