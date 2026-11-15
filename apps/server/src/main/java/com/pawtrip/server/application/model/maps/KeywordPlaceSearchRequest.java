package com.pawtrip.server.application.model.maps;

public record KeywordPlaceSearchRequest(String keywords, Integer pageNum, Integer pageSize) {}
