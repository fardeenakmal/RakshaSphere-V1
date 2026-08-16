package com.rakshasphere.health;

import org.springframework.boot.actuate.health.Status;

public class CustomHealthStatuses {
    public static final Status HEALTHY = Status.UP;
    public static final Status DEGRADED = new Status("DEGRADED");
    public static final Status DOWN = Status.DOWN;
    public static final Status UNKNOWN = Status.UNKNOWN;
    public static final Status SIMULATED = new Status("SIMULATED");
    public static final Status NOT_DEPLOYED = new Status("NOT_DEPLOYED");
}
