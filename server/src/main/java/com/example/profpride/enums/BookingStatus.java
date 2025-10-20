package com.example.profpride.enums;

public enum BookingStatus {
    PENDING,        // New booking request awaiting token amount for confirmation
    CONFIRMED,      // Booking confirmed and ready for check-in (payment done)
    CHECKEDIN,      // Guest has checked in
    CHECKEDOUT,     // Guest has checked out
    CANCELLED,      // Booking cancelled due to some readon
    NO_SHOW,        // Guest didn't show up for check-in
    COMPLETED       // Booking completed (alternative to CHECKEDOUT)
}
