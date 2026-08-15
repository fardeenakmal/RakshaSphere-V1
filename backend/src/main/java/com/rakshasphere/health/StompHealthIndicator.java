package com.rakshasphere.health;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.messaging.simp.broker.AbstractBrokerMessageHandler;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Component("stompWebSocket")
public class StompHealthIndicator implements HealthIndicator {

    private static final AtomicLong lastStompMessageTimestamp = new AtomicLong(System.currentTimeMillis());
    private final List<AbstractBrokerMessageHandler> brokerMessageHandlers;

    @Autowired
    public StompHealthIndicator(List<AbstractBrokerMessageHandler> brokerMessageHandlers) {
        this.brokerMessageHandlers = brokerMessageHandlers;
    }

    public static void recordMessageSent() {
        lastStompMessageTimestamp.set(System.currentTimeMillis());
    }

    @Override
    public Health health() {
        boolean brokerRunning = brokerMessageHandlers != null && !brokerMessageHandlers.isEmpty() &&
                brokerMessageHandlers.stream().allMatch(AbstractBrokerMessageHandler::isRunning);

        long timeSinceLastMessageMs = System.currentTimeMillis() - lastStompMessageTimestamp.get();

        if (brokerRunning) {
            return Health.status(CustomHealthStatuses.HEALTHY)
                    .withDetail("service", "RakshaSphere STOMP / WebSocket Broker")
                    .withDetail("brokerEndpoint", "/ws-soc")
                    .withDetail("brokerRunning", true)
                    .withDetail("timeSinceLastMessageSec", timeSinceLastMessageMs / 1000)
                    .build();
        } else {
            return Health.status(CustomHealthStatuses.DOWN)
                    .withDetail("service", "RakshaSphere STOMP / WebSocket Broker")
                    .withDetail("brokerRunning", false)
                    .withDetail("error", "STOMP message broker is not active")
                    .build();
        }
    }
}
