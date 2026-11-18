package com.pawtrip.server.pet;

/**
 * 宠物喜好键（REQ-014，design D1 词表）：多选，逗号分隔存储于 pet.preferences。
 * 游泳 SWIMMING、爬山 HIKING、草地奔跑 GRASS_RUNNING、城市漫步 CITY_WALKING、玩雪 SNOW_PLAY。
 */
public enum PetPreference {

	SWIMMING, HIKING, GRASS_RUNNING, CITY_WALKING, SNOW_PLAY

}