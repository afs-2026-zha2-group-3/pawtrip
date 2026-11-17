package com.pawtrip.server.trip;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.pawtrip.server.application.model.maps.RouteEstimateRequest;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Mode;
import com.pawtrip.server.application.model.maps.RouteEstimateResult;
import com.pawtrip.server.application.port.maps.RouteEstimatePort;
import com.pawtrip.server.auth.AppUser;
import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.location.PawtripLocation;
import com.pawtrip.server.location.PawtripLocationRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TripRouteEstimateServiceTest {

	private static final String USERNAME = "route-user";

	private static final long TRIP_ID = 10L;

	private static final String FROM_POI = "poi-route-one";

	private static final String TO_POI = "poi-route-two";

	@Mock
	TripRepository tripRepository;

	@Mock
	AppUserRepository appUserRepository;

	@Mock
	PawtripLocationRepository locationRepository;

	@Mock
	RouteEstimatePort routeEstimatePort;

	@InjectMocks
	TripRouteEstimateService service;

	private void stubOwnedTrip() {
		AppUser user = Mockito.mock(AppUser.class);
		when(user.getId()).thenReturn(1L);
		when(this.appUserRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
		when(this.tripRepository.findByIdAndUserId(TRIP_ID, 1L))
			.thenReturn(Optional.of(Mockito.mock(Trip.class)));
	}

	private void stubLocations(Double fromLng, Double fromLat) {
		PawtripLocation from = new PawtripLocation(FROM_POI, "西湖", "110000", "attraction", "杭州",
				fromLng, fromLat, "330100", "{}", "{}", 1, 3);
		PawtripLocation to = new PawtripLocation(TO_POI, "灵隐寺", "110000", "attraction", "杭州",
				120.1, 30.1, "330100", "{}", "{}", 1, 2);
		when(this.locationRepository.findAllByPoiIdIn(any())).thenReturn(List.of(from, to));
	}

	private static void assertValidationError(ThrowingCallable action) {
		assertThatThrownBy(action)
			.isInstanceOf(ApiException.class)
			.satisfies(exception -> assertThat(((ApiException) exception).getCode())
				.isEqualTo(ApiErrorCode.VALIDATION_ERROR));
	}

	@Test
	void drivingEstimateAppliesTwentyPercentRangeAndCeilsMinutes() {
		stubOwnedTrip();
		stubLocations(120.0, 30.0);
		when(this.routeEstimatePort.estimate(any()))
			.thenReturn(new RouteEstimateResult(new BigDecimal("50"), 61L));

		TripResponses.RouteEstimate result = this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "drive");

		assertThat(result.mode()).isEqualTo("drive");
		assertThat(result.durationMinutes()).isEqualTo(2);
		assertThat(result.costLowYuan()).isEqualTo(40.0);
		assertThat(result.costHighYuan()).isEqualTo(60.0);
		ArgumentCaptor<RouteEstimateRequest> captor = ArgumentCaptor.forClass(RouteEstimateRequest.class);
		verify(this.routeEstimatePort).estimate(captor.capture());
		RouteEstimateRequest request = captor.getValue();
		assertThat(request.mode()).isEqualTo(Mode.DRIVE);
		assertThat(request.origin().poiId()).isEqualTo(FROM_POI);
		assertThat(request.origin().longitude()).isEqualByComparingTo(new BigDecimal("120.0"));
		assertThat(request.origin().latitude()).isEqualByComparingTo(new BigDecimal("30.0"));
		assertThat(request.destination().poiId()).isEqualTo(TO_POI);
		assertThat(request.destination().longitude()).isEqualByComparingTo(new BigDecimal("120.1"));
		assertThat(request.destination().latitude()).isEqualByComparingTo(new BigDecimal("30.1"));
	}

	@Test
	void walkingEstimateReturnsZeroCostsAndCeiledMinutes() {
		stubOwnedTrip();
		stubLocations(120.0, 30.0);
		when(this.routeEstimatePort.estimate(any()))
			.thenReturn(new RouteEstimateResult(null, 30460L));

		TripResponses.RouteEstimate result = this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "walk");

		assertThat(result.mode()).isEqualTo("walk");
		assertThat(result.durationMinutes()).isEqualTo(508);
		assertThat(result.costLowYuan()).isEqualTo(0.0);
		assertThat(result.costHighYuan()).isEqualTo(0.0);
		ArgumentCaptor<RouteEstimateRequest> captor = ArgumentCaptor.forClass(RouteEstimateRequest.class);
		verify(this.routeEstimatePort).estimate(captor.capture());
		assertThat(captor.getValue().mode()).isEqualTo(Mode.WALK);
	}

	@Test
	void costBoundsAreRoundedToTwoDecimals() {
		stubOwnedTrip();
		stubLocations(120.0, 30.0);
		when(this.routeEstimatePort.estimate(any()))
			.thenReturn(new RouteEstimateResult(new BigDecimal("127"), 600L));

		TripResponses.RouteEstimate result = this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "drive");

		assertThat(result.durationMinutes()).isEqualTo(10);
		assertThat(result.costLowYuan()).isEqualTo(101.6);
		assertThat(result.costHighYuan()).isEqualTo(152.4);
	}

	@Test
	void exactMinuteAndZeroSecondsAreNotRoundedUp() {
		stubOwnedTrip();
		stubLocations(120.0, 30.0);
		when(this.routeEstimatePort.estimate(any()))
			.thenReturn(new RouteEstimateResult(new BigDecimal("50"), 60L))
			.thenReturn(new RouteEstimateResult(new BigDecimal("50"), 0L));

		assertThat(this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "drive").durationMinutes())
			.isEqualTo(1);
		assertThat(this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "drive").durationMinutes())
			.isEqualTo(0);
	}

	@Test
	void missingCoordinatesFailValidationBeforePortCall() {
		stubOwnedTrip();
		stubLocations(null, null);

		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "drive"));
		verifyNoInteractions(this.routeEstimatePort);
	}

	@Test
	void unknownPoiIdFailsValidationBeforePortCall() {
		stubOwnedTrip();
		PawtripLocation from = new PawtripLocation(FROM_POI, "西湖", "110000", "attraction", "杭州",
				120.0, 30.0, "330100", "{}", "{}", 1, 3);
		when(this.locationRepository.findAllByPoiIdIn(any())).thenReturn(List.of(from));

		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "drive"));
		verifyNoInteractions(this.routeEstimatePort);
	}

	@Test
	void invalidModeFailsValidationBeforePortCall() {
		stubOwnedTrip();

		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "transit"));
		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "self_drive"));
		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, ""));
		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, null));
		verifyNoInteractions(this.routeEstimatePort);
	}

	@Test
	void blankPoiIdsFailValidationBeforePortCall() {
		stubOwnedTrip();

		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, "", TO_POI, "drive"));
		assertValidationError(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, null, "drive"));
		verifyNoInteractions(this.routeEstimatePort);
	}

	@Test
	void nonOwnedTripFailsWithTripNotFound() {
		AppUser user = Mockito.mock(AppUser.class);
		when(user.getId()).thenReturn(1L);
		when(this.appUserRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
		when(this.tripRepository.findByIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> this.service.estimate(USERNAME, TRIP_ID, FROM_POI, TO_POI, "drive"))
			.isInstanceOf(TripNotFoundException.class);
		verifyNoInteractions(this.routeEstimatePort);
	}

}