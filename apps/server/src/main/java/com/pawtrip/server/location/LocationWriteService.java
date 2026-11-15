package com.pawtrip.server.location;

import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LocationWriteService {

	private final PawtripLocationRepository locationRepository;
	private final LocationPhotoRepository photoRepository;

	public LocationWriteService(PawtripLocationRepository locationRepository, LocationPhotoRepository photoRepository) {
		this.locationRepository = locationRepository;
		this.photoRepository = photoRepository;
	}

	@Transactional
	PawtripLocation create(PawtripLocation location, List<PhotoMetadata> photos) {
		PawtripLocation savedLocation;
		try {
			savedLocation = this.locationRepository.saveAndFlush(location);
		}
		catch (JpaSystemException exception) {
			if (isDuplicatePoiId(exception)) {
				throw new DuplicatePoiIdException(exception);
			}
			throw exception;
		}

		List<LocationPhoto> photoEntities = photos.stream()
				.map(photo -> new LocationPhoto(savedLocation.getId(), photo.order(), photo.sourceJson(), photo.title(),
						photo.sourceUrl()))
				.toList();
		if (!photoEntities.isEmpty()) {
			this.photoRepository.saveAll(photoEntities);
		}
		return savedLocation;
	}

	@Transactional
	PawtripLocation updateVisitHours(String poiId, Integer minVisitHours, Integer maxVisitHours) {
		PawtripLocation location = this.locationRepository.findByPoiId(poiId)
				.orElseThrow(() -> new ApiException(ApiErrorCode.LOCATION_NOT_FOUND, "Saved location was not found"));
		location.updateVisitHours(minVisitHours, maxVisitHours);
		return this.locationRepository.save(location);
	}

	private static boolean isDuplicatePoiId(Throwable exception) {
		Throwable cause = exception;
		while (cause != null) {
			if (cause instanceof SQLException sqlException) {
				return Optional.ofNullable(sqlException.getMessage())
						.map(message -> message.contains("UNIQUE constraint failed: pawtrip_location.poi_id"))
						.orElse(false);
			}
			cause = cause.getCause();
		}
		return false;
	}

	record PhotoMetadata(int order, String sourceJson, String title, String sourceUrl) {
	}

	static final class DuplicatePoiIdException extends RuntimeException {

		DuplicatePoiIdException(Throwable cause) {
			super(cause);
		}
	}

}
