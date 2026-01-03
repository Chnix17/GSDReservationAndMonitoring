# Requirements Document

## Introduction

This feature adds reservation type indicators to the `fetchAssignedRelease` and `fetchAllAssignedReleases` functions in the backend to match the functionality already present in the `fetchRecord` function. The reservation type will indicate whether a reservation is a Trip (vehicle-based), Activity/Event (venue-based), or Equipment-only (EQ) reservation.

## Glossary

- **System**: The General Services Department (GSD) reservation management backend API
- **Reservation Type**: A classification indicating the primary resource type of a reservation (Trip, Activity/Event, or EQ)
- **fetchAssignedRelease**: Backend function that retrieves assigned releases for a specific personnel member
- **fetchAllAssignedReleases**: Backend function that retrieves all assigned releases across all personnel
- **fetchRecord**: Existing backend function that already includes reservation type indicators
- **Trip**: A reservation that includes vehicle resources
- **Activity/Event**: A reservation that includes venue resources
- **EQ**: A reservation that includes only equipment resources

## Requirements

### Requirement 1

**User Story:** As a personnel member viewing my assigned releases, I want to see the reservation type (Trip, Activity/Event, or EQ) so that I can quickly identify what kind of reservation I'm working with.

#### Acceptance Criteria

1. WHEN the System processes a reservation in fetchAssignedRelease, THE System SHALL determine the reservation type based on the presence of vehicles, venues, or equipment
2. WHEN a reservation contains vehicle resources, THE System SHALL classify the reservation type as "Trip"
3. WHEN a reservation contains venue resources and no vehicle resources, THE System SHALL classify the reservation type as "Activity/Event"
4. WHEN a reservation contains only equipment resources and no vehicles or venues, THE System SHALL classify the reservation type as "EQ"
5. WHEN the reservation type cannot be determined, THE System SHALL classify the reservation type as "Unknown"

### Requirement 2

**User Story:** As an administrator viewing all assigned releases, I want to see the reservation type for each reservation so that I can filter and manage different types of reservations efficiently.

#### Acceptance Criteria

1. WHEN the System processes a reservation in fetchAllAssignedReleases, THE System SHALL determine the reservation type based on the presence of vehicles, venues, or equipment
2. WHEN a reservation contains vehicle resources, THE System SHALL classify the reservation type as "Trip"
3. WHEN a reservation contains venue resources and no vehicle resources, THE System SHALL classify the reservation type as "Activity/Event"
4. WHEN a reservation contains only equipment resources and no vehicles or venues, THE System SHALL classify the reservation type as "EQ"
5. WHEN the reservation type cannot be determined, THE System SHALL classify the reservation type as "Unknown"

### Requirement 3

**User Story:** As a developer maintaining the codebase, I want the reservation type logic to be consistent across all fetch functions so that the system behavior is predictable and maintainable.

#### Acceptance Criteria

1. THE System SHALL use the same reservation type determination logic in fetchAssignedRelease, fetchAllAssignedReleases, and fetchRecord
2. THE System SHALL prioritize vehicle presence over venue presence when determining reservation type
3. THE System SHALL prioritize venue presence over equipment-only presence when determining reservation type
4. THE System SHALL include the reservation_type field in the JSON response for each reservation
5. THE System SHALL maintain backward compatibility by adding the reservation_type field without removing existing fields
