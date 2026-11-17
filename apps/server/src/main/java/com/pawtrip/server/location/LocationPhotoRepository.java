package com.pawtrip.server.location;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationPhotoRepository extends JpaRepository<LocationPhoto, Long> {

	List<LocationPhoto> findAllByLocationIdOrderByPhotoOrderAsc(Long locationId);

	List<LocationPhoto> findAllByLocationIdInOrderByLocationIdAscPhotoOrderAsc(Collection<Long> locationIds);

}
